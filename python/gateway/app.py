"""API Gateway com rotas permitidas e entrega da interface existente."""
import asyncio
import re
import httpx
from fastapi import Request
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from python.common import create_app, error
from python.shared import ROOT, service_urls

app = create_app("gateway")
SERVICES = ("usuarios", "eventos", "inscricoes", "recomendacoes")

@app.get("/api/status")
async def status():
    """Consulta /health dos quatro serviços em paralelo.
    
    Parâmetros: nenhum. Retorno: lista em dados com nome e estado.
    Falhas individuais são representadas por indisponivel, sem ocultar os demais.
    """
    async def probe(name):
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                response = await client.get(service_urls()[name] + "/health")
            return {"nome": name, "estado": "online" if response.is_success and response.json().get("status") == "ok" else "indisponivel"}
        except (httpx.RequestError, ValueError):
            return {"nome": name, "estado": "indisponivel"}
    return {"dados": await asyncio.gather(*(probe(name) for name in SERVICES))}

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(path: str, request: Request):
    """Encaminha uma rota pública permitida ao serviço responsável.
    
    Parâmetros: path é o caminho após /api; request contém método, consulta e corpo.
    Retorno: resposta JSON e código HTTP recebidos do serviço.
    Erros: 404 para rota não permitida; 405 para método inválido;
    503 para conexão indisponível e 504 para tempo excedido.
    """
    # Aceita participantes/eventos com ID opcional e apenas as raízes de inscrições/recomendações.
    # Caminhos internos, como /ocupacao, não são expostos.
    match = re.fullmatch(r"(participantes|eventos)(?:/[^/]+)?|(inscricoes|recomendacoes)", path)
    if match is None:
        error(404, "ROTA_INEXISTENTE", "Rota não encontrada.")
    name = path.split("/")[0]
    allowed_post = name in ("participantes", "eventos", "inscricoes") and "/" not in path
    if request.method != "GET" and not (request.method == "POST" and allowed_post):
        error(405, "METODO_INVALIDO", "Método não permitido.")
    service = "usuarios" if name == "participantes" else name
    url = service_urls()[service] + "/" + path
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            payload = await request.body() if request.method == "POST" else None
            response = await client.request(request.method, url, params=request.query_params, content=payload, headers={"Content-Type": "application/json"})
    except httpx.TimeoutException:
        error(504, "TEMPO_EXCEDIDO", "O serviço demorou para responder. Tente novamente.")
    except httpx.RequestError:
        error(503, "SERVICO_INDISPONIVEL", "Serviço indisponível. Verifique se todos os processos estão em execução.")
    return Response(response.content, status_code=response.status_code, media_type="application/json")

app.mount("/", StaticFiles(directory=ROOT / "frontend", html=True), name="frontend")
