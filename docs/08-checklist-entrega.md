# Revisão final e checklist de entrega

## Resultado da revisão

O sistema e a documentação estão preparados. Código publicado na branch main de https://github.com/arthuurca/projeto_Engenharia_de_software e link real incluído na capa dos dois relatórios.

| Exigência do professor | Evidência no projeto | Situação |
| --- | --- | --- |
| Enunciado baseado em microsserviços | relatorio.txt, seção 1 | Pronto |
| Metodologia ágil e descrição do desenvolvimento | Seções 2 e 4; registros das sprints | Pronto, processo simplificado inspirado em Scrum |
| Técnicas de reuso | Seção 7; componentes e infraestrutura compartilhada | Pronto |
| Product Backlog | Seção 3; docs/02-requisitos-e-product-backlog.md | Pronto |
| Sprint Backlog de cada sprint | Seção 4; docs/03-planejamento-do-trabalho.md | Pronto, com situação real da revisão |
| Arquitetura de microsserviços | Seção 5; diagrama e contratos em docs/04 | Pronto |
| API Gateway com código documentado | gateway/server.js; seção 7; docs/07 | Pronto |
| Especificação e código dos serviços e componentes | services/, shared/, frontend/; seção 7; docs/07 | Pronto |
| Sistema de recomendação documentado | services/recomendacoes/server.js; regra e contratos documentados | Pronto |
| Tela dos microsserviços em execução | docs/evidencias/sprint2-servicos.png; cópia visual do relatório | Pronto: estado real dos quatro serviços via health |
| Linguagens e bancos por serviço | Seção 6 | Pronto, inclusive serviços sem banco |
| Telas e explicação em sequência | Seção 8; docs/07; evidências incorporadas em relatorio.html | Pronto |
| Identificação dos serviços na interface principal | Painel de microsserviços | Pronto |
| Código funcionando e instruções | npm ci, npm test, npm start; README | Pronto localmente |
| Código no GitHub | Repositório arthuurca/projeto_Engenharia_de_software, branch main | Pronto |
| Link do GitHub na capa | Endereço real em relatorio.txt e relatorio.html | Pronto |
| Referências | Seção 11; pasta fontes | Pronto para os materiais consultados |
| Vídeo no caso de jogo | Sistema de eventos, sem jogo | Não se aplica |

## Verificações da revisão

- Suíte de integração: 15 testes reportados, todos aprovados. Inclui concorrência pela última vaga, persistência, validações e falhas de dependências.
- Código e dependências separados dos bancos e dos dados locais.
- Evidências reais preservadas; não foram fabricadas reuniões ou resultados de teste.
- Relatório reorganizado como versão de revisão, com narrativa em nome dos integrantes, contratos e explicações de implementação.
- relatorio.html é uma cópia visual autossuficiente com as imagens incorporadas; relatorio.txt continua sendo o relatório textual solicitado.

O pacote da pasta entrega contém fontes, testes, lockfile, documentação e referências. Não inclui node_modules, .git, caches ou bancos locais. A verificação de instalação limpa e seus resultados constam em docs/evidencias/revisao-instalacao.txt.

## Ações finais para enviar

1. Publicação concluída no repositório escolhido pela dupla.
2. Link incluído na capa; conferir o acesso do professor ao repositório.
3. Pacote regenerado com os relatórios atualizados.
4. Conferir os dados acadêmicos que a disciplina solicitar e ensaiar o roteiro do README.

Não é necessário adicionar funcionalidades além do escopo para completar essas pendências.

## Atualização — repositório fornecido

Repositório de entrega: https://github.com/arthuurca/projeto_Engenharia_de_software
O endereço foi incluído na capa de relatorio.txt e relatorio.html. A pendência anterior refere-se ao momento em que o repositório ainda não havia sido informado. O código será enviado sem bancos locais, caches ou dependências instaladas.

