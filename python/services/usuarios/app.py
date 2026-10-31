"""Cadastro e consulta de participantes; único dono de usuarios.sqlite."""
import re
import sqlite3
from fastapi import Request
from fastapi.responses import JSONResponse
from python.common import area, body, create_app, db, error, ident, required

connection = db("usuarios")
connection.execute("CREATE TABLE IF NOT EXISTS participantes (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, area TEXT NOT NULL) STRICT")
app = create_app("usuarios", connection)

@app.get("/participantes")
def list_participants():
    """Lista participantes em ordem de identificador.
    
    Parâmetros: nenhum. Retorno: lista de cadastros em dados, vazia quando não há registros.
    """
    return {"dados": [dict(row) for row in connection.execute("SELECT * FROM participantes ORDER BY id")]}

@app.get("/participantes/{participant_id}")
def participant(participant_id: str):
    """Consulta participant_id, um identificador positivo.
    
    Retorno: cadastro em dados. Erros: 400 para ID inválido e 404 se não existir.
    """
    row = connection.execute("SELECT * FROM participantes WHERE id=?", (ident(participant_id),)).fetchone()
    if row is None:
        error(404, "PARTICIPANTE_INEXISTENTE", "Participante não encontrado.")
    return {"dados": dict(row)}

@app.post("/participantes")
async def add_participant(request: Request):
    """Cadastra nome, e-mail e área recebidos no JSON de request.
    
    Retorno: participante persistido em dados, HTTP 201.
    Erros: 400 para campos inválidos; 409 para e-mail já cadastrado.
    O e-mail é normalizado antes da restrição UNIQUE no banco.
    """
    data = await body(request)
    name = required(data.get("nome"), "Nome", 120)
    email = required(data.get("email"), "E-mail", 254).lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        error(400, "EMAIL_INVALIDO", "Informe um e-mail válido.")
    interest = area(data.get("area"))
    try:
        cursor = connection.execute("INSERT INTO participantes(nome,email,area) VALUES(?,?,?)", (name, email, interest))
    except sqlite3.IntegrityError:
        error(409, "EMAIL_DUPLICADO", "Este e-mail já está cadastrado.")
    row = connection.execute("SELECT * FROM participantes WHERE id=?", (cursor.lastrowid,)).fetchone()
    return JSONResponse({"dados": dict(row)}, status_code=201)
