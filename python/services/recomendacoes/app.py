"""Sugestões por área, data, vagas e ausência de inscrição anterior."""
import asyncio
from datetime import datetime, timezone
from python.common import create_app, get, ident, iso

app = create_app("recomendacoes")

@app.get("/recomendacoes")
async def recommendations(participanteId: str | None = None):
    """Seleciona sugestões elegíveis para um participante.
    
    Parâmetro: participanteId, identificador positivo da consulta.
    Retorno: eventos futuros da mesma área, com vagas e sem inscrição prévia,
    ordenados por início e ID. Lista vazia significa ausência de sugestões.
    Erros: 400 para ID inválido, 404 se inexistente, 503/504 se dependências falharem.
    """
    pid = ident(participanteId)
    person = await get("usuarios", f"/participantes/{pid}")
    events, registered = await asyncio.gather(get("eventos", "/eventos"), get("inscricoes", "/inscricoes/ids", {"participanteId": pid}))
    excluded = set(registered)
    now = datetime.now(timezone.utc)
    rows = [event for event in events if event["area"] == person["area"] and iso(event["inicio"]) > now and event["vagasDisponiveis"] > 0 and event["id"] not in excluded]
    return {"dados": sorted(rows, key=lambda event: (event["inicio"], event["id"]))}
