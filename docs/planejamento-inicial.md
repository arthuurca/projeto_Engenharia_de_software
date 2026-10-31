# Planejamento inicial do projeto

**Projeto:** Sistema de Gerenciamento de Eventos Científicos Usando Microservices e Componentes de Software

**Integrantes:** Arthur Carvalho e Ana Leticia Nobre.

Este documento define o escopo, os requisitos e o planejamento propostos. As atividades e evidências serão atualizadas conforme o trabalho realmente acontecer.

## 1. Definição do escopo

O enunciado completo, os limites e o roteiro de demonstração desta etapa estão em [Enunciado e escopo do projeto](01-enunciado-e-escopo.md).

### Problema e objetivo

A divulgação de eventos científicos e o controle de inscrições precisam de informações organizadas em um único sistema. O projeto permitirá cadastrar eventos, consultar a programação, registrar inscrições e recomendar eventos por área de interesse.

O objetivo é implementar uma versão acadêmica pequena e funcional, demonstrando microsserviços, API Gateway e componentes reutilizáveis.

### Usuários

- **Organizador:** cadastra eventos científicos.
- **Participante:** informa seus dados e sua área de interesse, consulta eventos, realiza inscrições e recebe recomendações.

Para simplificar a demonstração, a interface terá uma área do organizador e uma área do participante, com seleção do participante cadastrado. Autenticação e controle de permissões não fazem parte desta versão; essa limitação deverá constar no relatório.

### Funcionalidades da versão inicial

1. Cadastrar e listar participantes: nome, e-mail e área de interesse.
2. Cadastrar e listar eventos: título, descrição, data e horário, local, área científica e limite de vagas.
3. Inscrever um participante em um evento e listar suas inscrições.
4. Recomendar eventos da mesma área de interesse do participante.

Não fazem parte do escopo: pagamentos, certificados, submissão de artigos, envio de e-mails e aplicativo móvel.

### Organização técnica proposta

- **Serviço de usuários:** cadastro e consulta de participantes.
- **Serviço de eventos:** cadastro e consulta de eventos.
- **Serviço de inscrições:** registro e consulta de inscrições, validação de duplicidade e vagas.
- **Serviço de recomendações:** consulta interesses e eventos para aplicar a regra de recomendação.
- **API Gateway:** ponto de entrada das chamadas da interface aos serviços.
- **Interface web:** telas simples, identificando os microsserviços utilizados.
- **Componentes reutilizáveis:** cartão de evento nas listagens e recomendações; campo de formulário nos cadastros; cliente de API compartilhado pela interface.

Cada microsserviço deverá executar como processo independente, com responsabilidade definida. Tecnologias, persistência e contratos das APIs serão definidos na etapa de arquitetura.

## 2. Requisitos e Product Backlog

Os requisitos funcionais, as regras e os critérios de aceitação detalhados estão em [Requisitos e Product Backlog](02-requisitos-e-product-backlog.md).

### Regras de negócio

- RN01: campos obrigatórios devem ser preenchidos e o e-mail deve ter formato válido.
- RN02: não pode haver dois participantes com o mesmo e-mail.
- RN03: eventos devem ter data futura e limite de vagas inteiro maior que zero.
- RN04: uma inscrição exige participante e evento existentes.
- RN05: um participante não pode se inscrever duas vezes no mesmo evento.
- RN06: inscrições só são permitidas antes do início do evento e enquanto houver vagas. A validação deve impedir ultrapassar a capacidade também em solicitações simultâneas.
- RN07: recomendações devem retornar eventos futuros, com vagas, da área de interesse do participante e nos quais ele ainda não esteja inscrito.
- RN08: as áreas serão selecionadas de uma lista comum e fixa: Computação, Engenharias, Saúde e Ciências Humanas.

### Histórias de usuário

Todos os itens abaixo são necessários para o escopo mínimo. A ordem indica a sequência sugerida de implementação.

| ID | História de usuário | Critérios de aceitação |
| --- | --- | --- |
| PB01 | Como participante, quero cadastrar meus dados e interesse para utilizar o sistema. | Salva nome, e-mail e área; aparece na lista; rejeita campos inválidos e e-mail repetido. |
| PB02 | Como organizador, quero cadastrar um evento para divulgá-lo. | Salva todos os dados definidos no escopo; rejeita campos ausentes, data passada e capacidade inválida. |
| PB03 | Como participante, quero consultar eventos para escolher quais frequentar. | Exibe título, data, local, área e vagas disponíveis; informa quando não há eventos. |
| PB04 | Como participante, quero me inscrever em um evento para reservar minha vaga. | Confirma a inscrição; atualiza vagas; rejeita duplicidade, evento iniciado, lotação e identificadores inexistentes. |
| PB05 | Como participante, quero consultar minhas inscrições para acompanhar meus eventos. | Exibe apenas inscrições do participante selecionado e os dados dos eventos; informa quando não há inscrições. |
| PB06 | Como participante, quero receber sugestões conforme meu interesse para encontrar eventos relevantes. | Aplica RN07; informa quando não há sugestões; funciona com regras simples. |

### Requisitos técnicos e de entrega

- RT01: a interface acessa os serviços pela API Gateway.
- RT02: os quatro microsserviços executam de forma independente e oferecem uma rota para verificar seu estado.
- RT03: participantes, eventos e inscrições permanecem salvos após reiniciar o sistema.
- RT04: erros de validação e indisponibilidade são apresentados com mensagens compreensíveis.
- RT05: o código documenta os endpoints, as responsabilidades dos serviços, os componentes e a regra de recomendação.
- RT06: a tela principal identifica os microsserviços utilizados.
- RT07: o repositório contém instruções suficientes para instalar, iniciar e demonstrar o projeto.
- RT08: o relatório inclui enunciado, metodologia, reuso, relato do desenvolvimento, Product Backlog, backlog de cada sprint, arquitetura, Gateway, especificações e código documentado, recomendação, tecnologias e bancos por serviço, telas explicadas, serviços em execução e referências. A capa inclui o link do GitHub.

## 3. Planejamento do trabalho

As tarefas de cada sprint e o acompanhamento previsto estão detalhados em [Planejamento do trabalho](03-planejamento-do-trabalho.md). A versão consolidada dos três passos está em [relatorio.txt](../relatorio.txt).

### Metodologia

Será utilizado um processo ágil simplificado inspirado em Scrum, adequado à dupla, com três sprints. Para cada sprint, a dupla selecionará os itens, acompanhará as tarefas em um quadro e fará uma revisão do resultado e uma breve retrospectiva.

Quadro sugerido: **A fazer → Em andamento → Concluído**. Datas e duração serão definidas quando o prazo de entrega for conhecido. Não serão registrados encontros, testes ou resultados que não tenham ocorrido.

### Divisão proposta de responsabilidades

| Integrante | Responsabilidade principal |
| --- | --- |
| Arthur Carvalho | Microsserviços, API Gateway e instruções de execução. |
| Ana Leticia Nobre | Interface, componentes reutilizáveis e organização do relatório. |
| Ambos | Requisitos, arquitetura, integração, testes, revisão do relatório e apresentação. |

Essa divisão é uma proposta inicial e pode ser ajustada pela dupla.

### Sprint Backlogs iniciais

| Sprint | Itens selecionados | Tarefas | Entrega e verificação |
| --- | --- | --- | --- |
| 1 — Base e cadastros | PB01, PB02, PB03; RT01–RT03, parcialmente | Definir tecnologias, arquitetura e APIs; preparar repositório; implementar Gateway, serviços de usuários e eventos, persistência e telas de cadastro/listagem. | Cadastrar participante e evento pela interface via Gateway; consultar os dados após reiniciar os serviços; registrar arquitetura e instruções iniciais. |
| 2 — Inscrições e recomendação | PB04, PB05, PB06; completar RT01–RT03 | Implementar serviços de inscrições e recomendações; integrar telas; aplicar regras de vagas, duplicidade e interesses; reutilizar cartão de evento e campos de formulário. | Demonstrar inscrição, consulta e recomendações; verificar rejeição de duplicidade, evento iniciado e excesso de vagas, inclusive solicitações simultâneas. |
| 3 — Validação e entrega | RT04–RT08 e revisão de PB01–PB06 | Validar fluxo completo e erros; corrigir falhas; documentar código; capturar telas e serviços em execução; finalizar relatório e GitHub; ensaiar apresentação. | Executar o sistema seguindo o README; revisar critérios de aceitação; confirmar evidências e link do GitHub na capa. |

### Critério de conclusão de uma tarefa

Uma tarefa será concluída quando funcionar integrada, atender aos critérios aplicáveis, tiver sido verificada e possuir a documentação necessária. Cada sprint deverá registrar o que foi planejado, o que foi realmente entregue, as verificações feitas e eventuais pendências.

### Fontes utilizadas no planejamento

- [Orientações do projeto 2026.2](../fontes/orientacoes-projeto-2026-2.md).
- [Elementos do Relatório do Projeto](../fontes/Elementos%20do%20Relatorio%20do%20Projeto%20-2026-2-comMicroservices-ok.pdf).
- [Tema e integrantes fornecidos pelo usuário](../fontes/tema-e-integrantes.md).

O vídeo mencionado no PDF é específico para projetos de jogos e não se aplica a este sistema.
