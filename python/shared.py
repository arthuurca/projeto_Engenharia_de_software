"""Configuração compartilhada dos serviços Python."""

from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("DATA_DIR", ROOT / "data"))
AREAS = ("Computação", "Engenharias", "Saúde", "Ciências Humanas")

def service_urls():
    """Lê URLs e portas configuradas no ambiente.
    
    Parâmetros: nenhum. Retorno: dicionário com endereço de cada serviço.
    """
    return {
        name: os.environ.get(f"{name.upper()}_URL", f"http://127.0.0.1:{os.environ.get(name.upper() + '_PORT', port)}")
        for name, port in (("usuarios", 3001), ("eventos", 3002), ("inscricoes", 3003), ("recomendacoes", 3004))
    }
