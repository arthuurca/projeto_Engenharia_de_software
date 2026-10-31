# 3. Planejamento do trabalho

Organizamos o desenvolvimento em três sprints, usando um processo ágil simplificado inspirado em Scrum. Como somos uma dupla, vamos compartilhar as decisões e acompanhar as tarefas em um quadro com as colunas A fazer, Em andamento e Concluído.

No início de cada sprint, vamos revisar as prioridades e selecionar as tarefas. Durante o desenvolvimento, atualizaremos o quadro e conversaremos sobre dificuldades e próximos passos. Ao final, faremos uma revisão das funcionalidades e uma breve retrospectiva para registrar o que funcionou e o que precisa melhorar. Essa organização é uma adaptação para nosso trabalho acadêmico, sem a adoção de todos os papéis e eventos formais do Scrum.

## Divisão inicial

- Arthur Carvalho: microsserviços, API Gateway e instruções de execução.
- Ana Leticia Nobre: interface, componentes reutilizáveis e organização do relatório.
- Ambos: requisitos, arquitetura, integração, testes, revisão da documentação e apresentação.

Essa é a divisão prevista. Poderemos ajustar as tarefas durante o desenvolvimento e registrar as contribuições realizadas.

## Sprint Backlogs

Todas as tarefas abaixo estão inicialmente com status **A fazer**. As datas e a duração das sprints serão definidas conforme o prazo de entrega da disciplina.

Atualização de planejamento: a definição técnica da tarefa S1-01 está documentada em [Arquitetura e tecnologias](04-arquitetura-e-tecnologias.md), com diagrama, bancos e contratos das APIs. As tarefas de implementação continuam A fazer. Essa atualização registra a preparação técnica e não comprova execução ou revisão da sprint pela dupla.

Atualização posterior — Sprint 1 implementada: o resultado técnico das tarefas S1-01 a S1-05 e as verificações estão no [Registro da Sprint 1](05-registro-sprint1.md). PB01 e PB02 foram implementados; PB03 permanece parcial até a integração das vagas na Sprint 2. As indicações de status inicial abaixo preservam o planejamento original.

Atualização posterior — Sprint 2 implementada: tarefas S2-01 a S2-06 registradas em [Registro da Sprint 2](06-registro-sprint2.md). PB03 foi completado; PB04 a PB06 estão implementados e verificados. A Sprint 3 permanece planejada.

### Sprint 1 — Base e cadastros

**Objetivo:** permitir cadastrar participantes e eventos e consultar os cadastros pela interface. Itens: PB01, PB02 e PB03. A atualização das vagas após inscrições será concluída na Sprint 2.

| ID | Tarefa | Responsável previsto |
| --- | --- | --- |
| S1-01 | Escolher tecnologias e persistência; desenhar arquitetura e definir contratos das APIs. | Ambos |
| S1-02 | Organizar o repositório e implementar a API Gateway e os serviços de usuários e eventos. | Arthur |
| S1-03 | Criar telas de cadastro, seleção de participante e listagem de eventos, com componentes reutilizáveis. | Ana |
| S1-04 | Integrar as telas ao Gateway e verificar cadastros válidos, inválidos, e-mail duplicado e persistência após reinício. | Ambos |
| S1-05 | Documentar a arquitetura inicial, a execução e os resultados reais da sprint. | Ambos |

**Entrega esperada:** cadastros e listagens funcionando, com dados persistidos e comunicação pela API Gateway.

### Sprint 2 — Inscrições e recomendações

**Objetivo:** completar o fluxo do participante. Itens: PB04, PB05, PB06 e integração final de PB03.

| ID | Tarefa | Responsável previsto |
| --- | --- | --- |
| S2-01 | Implementar o serviço de inscrições com validação de existência, duplicidade, início do evento e capacidade. | Arthur |
| S2-02 | Implementar o serviço de recomendações com filtros de área, data, vagas e inscrições existentes. | Arthur |
| S2-03 | Criar e integrar as ações de inscrição e as telas de minhas inscrições e recomendações. | Ana |
| S2-04 | Integrar vagas disponíveis à listagem de eventos e identificar os serviços na tela principal. | Ambos |
| S2-05 | Verificar inscrições, isolamento da consulta por participante, recomendações e disputa simultânea pela última vaga. | Ambos |
| S2-06 | Atualizar a documentação e registrar resultados e pendências. | Ambos |

**Entrega esperada:** quatro microsserviços integrados ao Gateway, com inscrição, consulta e recomendação funcionando pela interface.

### Sprint 3 — Validação e entrega

**Objetivo:** revisar o funcionamento e preparar a entrega solicitada pelo professor.

| ID | Tarefa | Responsável previsto |
| --- | --- | --- |
| S3-01 | Executar todos os critérios de aceitação e verificar mensagens de erro e indisponibilidade. | Ambos |
| S3-02 | Corrigir falhas encontradas e revisar persistência e execução independente dos serviços. | Ambos |
| S3-03 | Revisar a documentação do Gateway, dos serviços, dos componentes e da regra de recomendação. | Ambos |
| S3-04 | Registrar telas do fluxo completo e a listagem dos microsserviços em execução. | Ana, com revisão de Arthur |
| S3-05 | Finalizar as instruções e publicar o código funcional no GitHub; validar a execução seguindo o README. | Arthur, com revisão de Ana |
| S3-06 | Completar o relatório, incluir o link do GitHub na capa e ensaiar a demonstração. | Ambos |

**Entrega esperada:** sistema verificado, código no GitHub, instruções de execução e relatório completo com evidências.

## Critério de conclusão e registro

Uma tarefa só será concluída quando estiver integrada, atender aos critérios de aceitação aplicáveis e tiver sua documentação atualizada. Se houver pendências, vamos mantê-las visíveis no quadro e replanejar sua execução.

Ao final de cada sprint, registraremos: tarefas previstas e entregues, verificações e resultados, dificuldades, pendências e melhorias para a próxima etapa. Não há resultados de implementação registrados nesta fase; este documento apresenta o planejamento.

## Referências internas

- [Enunciado e escopo](01-enunciado-e-escopo.md).
- [Requisitos e Product Backlog](02-requisitos-e-product-backlog.md).
