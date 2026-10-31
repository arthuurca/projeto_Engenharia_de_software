# 2. Requisitos e Product Backlog

**Projeto:** Sistema de Gerenciamento de Eventos Científicos Usando Microservices e Componentes de Software  
**Integrantes:** Arthur Carvalho e Ana Leticia Nobre

Este levantamento detalha o [escopo da versão mínima](01-enunciado-e-escopo.md). Os requisitos e critérios abaixo definem comportamentos esperados; sua implementação e validação ainda serão realizadas.

## Requisitos funcionais

| ID | Requisito | Serviço responsável |
| --- | --- | --- |
| RF01 | Cadastrar participante com nome, e-mail e uma área de interesse. | Usuários |
| RF02 | Listar participantes para selecionar quem utilizará a área do participante. | Usuários |
| RF03 | Cadastrar evento com título, descrição, data e horário de início, local, área e limite de vagas. | Eventos |
| RF04 | Listar eventos com título, data, local, área e vagas disponíveis. | Eventos, com ocupação fornecida por Inscrições |
| RF05 | Registrar uma inscrição do participante selecionado em um evento. | Inscrições |
| RF06 | Listar as inscrições do participante selecionado, apresentando os dados dos eventos. | Inscrições, com dados de Eventos |
| RF07 | Recomendar eventos de acordo com a área de interesse do participante. | Recomendações, consultando Usuários, Eventos e Inscrições |

Os serviços responsáveis poderão consultar os demais por suas APIs. Os contratos serão definidos na arquitetura. A navegação entre organizador e participante não constitui autenticação nem controle de acesso.

## Regras de negócio

| ID | Regra |
| --- | --- |
| RN01 | Todos os campos dos cadastros são obrigatórios. Textos compostos apenas por espaços são inválidos; o e-mail deve ter formato válido. |
| RN02 | O e-mail do participante deve ser único, desconsiderando maiúsculas, minúsculas e espaços nas extremidades. |
| RN03 | A data e o horário de início do evento devem ser futuros no momento do cadastro. O limite de vagas deve ser um número inteiro maior que zero. |
| RN04 | Uma inscrição exige participante e evento existentes. |
| RN05 | Só pode existir uma inscrição para cada combinação de participante e evento. |
| RN06 | Inscrições são permitidas somente antes do início do evento e enquanto houver vagas. Solicitações simultâneas não podem ultrapassar a capacidade. |
| RN07 | Recomendações incluem apenas eventos futuros, com vagas, da mesma área de interesse e sem inscrição do participante selecionado. |
| RN08 | Participantes e eventos devem ter uma área da lista fixa: Computação, Engenharias, Saúde ou Ciências Humanas. |
| RN09 | Vagas disponíveis correspondem ao limite do evento menos a quantidade de inscrições confirmadas. Uma tentativa recusada não consome vaga. |

Datas e horários serão apresentados no fuso de Brasília (America/Sao_Paulo). O sistema deve comparar instantes de maneira consistente; detalhes de armazenamento serão definidos na arquitetura.

## Product Backlog

Todos os seis itens são obrigatórios para a versão mínima definida pela dupla. A ordem abaixo considera as dependências entre funcionalidades. O status inicial de todos é **A fazer**.

| Ordem / ID | História de usuário | Requisitos | Dependências |
| --- | --- | --- | --- |
| 1 — PB01 | Como participante, quero cadastrar meus dados e selecionar meu cadastro para utilizar o sistema. | RF01, RF02; RN01, RN02, RN08 | Nenhuma |
| 2 — PB02 | Como organizador, quero cadastrar um evento para divulgá-lo. | RF03; RN01, RN03, RN08 | Nenhuma |
| 3 — PB03 | Como participante, quero consultar os eventos e suas vagas para escolher um evento. | RF04; RN09 | PB02; a ocupação será integrada em PB04 |
| 4 — PB04 | Como participante, quero me inscrever em um evento para reservar uma vaga. | RF05; RN04, RN05, RN06, RN09 | PB01, PB02, PB03 |
| 5 — PB05 | Como participante, quero consultar minhas inscrições para acompanhar meus eventos. | RF06 | PB04 |
| 6 — PB06 | Como participante, quero receber sugestões relacionadas ao meu interesse para encontrar eventos relevantes. | RF07; RN07, RN08 | PB01, PB02, PB04 |

### PB01 — Cadastro e seleção do participante

- Com nome, e-mail válido e área permitida, o cadastro é salvo e aparece na lista de participantes.
- Ao selecionar um participante, a interface identifica o cadastro usado nas inscrições e recomendações.
- Campos vazios, e-mail inválido e área não permitida são recusados com mensagem compreensível.
- Um e-mail já cadastrado é recusado, inclusive quando escrito com diferenças de maiúsculas ou espaços nas extremidades.
- Sem participantes cadastrados, a interface informa essa situação e permite acessar o cadastro.

### PB02 — Cadastro do evento

- Com todos os campos válidos, o evento é salvo e aparece na listagem.
- Campos vazios e área não permitida são recusados.
- Data passada ou igual ao instante atual é recusada.
- Capacidade zero, negativa ou fracionária é recusada.

### PB03 — Consulta dos eventos

- Cada evento apresenta título, data e horário, local, área e vagas disponíveis.
- Um evento sem inscrições apresenta todas as suas vagas disponíveis.
- Após uma inscrição confirmada, a consulta atualizada apresenta uma vaga a menos.
- Eventos iniciados ou lotados podem continuar na listagem, mas não permitem nova inscrição.
- Sem eventos cadastrados, a interface apresenta uma mensagem de lista vazia.

### PB04 — Inscrição

- Com participante e evento existentes, data futura e vaga disponível, a inscrição é confirmada e reserva exatamente uma vaga.
- Uma nova inscrição da mesma pessoa no mesmo evento é recusada sem alterar a ocupação.
- Evento lotado ou iniciado recusa a inscrição sem criar registro.
- Participante ou evento inexistente recusa a operação sem criar registro.
- Para um evento com uma vaga restante, duas solicitações simultâneas de participantes diferentes geram apenas uma confirmação.
- Sem participante selecionado, a interface orienta a seleção antes de enviar a inscrição.

### PB05 — Consulta das inscrições

- A consulta apresenta somente inscrições do participante selecionado, com título, data e local dos respectivos eventos.
- Ao trocar o participante selecionado, a listagem corresponde ao novo participante.
- Sem inscrições, a interface informa que o participante ainda não está inscrito em eventos.

### PB06 — Recomendação

- Para um participante interessado em Computação, um evento futuro dessa área, com vaga e sem inscrição prévia, aparece como sugestão.
- Eventos de outra área, iniciados, lotados ou com inscrição do participante não aparecem nas sugestões.
- Após uma inscrição, a consulta atualizada de recomendações deixa de sugerir esse evento.
- Sem eventos elegíveis, a interface informa que não há recomendações disponíveis.
- As sugestões são calculadas por regras simples, sem IA ou serviço externo.

## Requisitos técnicos e de qualidade

Estes requisitos complementam os oito requisitos técnicos e de entrega (RT01–RT08) do [planejamento inicial](planejamento-inicial.md).

| ID | Requisito | Como verificar na implementação |
| --- | --- | --- |
| RQ01 | A interface acessa as APIs de negócio exclusivamente pela API Gateway. | Inspecionar as chamadas da interface e demonstrar o encaminhamento aos serviços. |
| RQ02 | Usuários, Eventos, Inscrições e Recomendações executam separadamente e oferecem verificação de estado. | Iniciar os quatro processos e consultar suas rotas de estado; capturar a listagem dos serviços em execução. |
| RQ03 | Participantes, eventos e inscrições possuem persistência. | Cadastrar dados, reiniciar os serviços e consultar os mesmos registros. |
| RQ04 | A interface apresenta mensagens de validação e indisponibilidade sem informar sucesso quando a operação falhar. | Enviar dados inválidos e interromper um serviço necessário para uma consulta ou operação. |
| RQ05 | A interface reutiliza cartão de evento, campo de formulário e cliente de API. | Identificar seus usos no código e documentá-los no relatório. |
| RQ06 | A tela principal identifica os microsserviços utilizados. | Verificar a identificação na interface e registrar uma captura de tela. |
| RQ07 | Gateway, microsserviços, componentes e regra de recomendação têm suas responsabilidades e uso documentados. | Revisar documentação de código, endpoints e instruções de execução. |

## Itens necessários para a entrega

- Enunciado e escopo do sistema.
- Metodologia ágil escolhida e relato do desenvolvimento efetivamente realizado.
- Product Backlog e Sprint Backlog de cada sprint.
- Descrição das técnicas de reuso e dos componentes utilizados.
- Arquitetura dos microsserviços e API Gateway.
- Especificação e código documentado do Gateway, de cada microsserviço, dos componentes e da recomendação.
- Tecnologias, linguagem e banco de dados utilizados por microsserviço, indicando quando não houver banco.
- Captura mostrando os microsserviços em execução.
- Telas do sistema explicadas em sequência, com identificação dos serviços na interface principal.
- Código funcional no GitHub, com instruções de execução e link na capa do relatório.
- Referências bibliográficas utilizadas.

Essa lista organiza o material solicitado pelo professor; não significa que as entregas já estejam prontas. O vídeo específico para jogos não se aplica ao sistema de eventos.

## Verificação e acompanhamento

Os critérios de aceitação serão usados para verificar as funcionalidades durante a implementação. Cada item do backlog só passará para **Concluído** depois de funcionar integrado e de ter seus critérios verificados. Resultados reais e evidências serão registrados nas respectivas sprints.

Este levantamento mantém os limites do passo 1: sem login, edição, exclusão, cancelamento de inscrições ou funcionalidades extras.

## Fontes

- [Enunciado e escopo da dupla](01-enunciado-e-escopo.md).
- [Orientações do projeto](../fontes/orientacoes-projeto-2026-2.md).
- [Elementos do Relatório do Projeto](../fontes/Elementos%20do%20Relatorio%20do%20Projeto%20-2026-2-comMicroservices-ok.pdf).

As regras de negócio e histórias de usuário são decisões de escopo da dupla; não constituem exigências adicionais atribuídas ao professor.
