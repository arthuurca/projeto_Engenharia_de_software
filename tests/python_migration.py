"""Teste de integração real dos cinco processos Python."""
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]

class MigrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.storage = tempfile.TemporaryDirectory()
        cls.ports = {name: port() for name in ("USUARIOS", "EVENTOS", "INSCRICOES", "RECOMENDACOES", "GATEWAY")}
        cls.env = {**os.environ, "DATA_DIR": cls.storage.name, **{name + "_PORT": str(value) for name, value in cls.ports.items()}}
        cls.base = f"http://127.0.0.1:{cls.ports['GATEWAY']}"
        cls.processes = []
        try:
            for name in ("USUARIOS", "EVENTOS", "INSCRICOES", "RECOMENDACOES", "GATEWAY"):
                module = f"python.services.{name.lower()}.app" if name != "GATEWAY" else "python.gateway.app"
                child = subprocess.Popen([sys.executable, "-m", "uvicorn", f"{module}:app", "--host", "127.0.0.1", "--port", str(cls.ports[name])], cwd=ROOT, env=cls.env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                cls.processes.append(child)
                for _ in range(100):
                    try:
                        with urllib.request.urlopen(f"http://127.0.0.1:{cls.ports[name]}/health", timeout=1) as response:
                            if response.status == 200:
                                break
                    except urllib.error.URLError:
                        time.sleep(0.1)
                else:
                    raise RuntimeError(f"Serviço {name} não iniciou; saída {child.poll()}")
        except Exception:
            cls.stop_processes()
            cls.storage.cleanup()
            raise

    @classmethod
    def tearDownClass(cls):
        cls.stop_processes()
        for _ in range(20):
            try:
                cls.storage.cleanup()
                break
            except PermissionError:
                time.sleep(0.1)

    @classmethod
    def stop_processes(cls):
        for child in cls.processes:
            child.terminate()
        for child in cls.processes:
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()

    @classmethod
    def call(cls, path, data=None):
        body = json.dumps(data).encode() if data is not None else None
        request = urllib.request.Request(cls.base + "/api" + path, data=body, headers={"Content-Type": "application/json"})
        try:
            response = urllib.request.urlopen(request, timeout=5)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            return response.status, json.load(response)

    def test_complete_flow(self):
        self.assertEqual([row["estado"] for row in self.call("/status")[1]["dados"]], ["online"] * 4)
        participant = {"nome": "Pessoa A", "email": "  A@EXEMPLO.COM ", "area": "Computação"}
        p1 = self.call("/participantes", participant)[1]["dados"]
        self.assertEqual(p1["email"], "a@exemplo.com")
        self.assertEqual(self.call("/participantes", participant)[0], 409)
        p2 = self.call("/participantes", {**participant, "email": "b@exemplo.com"})[1]["dados"]
        event = {"titulo": "Uma vaga", "descricao": "Evento científico", "inicio": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(timespec="milliseconds").replace("+00:00", "Z"), "local": "Auditório", "area": "Computação", "capacidade": 1}
        e1 = self.call("/eventos", event)[1]["dados"]
        self.assertEqual(self.call("/eventos")[1]["dados"][0]["vagasDisponiveis"], 1)
        self.assertEqual(len(self.call(f"/recomendacoes?participanteId={p1['id']}")[1]["dados"]), 1)
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda pid: self.call("/inscricoes", {"participanteId": pid, "eventoId": e1["id"]})[0], (p1["id"], p2["id"])))
        self.assertEqual(sorted(responses), [201, 409])
        self.assertEqual(self.call("/eventos")[1]["dados"][0]["vagasDisponiveis"], 0)
        self.assertEqual(self.call("/inscricoes", {"participanteId": p1["id"], "eventoId": e1["id"]})[0], 409 if responses[0] == 201 else 409)
        self.assertEqual(self.call(f"/recomendacoes?participanteId={p1['id']}")[1]["dados"], [])
        self.assertEqual(self.call("/eventos", {**event, "inicio": "2020-01-01T10:00:00Z"})[0], 400)

if __name__ == "__main__":
    unittest.main()
