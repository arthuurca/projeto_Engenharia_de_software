# 1. Enunciado e escopo do projeto

**Título:** Sistema de Gerenciamento de Eventos Científicos Usando Microservices e Componentes de Software

**Autores:** Arthur Carvalho e Ana Leticia Nobre  
**Disciplina:** Engenharia de Software — 2026.2

## Enunciado

O projeto consiste na modelagem e implementação de um sistema web para gerenciamento de eventos científicos, utilizando microsserviços e componentes de software reutilizáveis. O sistema permitirá cadastrar participantes e eventos, consultar os eventos disponíveis, realizar inscrições e apresentar recomendações conforme a área de interesse do participante.

A aplicação será organizada em quatro microsserviços: usuários, eventos, inscrições e recomendações. A interface se comunicará com esses serviços por meio de uma API Gateway. O reuso será demonstrado por componentes compartilhados na interface, como campos de formulário, cartões de eventos e um cliente de comunicação com a API.

A versão desenvolvida terá finalidade acadêmica e priorizará um fluxo completo de uso, com persistência de dados, validações essenciais e instruções para execução local. As recomendações serão baseadas em regras de correspondência entre áreas de interesse, dispensando agentes de inteligência artificial.

## Problema

Organizadores precisam reunir as informações dos eventos e controlar suas vagas. Participantes precisam consultar a programação, registrar suas inscrições e encontrar eventos relacionados aos seus interesses. O sistema reunirá essas operações em uma interface web simples.

## Objetivo geral

Desenvolver um sistema funcional de gerenciamento de eventos científicos que demonstre a aplicação de microsserviços, API Gateway e componentes de software reutilizáveis.

## Objetivos específicos

- Permitir o cadastro e a consulta de participantes e eventos.
- Registrar inscrições, impedindo duplicidades e inscrições acima da capacidade do evento.
- Permitir a consulta das inscrições de cada participante.
- Recomendar eventos de acordo com a área de interesse informada.
- Integrar os microsserviços por uma API Gateway e documentar seu funcionamento.

## Usuários e operações

| Usuário | Operações disponíveis |
| --- | --- |
| Organizador | Cadastrar eventos e consultar a listagem de eventos com suas vagas disponíveis. |
| Participante | Cadastrar seus dados, consultar eventos, inscrever-se, consultar suas inscrições e visualizar recomendações. |

Na demonstração, o participante será escolhido em uma lista de cadastros. As áreas do organizador e do participante serão opções de navegação, sem autenticação ou controle de permissões. Portanto, esta versão não será destinada ao uso público com dados reais.

## Funcionalidades e dados mínimos

| Funcionalidade | Dados e resultado esperado |
| --- | --- |
| Cadastro de participante | Nome, e-mail e uma área de interesse. O participante fica disponível para seleção na interface. |
| Cadastro de evento | Título, descrição, data e horário de início, local, área científica e limite de vagas. O evento passa a aparecer na listagem. |
| Consulta de eventos | Exibe título, data, local, área e vagas disponíveis. |
| Inscrição | Relaciona o participante selecionado ao evento escolhido e reserva uma vaga. |
| Consulta de inscrições | Lista os eventos nos quais o participante selecionado está inscrito. |
| Recomendação | Lista eventos futuros, com vagas e da mesma área de interesse, excluindo aqueles nos quais o participante já está inscrito. |

As áreas disponíveis serão Computação, Engenharias, Saúde e Ciências Humanas. Cada participante e cada evento terá uma única área nesta versão.

## Responsabilidades dos microsserviços

| Microsserviço | Responsabilidade |
| --- | --- |
| Usuários | Armazenar e consultar os dados dos participantes. |
| Eventos | Armazenar e consultar as informações dos eventos. |
| Inscrições | Registrar e consultar inscrições e controlar a ocupação das vagas, considerando os dados dos eventos. |
| Recomendações | Consultar interesses, eventos e inscrições para calcular as sugestões. |

Os serviços deverão executar separadamente. A API Gateway será o ponto de acesso da interface. A escolha das tecnologias, dos bancos e dos contratos de comunicação será documentada na etapa de arquitetura.

## Fluxo mínimo de demonstração

1. O organizador cadastra dois eventos de Computação e um de Saúde, todos com data futura e vagas disponíveis.
2. Um participante é cadastrado com interesse em Computação.
3. O participante é selecionado e consulta os eventos.
4. O participante se inscreve em um evento de Computação.
5. A consulta de inscrições apresenta o evento escolhido.
6. A recomendação apresenta o outro evento de Computação, sem sugerir o evento de Saúde nem aquele em que já houve inscrição.
7. Uma nova tentativa de inscrição no mesmo evento é recusada; um evento com todas as vagas ocupadas também recusa novas inscrições.

Esse roteiro descreve o comportamento esperado e deverá ser executado após a implementação. Ainda não representa uma evidência de funcionamento.

## Limites da versão

O projeto não incluirá edição ou exclusão de cadastros, cancelamento de inscrições, pagamentos, emissão de certificados, submissão de artigos, envio de e-mails, recuperação de senha, aplicativo móvel ou agentes de IA. Cada evento terá apenas uma data e horário de início, sem programação interna de palestras ou sessões.

## Condições para considerar o escopo implementado

- O fluxo mínimo funciona pela interface, com acesso aos serviços pela API Gateway.
- Os quatro microsserviços executam de forma independente.
- Os cadastros e as inscrições permanecem salvos após reiniciar o sistema.
- As validações de campos, duplicidade, data e capacidade são verificadas.
- Os componentes reutilizáveis são utilizados e identificados na documentação.
- O código, as instruções de execução e as evidências necessárias estão disponíveis para compor a entrega.

## Fontes do projeto

- [Orientações do projeto 2026.2](../fontes/orientacoes-projeto-2026-2.md).
- [Elementos do Relatório do Projeto](../fontes/Elementos%20do%20Relatorio%20do%20Projeto%20-2026-2-comMicroservices-ok.pdf).
- [Tema e integrantes](../fontes/tema-e-integrantes.md).

O escopo acima constitui a definição da versão mínima da dupla; seus detalhes não devem ser atribuídos ao professor como exigências adicionais.
