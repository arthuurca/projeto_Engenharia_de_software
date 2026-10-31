"""Validação, respostas e comunicação compartilhadas pelos serviços."""
import re
import sqlite3
from datetime import datetime, timezone
from urllib.parse import urlencode
import httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from .shared import AREAS, DATA_DIR, service_urls

class Problem(Exception):
    """Representa um erro de negócio com status HTTP, código e mensagem."""
    def __init__(self, status, code, message):
        """Armazena status, código e mensagem usados na resposta de erro."""
        self.status, self.code, self.message = status, code, message

def error(status, code, message):
    """Interrompe a operação lançando Problem com status, código e mensagem."""
    raise Problem(status, code, message)

def ident(value):
    """Valida um identificador positivo e retorna inteiro; lança erro 400 se inválido."""
    if isinstance(value, bool) or not re.fullmatch(r"[1-9][0-9]*", str(value or "")) or int(value) > 9007199254740991:
        error(400, "ID_INVALIDO", "O identificador deve ser um inteiro positivo.")
    return int(value)

def required(value, label, limit=200):
    """Valida texto obrigatório e limite de tamanho; retorna o texto sem espaços externos."""
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit:
        error(400, "CAMPO_INVALIDO", f"{label}: preencha um texto de até {limit} caracteres.")
    return value.strip()

def area(value):
    """Valida uma área permitida e a retorna; lança erro 400 para valor desconhecido."""
    if value not in AREAS:
        error(400, "AREA_INVALIDA", "Selecione uma área válida.")
    return value

def iso(value):
    """Valida data ISO com fuso e retorna datetime em UTC; lança erro 400 se inválida."""
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})", value):
        error(400, "DATA_INVALIDA", "Informe uma data ISO válida com fuso horário.")
    try:
        date = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return date.astimezone(timezone.utc)
    except ValueError:
        error(400, "DATA_INVALIDA", "Informe uma data existente.")

def db(name):
    """Abre o banco SQLite do serviço e retorna conexão com linhas nomeadas e modo WAL."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATA_DIR / f"{name}.sqlite", timeout=3, check_same_thread=False, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    return connection

def create_app(name, connection=None):
    """Configura e retorna FastAPI com saúde, tratamento de erros e encerramento do banco."""
    app = FastAPI(title=name, docs_url=None, redoc_url=None, openapi_url=None)
    if connection is not None:
        @app.on_event("shutdown")
        def close_database():
            """Fecha a conexão SQLite no encerramento da aplicação."""
            connection.close()
    @app.exception_handler(Problem)
    async def problem_handler(_request, exc):
        """Converte Problem em JSON com o status HTTP do erro de negócio."""
        return JSONResponse({"erro": {"codigo": exc.code, "mensagem": exc.message}}, status_code=exc.status)
    @app.exception_handler(RequestValidationError)
    async def validation_handler(_request, _exc):
        """Converte falhas de validação de parâmetros em resposta JSON HTTP 400."""
        return JSONResponse({"erro": {"codigo": "CAMPO_INVALIDO", "mensagem": "Dados ou parâmetros inválidos."}}, status_code=400)
    @app.exception_handler(StarletteHTTPException)
    async def http_handler(_request, exc):
        """Padroniza respostas para rota inexistente e método não permitido."""
        code = "ROTA_INEXISTENTE" if exc.status_code == 404 else "METODO_INVALIDO" if exc.status_code == 405 else "ERRO_HTTP"
        message = "Rota não encontrada." if exc.status_code == 404 else "Método não permitido." if exc.status_code == 405 else "Falha na requisição."
        return JSONResponse({"erro": {"codigo": code, "mensagem": message}}, status_code=exc.status_code)
    @app.exception_handler(Exception)
    async def unexpected_handler(_request, _exc):
        """Retorna erro HTTP 500 sem expor detalhes internos da exceção."""
        return JSONResponse({"erro": {"codigo": "ERRO_INTERNO", "mensagem": "Não foi possível concluir a operação."}}, status_code=500)
    @app.get("/health")
    def health():
        """Retorna saúde do serviço; verifica o banco quando presente e sinaliza falha com 503."""
        try:
            if connection is not None:
                connection.execute("SELECT 1").fetchone()
            return {"status": "ok", "servico": name}
        except sqlite3.Error:
            error(503, "BANCO_INDISPONIVEL", "Banco de dados indisponível.")
    return app

async def body(request: Request):
    """Lê JSON de request; retorna dicionário ou lança erro 400/413 para conteúdo inválido."""
    try:
        if int(request.headers.get("content-length", "0")) > 32768:
            error(413, "CORPO_GRANDE", "O conteúdo enviado é muito grande.")
        result = await request.json()
    except Problem:
        raise
    except Exception:
        error(400, "JSON_INVALIDO", "O corpo deve conter JSON válido.")
    return result if isinstance(result, dict) else {}

async def get(service, path, params=None):
    """Consulta uma dependência por HTTP com limite de três segundos.
    
    Parâmetros: service identifica o serviço; path é a rota; params é a consulta opcional.
    Retorno: conteúdo do campo dados. Erros de negócio são propagados;
    conexão ou resposta inválida gera 503 e tempo excedido gera 504.
    """
    url = service_urls()[service] + path
    if params:
        url += "?" + urlencode(params)
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.get(url)
    except httpx.TimeoutException:
        error(504, "TEMPO_EXCEDIDO", f"O serviço {service} demorou para responder.")
    except httpx.RequestError:
        error(503, "SERVICO_INDISPONIVEL", f"O serviço {service} está indisponível.")
    try:
        result = response.json()
    except ValueError:
        error(503, "SERVICO_INDISPONIVEL", f"O serviço {service} retornou uma resposta inválida.")
    if not response.is_success:
        issue = result.get("erro", {})
        error(response.status_code, issue.get("codigo", "DEPENDENCIA_FALHOU"), issue.get("mensagem", f"Falha no serviço {service}."))
    return result["dados"]
