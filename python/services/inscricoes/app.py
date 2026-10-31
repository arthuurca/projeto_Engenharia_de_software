"""Inscrições com contagem e inserção atômicas no próprio banco."""
import asyncio
import sqlite3
from datetime import datetime, timezone
from fastapi import Request
from fastapi.responses import JSONResponse
from python.common import body, create_app, db, error, get, ident, iso

connection = db("inscricoes")
connection.execute("CREATE TABLE IF NOT EXISTS inscricoes(id INTEGER PRIMARY KEY, participanteId INTEGER NOT NULL, eventoId INTEGER NOT NULL, criadaEm TEXT NOT NULL, UNIQUE(participanteId,eventoId)) STRICT")
app = create_app("inscricoes", connection)

@app.get("/ocupacao")
def occupancy():
    """Conta inscrições agrupadas por evento no banco proprietário.
    
    Parâmetros: nenhum. Retorno: lista de eventoId e total, sem chamadas HTTP.
    """
    return {"dados": [dict(row) for row in connection.execute("SELECT eventoId, COUNT(*) AS total FROM inscricoes GROUP BY eventoId")]}

@app.get("/inscricoes/ids")
def registration_ids(participanteId: str | None = None):
    """Obtém IDs dos eventos inscritos para participanteId.
    
    Retorno: lista em dados; erro 400 para identificador inválido.
    Rota interna: não é encaminhada pelo Gateway.
    """
    pid = ident(participanteId)
    return {"dados": [row["eventoId"] for row in connection.execute("SELECT eventoId FROM inscricoes WHERE participanteId=?", (pid,))]}

@app.get("/inscricoes")
async def registrations(participanteId: str | None = None):
    """Consulta inscrições do participanteId informado na URL.
    
    Retorno: registros do participante com os dados de cada evento.
    Erros: 400 para ID inválido, 404 para participante inexistente e
    503/504 se os serviços necessários não responderem.
    """
    pid = ident(participanteId)
    await get("usuarios", f"/participantes/{pid}")
    rows = [dict(row) for row in connection.execute("SELECT * FROM inscricoes WHERE participanteId=? ORDER BY id", (pid,))]
    events = await asyncio.gather(*(get("eventos", f"/eventos/{row['eventoId']}") for row in rows))
    return {"dados": [{**row, "evento": event} for row, event in zip(rows, events)]}

@app.post("/inscricoes")
async def register(request: Request):
    """Confirma uma inscrição sem ultrapassar a capacidade do evento.
    
    Parâmetro: request, JSON com participanteId e eventoId.
    Retorno: inscrição criada em dados, HTTP 201.
    Erros: 400 para IDs inválidos; 404 para referências inexistentes;
    409 para duplicidade, início ou lotação; 503/504 para dependências.
    BEGIN IMMEDIATE reserva a escrita antes de contar e inserir.
    COMMIT confirma; qualquer exceção executa ROLLBACK.
    """
    data = await body(request)
    pid, eid = ident(data.get("participanteId")), ident(data.get("eventoId"))
    _, event = await asyncio.gather(get("usuarios", f"/participantes/{pid}"), get("eventos", f"/eventos/{eid}"))
    # Não há await nem chamada HTTP durante a transação. A capacidade do evento é imutável.
    connection.execute("BEGIN IMMEDIATE")
    try:
        if iso(event["inicio"]) <= datetime.now(timezone.utc):
            error(409, "EVENTO_INICIADO", "O evento já começou.")
        if connection.execute("SELECT id FROM inscricoes WHERE participanteId=? AND eventoId=?", (pid, eid)).fetchone():
            error(409, "INSCRICAO_DUPLICADA", "Você já está inscrito neste evento.")
        total = connection.execute("SELECT COUNT(*) FROM inscricoes WHERE eventoId=?", (eid,)).fetchone()[0]
        if total >= event["capacidade"]:
            error(409, "EVENTO_LOTADO", "Não há vagas disponíveis neste evento.")
        timestamp = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
        cursor = connection.execute("INSERT INTO inscricoes(participanteId,eventoId,criadaEm) VALUES(?,?,?)", (pid, eid, timestamp))
        row = dict(connection.execute("SELECT * FROM inscricoes WHERE id=?", (cursor.lastrowid,)).fetchone())
        connection.execute("COMMIT")
    except Exception:
        connection.execute("ROLLBACK")
        raise
    return JSONResponse({"dados": row}, status_code=201)
