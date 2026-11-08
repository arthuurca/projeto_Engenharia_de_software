# Sistema de Gerenciamento de Eventos Científicos

Projeto da disciplina de **Engenharia de Software — 2026.2**, desenvolvido por **Arthur Carvalho e Ana Leticia Nobre**.

Aplicação web organizada em microsserviços para cadastrar eventos científicos, gerenciar inscrições e recomendar eventos conforme a área de interesse do participante.

[Consultar o relatório em PDF](output/pdf/relatorio-projeto-eventos-cientificos.pdf)

## Funcionalidades

- Cadastro e seleção de participantes.
- Cadastro e consulta de eventos científicos.
- Inscrições com controle de vagas e bloqueio de duplicidade.
- Consulta das inscrições de cada participante.
- Recomendações por área de interesse, data e disponibilidade de vagas.
- Painel com o estado dos quatro microsserviços.

## Tecnologias e arquitetura

O backend utiliza **Python 3.12, FastAPI e Uvicorn**. A comunicação entre serviços usa **HTTPX**, e a interface utiliza **HTML, CSS e JavaScript**. Os dados são armazenados em **SQLite**, com um banco próprio para cada serviço que precisa de persistência.

| Processo | Porta padrão | Responsabilidade | Banco |
| --- | --- | --- | --- |
| API Gateway | 3000 | Servir a interface e encaminhar as chamadas | Nenhum |
| Usuários | 3001 | Cadastrar e consultar participantes | `usuarios.sqlite` |
| Eventos | 3002 | Cadastrar e consultar eventos | `eventos.sqlite` |
| Inscrições | 3003 | Registrar inscrições e controlar vagas | `inscricoes.sqlite` |
| Recomendações | 3004 | Selecionar eventos por interesse | Nenhum |

A interface acessa as APIs pelo Gateway. Cada serviço executa em um processo independente e acessa somente seu próprio banco. A confirmação de inscrições usa uma transação SQLite para impedir duplicidades e inscrições acima da capacidade.

## Requisitos para executar

- Python 3.12 com `pip` e suporte a ambientes virtuais.
- Internet para instalar as dependências na primeira execução.
- Portas 3000 a 3004 disponíveis, ou configuração de portas alternativas.

O projeto executa diretamente em Python. SQLite já faz parte da biblioteca padrão; não é necessário instalar um servidor de banco. Após a instalação das dependências, o uso local não depende de internet.

## Instalação e execução

Baixe e extraia o projeto, ou clone o repositório:

```bash
git clone https://github.com/arthuurca/projeto_Engenharia_de_software.git
cd projeto_Engenharia_de_software
```

Execute os comandos na pasta que contém `requirements-python-lock.txt`.

### Windows — PowerShell

```powershell
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-python-lock.txt
.venv\Scripts\python.exe -m python.start
```

### Linux e macOS

```bash
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-python-lock.txt
.venv/bin/python -m python.start
```

Abra **[http://127.0.0.1:3000](http://127.0.0.1:3000)** no navegador. O comando inicia o Gateway e os quatro serviços. Use **Ctrl+C** no terminal para encerrar a execução.

Uma instalação nova começa sem cadastros. Os bancos são criados automaticamente na pasta `data/` e permanecem salvos após reiniciar o sistema. Essa pasta e o ambiente virtual não são enviados ao GitHub.

## Como demonstrar

1. Na área do participante, cadastre uma pessoa com interesse em **Computação** e confira o nome selecionado.
2. Na área do organizador, cadastre dois eventos futuros de Computação e um de Saúde. Informe os horários de Brasília.
3. Confira que as recomendações apresentam os eventos compatíveis com o interesse selecionado.
4. Faça uma inscrição e observe a redução das vagas, o registro em **Minhas inscrições** e a retirada do evento das sugestões.
5. Selecione outro participante para consultar suas próprias inscrições e recomendações.
6. Cadastre um evento com capacidade para uma pessoa e faça uma inscrição para demonstrar o bloqueio por lotação.

A aplicação é uma demonstração acadêmica local, sem autenticação. A seleção do participante identifica o cadastro utilizado nas operações. Utilize dados fictícios.

## Testes

No Windows:

```powershell
.venv\Scripts\python.exe tests\python_migration.py -v
```

No Linux e macOS:

```bash
.venv/bin/python tests/python_migration.py -v
```

A suíte inicia os cinco processos com portas livres e bancos temporários. Verifica cadastros, validações, inscrições, recomendações, disputa pela última vaga, persistência após reinício e falhas de dependências. Os dados usados nos testes são separados dos cadastros locais.

## Configuração opcional

As configurações são lidas das variáveis de ambiente do terminal antes da inicialização.

| Variável | Uso |
| --- | --- |
| `GATEWAY_PORT` | Porta da interface e do Gateway |
| `USUARIOS_PORT`, `EVENTOS_PORT`, `INSCRICOES_PORT`, `RECOMENDACOES_PORT` | Portas dos serviços |
| `DATA_DIR` | Pasta onde os bancos SQLite serão criados |
| `USUARIOS_URL`, `EVENTOS_URL`, `INSCRICOES_URL`, `RECOMENDACOES_URL` | Endereços explícitos para comunicação entre serviços |

Exemplo de portas alternativas no PowerShell:

```powershell
$env:GATEWAY_PORT = '3100'
$env:USUARIOS_PORT = '3101'
$env:EVENTOS_PORT = '3102'
$env:INSCRICOES_PORT = '3103'
$env:RECOMENDACOES_PORT = '3104'
.venv\Scripts\python.exe -m python.start
```

Nesse exemplo, acesse `http://127.0.0.1:3100`. Não inicie duas instâncias nas mesmas portas. Se configurar as variáveis `*_URL`, mantenha os endereços coerentes com as portas escolhidas.

## Principais rotas

| Método | Rota no Gateway | Operação |
| --- | --- | --- |
| GET / POST | `/api/participantes` | Listar / cadastrar participantes |
| GET | `/api/participantes/{id}` | Consultar participante |
| GET / POST | `/api/eventos` | Listar / cadastrar eventos |
| GET | `/api/eventos/{id}` | Consultar dados básicos de um evento |
| POST | `/api/inscricoes` | Registrar inscrição |
| GET | `/api/inscricoes?participanteId=1` | Consultar inscrições do participante |
| GET | `/api/recomendacoes?participanteId=1` | Consultar recomendações |
| GET | `/api/status` | Consultar o estado dos quatro serviços |

Cada processo também oferece a rota `/health` na sua própria porta. Respostas de sucesso usam o campo `dados`; falhas usam `erro`, com código e mensagem.

## Estrutura do projeto

```text
frontend/                     Interface e componentes reutilizáveis
python/
  gateway/                    API Gateway
  services/
    usuarios/                 Serviço de participantes
    eventos/                  Serviço de eventos
    inscricoes/               Serviço de inscrições
    recomendacoes/            Serviço de recomendações
  common.py                   Validações, banco e comunicação HTTP
  shared.py                   Configuração e áreas de interesse
  start.py                    Inicialização dos cinco processos
tests/                        Testes de integração
output/pdf/                   Relatório final
requirements-python.txt       Dependências declaradas
requirements-python-lock.txt  Versões fixadas para instalação
```

## Relatório

O [relatório final em PDF](output/pdf/relatorio-projeto-eventos-cientificos.pdf) reúne enunciado, metodologia, backlogs, arquitetura, tecnologias, telas de funcionamento, referências e código documentado em anexo.
