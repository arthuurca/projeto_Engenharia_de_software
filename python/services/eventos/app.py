"""Cadastro e consulta de eventos, com vagas obtidas de Inscrições por HTTP."""
from datetime import datetime, timezone
from fastapi import Request
from fastapi.responses import JSONResponse
from python.common import area, body, create_app, db, error, get, ident, iso, required

connection = db("eventos")
connection.execute("CREATE TABLE IF NOT EXISTS eventos (id INTEGER PRIMARY KEY, titulo TEXT NOT NULL, descricao TEXT NOT NULL, inicio TEXT NOT NULL, local TEXT NOT NULL, area TEXT NOT NULL, capacidade INTEGER NOT NULL CHECK(capacidade>0)) STRICT")
app = create_app("eventos", connection)

@app.get("/eventos")
async def list_events():
    rows = [dict(row) for row in connection.execute("SELECT * FROM eventos ORDER BY inicio,id")]
    occupancy = {row["eventoId"]: row["total"] for row in await get("inscricoes", "/ocupacao")}
    return {"dados": [{**row, "vagasDisponiveis": row["capacidade"] - occupancy.get(row["id"], 0)} for row in rows]}

@app.get("/eventos/{event_id}")
def event(event_id: str):
    row = connection.execute("SELECT * FROM eventos WHERE id=?", (ident(event_id),)).fetchone()
    if row is None:
        error(404, "EVENTO_INEXISTENTE", "Evento não encontrado.")
    return {"dados": dict(row)}

@app.post("/eventos")
async def add_event(request: Request):
    data = await body(request)
    title = required(data.get("titulo"), "Título", 160)
    description = required(data.get("descricao"), "Descrição", 2000)
    place = required(data.get("local"), "Local", 200)
    category = area(data.get("area"))
    start = iso(data.get("inicio"))
    if start <= datetime.now(timezone.utc):
        error(400, "DATA_PASSADA", "O evento deve começar no futuro.")
    capacity = data.get("capacidade")
    if isinstance(capacity, bool) or not isinstance(capacity, int) or capacity <= 0:
        error(400, "CAPACIDADE_INVALIDA", "O limite de vagas deve ser um inteiro maior que zero.")
    start_text = start.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    cursor = connection.execute("INSERT INTO eventos(titulo,descricao,inicio,local,area,capacidade) VALUES(?,?,?,?,?,?)", (title, description, start_text, place, category, capacity))
    row = connection.execute("SELECT * FROM eventos WHERE id=?", (cursor.lastrowid,)).fetchone()
    return JSONResponse({"dados": dict(row)}, status_code=201)
