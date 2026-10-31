"""Sugestões por área, data, vagas e ausência de inscrição anterior."""
import asyncio
from datetime import datetime, timezone
from python.common import create_app, get, ident, iso

app = create_app("recomendacoes")

@app.get("/recomendacoes")
async def recommendations(participanteId: str | None = None):
    pid = ident(participanteId)
    person = await get("usuarios", f"/participantes/{pid}")
    events, registered = await asyncio.gather(get("eventos", "/eventos"), get("inscricoes", "/inscricoes/ids", {"participanteId": pid}))
    excluded = set(registered)
    now = datetime.now(timezone.utc)
    rows = [event for event in events if event["area"] == person["area"] and iso(event["inicio"]) > now and event["vagasDisponiveis"] > 0 and event["id"] not in excluded]
    return {"dados": sorted(rows, key=lambda event: (event["inicio"], event["id"]))}
