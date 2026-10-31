# Sistema de Gerenciamento de Eventos Científicos

Engenharia de Software 2026.2 — Arthur Carvalho e Ana Leticia Nobre.

## Estado atual: Sprint 2

Implementados: cadastros e seleção de participantes, cadastro e consulta de eventos, inscrições, controle real de vagas, consulta das inscrições e recomendações por área. A interface se comunica pela API Gateway com quatro microsserviços independentes.

A entrega final, publicação no GitHub e revisão geral do relatório fazem parte da Sprint 3.

## Executar

Requisito: Node.js 24.19.0 ou superior na linha 24, com npm. SQLite é acessado por node:sqlite, sem servidor de banco separado. Não é necessário Docker.

Na pasta do projeto:

```powershell
npm ci
npm start
```

Abra http://127.0.0.1:3000. Use Ctrl+C no terminal para encerrar o conjunto de processos. O script inicia cinco processos e encerra o conjunto se um deles terminar inesperadamente. Não execute outra instância nas mesmas portas.

Os bancos são criados automaticamente em data/ e preservados após reiniciar. Uma instalação nova começa sem cadastros; os dados locais e node_modules não entram no Git. Após instalar as dependências, a execução não precisa de internet. Use dados fictícios: a versão é acadêmica, local e sem autenticação.

| Processo | Porta | Banco próprio |
| --- | --- | --- |
| Gateway e interface | 3000 | Nenhum |
| Usuários | 3001 | data/usuarios.sqlite |
| Eventos | 3002 | data/eventos.sqlite |
| Inscrições | 3003 | data/inscricoes.sqlite |
| Recomendações | 3004 | Nenhum |

Para iniciar separadamente, execute em cinco terminais: npm run start:usuarios, npm run start:eventos, npm run start:inscricoes, npm run start:recomendacoes e npm run start:gateway.

Configuração opcional em PowerShell, antes de iniciar:

```powershell
$env:GATEWAY_PORT = '3100'
$env:USUARIOS_PORT = '3101'
$env:EVENTOS_PORT = '3102'
$env:INSCRICOES_PORT = '3103'
$env:RECOMENDACOES_PORT = '3104'
npm start
```

O Gateway e as chamadas internas acompanham essas portas. USUARIOS_URL, EVENTOS_URL, INSCRICOES_URL e RECOMENDACOES_URL permitem endereços explícitos. DATA_DIR altera a pasta dos bancos. Para terminais separados, mantenha configurações consistentes em todos os processos.

## Demonstrar o sistema

1. Cadastre um participante interessado em Computação e confira seu nome selecionado.
2. Cadastre dois eventos futuros de Computação e um de Saúde. Use o horário de Brasília.
3. Confira que as recomendações incluem apenas os eventos de Computação.
4. Clique em Inscrever-se em um evento. A capacidade permanece fixa, as vagas diminuem e a inscrição aparece em Minhas inscrições.
5. Confira que o evento escolhido deixa de aparecer nas recomendações e seu botão passa a Inscrito.
6. Troque o participante e confira as inscrições e sugestões correspondentes. Sem seleção, os botões de inscrição ficam desabilitados.
7. Para demonstrar lotação, cadastre um evento com uma vaga e faça uma inscrição. Não será possível reservar outra vaga.
8. Reinicie os processos e confira a persistência dos cadastros e inscrições.

Botões de atualização recarregam listas e estado dos serviços. Vagas e recomendações representam o momento da consulta; o serviço valida novamente a disponibilidade ao confirmar uma inscrição.

## APIs públicas

| Método | Rota no Gateway | Uso |
| --- | --- | --- |
| GET / POST | /api/participantes | Listar / cadastrar participantes. |
| GET | /api/participantes/:id | Consultar participante. |
| GET / POST | /api/eventos | Listar com vagas / cadastrar evento. |
| GET | /api/eventos/:id | Consultar dados básicos, sem ocupação. |
| POST | /api/inscricoes | Inscrever com participanteId e eventoId. |
| GET | /api/inscricoes?participanteId=1 | Listar inscrições com dados dos eventos. |
| GET | /api/recomendacoes?participanteId=1 | Listar sugestões elegíveis. |
| GET | /api/status | Estado dos quatro microsserviços. |
| GET | /health | Estado local do Gateway. Cada serviço também oferece /health na própria porta. |

POST de participante: {"nome":"Pessoa Exemplo","email":"pessoa@example.com","area":"Computação"}.

POST de evento: {"titulo":"Encontro científico","descricao":"Apresentação de pesquisas","inicio":"2027-05-20T14:00:00-03:00","local":"Auditório","area":"Computação","capacidade":20}. Utilize uma data futura quando executar.

POST de inscrição: {"participanteId":1,"eventoId":1}.

Sucesso: {"dados": ...}. Erro: {"erro":{"codigo":"...","mensagem":"..."}}. Validação: 400; registro inexistente: 404; e-mail ou inscrição repetida, evento lotado ou iniciado: 409; dependência indisponível: 503; tempo excedido: 504. Nenhuma inscrição é repetida automaticamente pelo cliente. Limite de JSON: 32 KB.

As rotas internas GET /ocupacao e GET /inscricoes/ids?participanteId=1 do serviço de inscrições não são encaminhadas pelo Gateway. Consultam apenas o banco de inscrições para evitar chamadas circulares.

## Regras principais

- E-mail normalizado e único; campos obrigatórios e áreas fixas.
- Eventos com início futuro e capacidade inteira positiva.
- Uma inscrição por participante e evento, antes do início e dentro da capacidade.
- Contagem e inserção na mesma transação SQLite BEGIN IMMEDIATE, sem chamadas HTTP durante a transação.
- Recomendações por mesma área, data futura, vagas e ausência de inscrição; ordenadas por início e ID.
- Serviços acessam somente seus próprios bancos. Dependência indisponível gera erro em vez de inventar vagas ou sugestões vazias.

## Verificar

```powershell
npm test
```

A suíte em tests/sprint1.test.js foi ampliada para as duas sprints. Inicia os cinco processos com portas e bancos temporários, sem alterar os dados locais. Verifica cadastros, validações, isolamento de consultas por participante, recomendações, persistência, concorrência pela última vaga, eventos iniciados e falhas de dependências. O cenário de evento iniciado usa uma alteração apenas no banco temporário de teste para simular a passagem do tempo.

## Código e documentação

- gateway/: API Gateway e arquivos estáticos.
- services/: quatro serviços, cada um com seu ponto de entrada.
- shared/core.js e shared/http.js: infraestrutura, validações e cliente HTTP interno.
- frontend/components/: campos e cartões utilizados nos cadastros e listagens.
- frontend/api.js: cliente HTTP da interface para o Gateway.
- scripts/start.js: inicializador dos cinco processos.
- [Arquitetura e contratos](docs/04-arquitetura-e-tecnologias.md).
- [Registro da Sprint 1](docs/05-registro-sprint1.md).
- [Registro da Sprint 2](docs/06-registro-sprint2.md).
- [Relatório](relatorio.txt).

## Material de entrega

- relatorio.txt: versão textual consolidada.
- relatorio.html: cópia visual autossuficiente, com tabelas, capturas incorporadas e anexo de código; abra diretamente no navegador.
- docs/08-checklist-entrega.md: conferência das exigências e pendências.
- entrega/projeto-eventos-cientificos.zip: pacote local preparado para revisão, sem bancos, caches ou dependências instaladas.

A publicação do código no GitHub e a inclusão do link na capa ainda estão pendentes. Não envie a capa com esse campo sem preencher. Depois de informar o repositório, atualize scripts/build-report.js e execute node scripts/build-report.js para regenerar as duas versões do relatório.

## Repositório de entrega

https://github.com/arthuurca/projeto_Engenharia_de_software

Atualização: o endereço real foi incluído na capa dos dois relatórios. A indicação anterior de GitHub pendente registra a revisão anterior ao fornecimento do repositório.
