# Preparação da migração para Python

A branch `codex/migracao-python` preserva a versão Node.js na tag `versao-nodejs-1.0`. Atualização do passo 3: as cinco aplicações Python foram implementadas. A interface existente pode utilizar o Gateway Python sem mudar as rotas.

Python alvo: 3.12. Dependências: FastAPI e Uvicorn, declaradas em `requirements-python.txt`. A interface HTML/CSS/JavaScript e os contratos HTTP atuais serão reaproveitados. Cada serviço continuará com seu banco SQLite, usando a biblioteca padrão `sqlite3`.

No PowerShell, na raiz do projeto:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-python.txt
.venv\Scripts\python.exe -m python.start
```

`python.start` inicia Usuários (3001), Eventos (3002), Inscrições (3003), Recomendações (3004) e Gateway (3000). As portas podem ser alteradas pelas variáveis de ambiente existentes. Se a versão Node.js estiver usando as portas padrão, encerre-a antes ou escolha outras portas para Python.

As rotas de participantes, eventos, inscrições, recomendações, estado e saúde preservam os contratos JSON da versão Node.js. Cada serviço usa seu próprio banco SQLite; o Gateway entrega `frontend/` e encaminha as chamadas permitidas. O serviço de inscrições usa `BEGIN IMMEDIATE` para conferir vagas e inserir o registro em uma operação atômica.

Verificação desta etapa:

```powershell
.venv\Scripts\python.exe tests\python_migration.py
```

O teste inicia os cinco processos em portas livres e com bancos temporários. Confere cadastro, e-mail duplicado, evento, vagas, recomendação, duas inscrições simultâneas disputando a última vaga e data inválida. O teste passou. A migração da interface e a revisão ampliada de testes e documentação ainda pertencem aos próximos passos.
