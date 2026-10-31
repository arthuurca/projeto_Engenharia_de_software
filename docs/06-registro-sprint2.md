# Registro técnico — Sprint 2

Data: 31/10/2026. Registro da implementação e das verificações no projeto, sem atribuir reuniões ou retrospectivas não realizadas aos integrantes.

## Entregas

- Inscrições na porta 3003, com banco próprio, consulta por participante e controle de capacidade.
- Recomendações na porta 3004, por regras simples, sem banco.
- API Gateway com rotas públicas dos quatro serviços e verificação de estado.
- Listagem de eventos com vagas reais, obtidas pela ocupação registrada em Inscrições.
- Interface com inscrição, minhas inscrições e recomendações. Seleção de participante atualiza as listas; respostas antigas são descartadas quando a seleção muda.
- Cartão de evento reutilizado na programação, nas inscrições e nas recomendações; campos de formulário e cliente HTTP continuam compartilhados.
- Inicialização dos cinco processos com npm start e comandos individuais para cada serviço.

## Controle de vagas

A validação da existência do participante e do evento acontece antes da transação. Dentro de BEGIN IMMEDIATE, o serviço verifica o início do evento, duplicidade e ocupação, insere e confirma. Não há chamadas HTTP nem await durante essa transação. A capacidade permanece imutável nesta versão sem edição; vagas são derivadas da contagem, sem contador duplicado em outro banco.

As rotas internas /ocupacao e /inscricoes/ids consultam somente o banco de Inscrições. A rota básica /eventos/:id não consulta inscrições. Essa separação evita uma cadeia circular de chamadas. O Gateway não encaminha as rotas internas.

## Situação do backlog

| Item | Resultado técnico |
| --- | --- |
| S2-01 | Serviço de inscrições implementado com regras de existência, início, duplicidade e capacidade. |
| S2-02 | Recomendações implementadas com filtros de área, data, vagas e inscrições prévias. |
| S2-03 | Ação de inscrição e consultas pessoais integradas à interface. |
| S2-04 | Vagas integradas à programação e quatro serviços identificados na tela principal. |
| S2-05 | Verificações de integração aprovadas, incluindo disputa pela última vaga. |
| S2-06 | README, relatório e este registro atualizados. |

PB03 foi completado com vagas e integração de inscrições; PB04, PB05 e PB06 foram implementados. A revisão final da entrega e a publicação no GitHub continuam na Sprint 3.

## Testes executados

`npm test`: 15 testes reportados (um principal e 14 subtestes), todos aprovados. A suíte original foi ampliada para as duas sprints e usa cinco processos, portas e bancos temporários.

Além das verificações da Sprint 1, foram cobertos:

- Inscrição confirmada reduz vagas e remove o evento das sugestões.
- Consulta de inscrições apresenta dados do evento e separa os registros por participante.
- Duplicidade, referências inexistentes e IDs inválidos são recusados sem consumir vagas.
- Dois participantes disputam simultaneamente uma vaga; resultados: uma resposta 201 e uma 409; a ocupação final é exatamente um.
- Evento lotado não aparece nas recomendações.
- Evento iniciado recusa inscrição e não aparece nas sugestões. O teste altera apenas o banco temporário de eventos para simular passagem do tempo; não existe rota de edição no sistema.
- Eventos de outra área não são sugeridos; nenhum resultado elegível retorna lista vazia.
- Inscrições permanecem após reiniciar o serviço.
- Interromper Inscrições faz listagens que precisam de vagas e recomendações retornarem 503, em vez de dados fabricados; consulta básica do evento continua disponível.
- Interromper Eventos impede novas inscrições e consultas que precisam de seus dados, sem criar inscrição indevida.
- Os quatro serviços aparecem online na consulta de estado e rotas internas não são expostas pelo Gateway.

Também foi verificada a sintaxe dos 13 arquivos JavaScript do projeto.

## Verificação no navegador e evidências

Foi utilizado o Participante Demonstração, com interesse em Computação. Cadastramos o evento fictício Mostra de Projetos de Software e verificamos sua recomendação. Ao inscrever esse participante no Encontro de Pesquisa em Computação, a interface apresentou confirmação, reduziu as vagas de 30 para 29, mostrou a inscrição em Minhas inscrições e manteve apenas a Mostra nas sugestões. Após recarregar a página, a inscrição continuou visível.

- [Interface completa](evidencias/sprint2-interface.png).
- [Tela com os quatro microsserviços online](evidencias/sprint2-servicos.png).
- [Consulta de estado e saúde por HTTP](evidencias/sprint2-status.json).

A evidência de serviços é a consulta real de /health de cada processo, apresentada na interface. Não foi possível consultar o inventário de processos do Windows por falta de acesso; não foi produzida uma listagem fictícia. A captura do terminal com os processos poderá complementar a entrega final.

## Limites e próximos passos

As vagas exibidas são uma consulta momentânea; a confirmação sempre valida novamente a capacidade. A seleção de participante continua sendo um recurso de demonstração, sem autenticação. Não há cancelamento, edição ou exclusão, conforme o escopo.

Na Sprint 3, revisar os critérios de aceitação, completar as explicações das telas e do código, organizar a entrega no GitHub e inserir seu link na capa do relatório. Este registro não substitui essa revisão final.
