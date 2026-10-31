"""Inicializa os cinco processos Python quando as aplicações forem migradas."""

import importlib.util
import os
import subprocess
import sys
from pathlib import Path

SERVICES = (
    ("usuarios", "python.services.usuarios.app", "USUARIOS_PORT", 3001),
    ("eventos", "python.services.eventos.app", "EVENTOS_PORT", 3002),
    ("inscricoes", "python.services.inscricoes.app", "INSCRICOES_PORT", 3003),
    ("recomendacoes", "python.services.recomendacoes.app", "RECOMENDACOES_PORT", 3004),
    ("gateway", "python.gateway.app", "GATEWAY_PORT", 3000),
)

def main():
    missing = [name for name, module, _, _ in SERVICES if importlib.util.find_spec(module) is None]
    if missing:
        print("Aplicações ainda não implementadas: " + ", ".join(missing), file=sys.stderr)
        return 1
    children = []
    root = Path(__file__).resolve().parent.parent
    try:
        for name, module, variable, default in SERVICES:
            port = os.environ.get(variable, str(default))
            child = subprocess.Popen([sys.executable, "-m", "uvicorn", f"{module}:app", "--host", "127.0.0.1", "--port", port], cwd=root)
            children.append(child)
            print(f"{name}: http://127.0.0.1:{port}")
        while True:
            for child in children:
                if child.poll() is not None:
                    return child.returncode or 1
            __import__("time").sleep(0.3)
    except KeyboardInterrupt:
        return 0
    finally:
        for child in children:
            if child.poll() is None:
                child.terminate()
        for child in children:
            try:
                child.wait(timeout=3)
            except subprocess.TimeoutExpired:
                child.kill()

if __name__ == "__main__":
    raise SystemExit(main())
