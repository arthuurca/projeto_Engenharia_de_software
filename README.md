# Eventos científicos — Python

Arthur Carvalho e Ana Leticia Nobre · Engenharia de Software 2026.2.

Backend em Python 3.12, FastAPI e Uvicorn. Interface em HTML, CSS e JavaScript. São cinco processos locais: Gateway (3000), Usuários (3001), Eventos (3002), Inscrições (3003) e Recomendações (3004). Cada serviço com persistência acessa seu próprio banco SQLite.

## Instalar e executar no Windows

```powershell
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-python-lock.txt
.venv\Scripts\python.exe tests\python_migration.py -v
.venv\Scripts\python.exe -m python.start
```

Abra http://127.0.0.1:3000. Encerre com Ctrl+C. Os bancos são criados em data/ e preservados ao reiniciar. Uma instalação nova começa vazia. Use dados fictícios; a seleção do participante é um recurso de demonstração sem autenticação.

Em Linux/macOS, use python3.12 para criar o ambiente e .venv/bin/python nos comandos seguintes. sqlite3 já faz parte do Python; não é necessário servidor de banco ou Node.js para executar esta versão.

Variáveis opcionais: GATEWAY_PORT, USUARIOS_PORT, EVENTOS_PORT, INSCRICOES_PORT, RECOMENDACOES_PORT, DATA_DIR e URLs internas USUARIOS_URL, EVENTOS_URL, INSCRICOES_URL, RECOMENDACOES_URL. Configure-as antes de iniciar e utilize as mesmas configurações nos processos. Cada aplicação também pode ser iniciada por python -m uvicorn python.services.usuarios.app:app --host 127.0.0.1 --port 3001, substituindo módulo e porta para os demais serviços; o Gateway é python.gateway.app:app.

## Demonstrar

1. Cadastre um participante com interesse em Computação.
2. Cadastre dois eventos futuros de Computação e um de Saúde.
3. Confira as sugestões por área e inscreva o participante em um evento.
4. Confira a redução de vagas, a consulta de inscrições e a retirada do evento das sugestões.
5. Troque o participante para verificar consultas individuais.
6. Cadastre um evento de uma vaga para demonstrar lotação.

A interface acessa somente o Gateway. As rotas são /api/participantes, /api/eventos, /api/inscricoes e /api/recomendacoes. As consultas pessoais recebem participanteId. O painel /api/status consulta a saúde real dos serviços. Cada processo oferece /health. Respostas usam dados ou erro; a inscrição é confirmada em transação SQLite, com proteção contra duplicidade e excesso de capacidade.

## Relatórios e validação

- relatorio.txt: relatório consolidado com link do GitHub na capa.
- relatorio.html: versão visual com captura real Python e código em anexo.
- docs/13-validacao-python.md: cobertura e resultado dos testes.
- docs/12-integracao-interface-python.md: verificação pelo navegador.
- python/build_report.py: gerador da versão visual; execute python -m python.build_report.

A suíte usa cinco processos com portas e bancos temporários, validando cadastros, vagas, recomendações, concorrência, persistência e falhas de dependências. Os registros históricos das sprints descrevem o desenvolvimento original; a implementação atual está em python/. A versão Node.js está preservada na tag versao-nodejs-1.0.

Repositório: https://github.com/arthuurca/projeto_Engenharia_de_software
