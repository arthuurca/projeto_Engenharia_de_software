"""Teste de integração real dos cinco processos Python."""
import json
import os
import socket
import sqlite3
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
        self.assertEqual(self.call("/inscricoes", {"participanteId": p1["id"], "eventoId": e1["id"]})[0], 409)
        self.assertEqual(self.call(f"/recomendacoes?participanteId={p1['id']}")[1]["dados"], [])
        self.assertEqual(self.call("/eventos", {**event, "inicio": "2020-01-01T10:00:00Z"})[0], 400)

    def test_extended_acceptance(self):
        person = {"nome": "Pessoa C", "email": "c@example.com", "area": "Computação"}
        event = {"titulo": "Pesquisa", "descricao": "Trabalhos", "inicio": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(timespec="milliseconds"), "local": "Sala", "area": "Computação", "capacidade": 10}
        with self.subTest("validações dos cadastros"):
            for change in ({"nome": " "}, {"email": "erro"}, {"area": "Outra"}):
                self.assertEqual(self.call("/participantes", {**person, **change})[0], 400)
            for change in ({"capacidade": 0}, {"capacidade": -1}, {"capacidade": 1.5}, {"capacidade": True}, {"titulo": " "}, {"inicio": "2099-02-30T10:00:00Z"}, {"inicio": "2099-01-01T10:00:00"}):
                self.assertEqual(self.call("/eventos", {**event, **change})[0], 400)
        pid = self.call("/participantes", person)[1]["dados"]["id"]
        eid = self.call("/eventos", event)[1]["dados"]["id"]
        other = self.call("/eventos", {**event, "area": "Saúde"})[1]["dados"]["id"]
        with self.subTest("inscrição e isolamento por participante"):
            self.assertEqual(self.call("/inscricoes", {"participanteId": pid, "eventoId": eid})[0], 201)
            duplicate = self.call("/inscricoes", {"participanteId": pid, "eventoId": eid})
            self.assertEqual(duplicate[1]["erro"]["codigo"], "INSCRICAO_DUPLICADA")
            rows = self.call(f"/inscricoes?participanteId={pid}")[1]["dados"]
            self.assertEqual([row["eventoId"] for row in rows], [eid])
            self.assertEqual(rows[0]["evento"]["titulo"], event["titulo"])
            self.assertEqual(self.call("/inscricoes", {"participanteId": 999999, "eventoId": eid})[0], 404)
            self.assertEqual(self.call("/inscricoes", {"participanteId": pid, "eventoId": 999999})[0], 404)
        with self.subTest("recomendações excluem outra área e inscrição prévia"):
            ids = [row["id"] for row in self.call(f"/recomendacoes?participanteId={pid}")[1]["dados"]]
            self.assertNotIn(eid, ids)
            self.assertNotIn(other, ids)
        with self.subTest("evento iniciado"):
            # Somente o banco temporário é alterado para simular a passagem do tempo.
            with sqlite3.connect(Path(self.storage.name) / "eventos.sqlite") as fixture:
                fixture.execute("UPDATE eventos SET inicio=? WHERE id=?", ("2020-01-01T00:00:00.000Z", other))
            result = self.call("/inscricoes", {"participanteId": pid, "eventoId": other})
            self.assertEqual(result[1]["erro"]["codigo"], "EVENTO_INICIADO")
        with self.subTest("parâmetros, inexistência e rotas internas"):
            for path in ("/inscricoes", "/recomendacoes", "/eventos/0", "/participantes/abc"):
                self.assertEqual(self.call(path)[0], 400)
            for path in ("/ocupacao", "/inscricoes/ids", "/eventos/999999", "/recomendacoes?participanteId=999999"):
                self.assertEqual(self.call(path)[0], 404)
        with self.subTest("persistência após reiniciar os serviços"):
            for index in (0, 1, 2):
                self.restart(index)
            self.assertEqual(self.call(f"/participantes/{pid}")[1]["dados"]["email"], person["email"])
            self.assertEqual(self.call(f"/inscricoes?participanteId={pid}")[1]["dados"][0]["eventoId"], eid)
            self.assertEqual(next(row for row in self.call("/eventos")[1]["dados"] if row["id"] == eid)["vagasDisponiveis"], 9)
        with self.subTest("dependência indisponível não inventa vagas"):
            child = self.processes[2]
            child.terminate()
            child.wait(timeout=5)
            try:
                self.assertEqual(self.call("/eventos")[0], 503)
                self.assertEqual(self.call(f"/recomendacoes?participanteId={pid}")[0], 503)
                self.assertEqual(self.call(f"/eventos/{eid}")[0], 200)
                self.assertEqual(self.call("/status")[1]["dados"][2]["estado"], "indisponivel")
            finally:
                self.restart(2)

    def restart(self, index):
        child = self.processes[index]
        if child.poll() is None:
            child.terminate()
            child.wait(timeout=5)
        self.processes[index] = subprocess.Popen(child.args, cwd=ROOT, env=self.env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        service = ("USUARIOS", "EVENTOS", "INSCRICOES", "RECOMENDACOES", "GATEWAY")[index]
        for _ in range(100):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{self.ports[service]}/health", timeout=1) as response:
                    if response.status == 200:
                        return
            except urllib.error.URLError:
                time.sleep(0.1)
        self.fail(f"Serviço {service} não reiniciou")

if __name__ == "__main__":
    unittest.main()
