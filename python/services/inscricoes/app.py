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
    return {"dados": [dict(row) for row in connection.execute("SELECT eventoId, COUNT(*) AS total FROM inscricoes GROUP BY eventoId")]}

@app.get("/inscricoes/ids")
def registration_ids(participanteId: str | None = None):
    pid = ident(participanteId)
    return {"dados": [row["eventoId"] for row in connection.execute("SELECT eventoId FROM inscricoes WHERE participanteId=?", (pid,))]}

@app.get("/inscricoes")
async def registrations(participanteId: str | None = None):
    pid = ident(participanteId)
    await get("usuarios", f"/participantes/{pid}")
    rows = [dict(row) for row in connection.execute("SELECT * FROM inscricoes WHERE participanteId=? ORDER BY id", (pid,))]
    events = await asyncio.gather(*(get("eventos", f"/eventos/{row['eventoId']}") for row in rows))
    return {"dados": [{**row, "evento": event} for row, event in zip(rows, events)]}

@app.post("/inscricoes")
async def register(request: Request):
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
