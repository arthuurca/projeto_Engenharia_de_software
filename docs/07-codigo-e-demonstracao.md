# Especificação atual — Python

7. REUSO, ESPECIFICAÇÃO E CÓDIGO DOCUMENTADO

O Gateway em python/gateway/app.py entrega a interface e encaminha as rotas /api/participantes, /api/eventos, /api/inscricoes e /api/recomendacoes. /api/status consulta o estado dos quatro serviços. Cada processo possui /health.

Os serviços estão em python/services/usuarios/app.py, eventos/app.py, inscricoes/app.py e recomendacoes/app.py. Usuários cadastra e consulta participantes; Eventos cadastra e consulta eventos e obtém ocupação em Inscrições; Inscrições valida referências, data, duplicidade e capacidade; Recomendações filtra por área, data futura, vagas e ausência de inscrição prévia.

python/common.py compartilha validações, respostas de erro, conexão SQLite e cliente HTTP. python/shared.py reúne áreas e configuração. python/start.py inicia os cinco processos. Os componentes frontend/components/field.js e event-card.js e o cliente frontend/api.js são reutilizados pelos formulários, programação, inscrições e sugestões.

A inscrição verifica referências antes de BEGIN IMMEDIATE, conta inscrições e insere dentro da mesma transação, sem chamada HTTP durante a transação. Erros causam ROLLBACK. A restrição UNIQUE também protege o par participante/evento. A capacidade não muda nesta versão sem edição. As rotas internas de ocupação e IDs evitam chamadas circulares.

O código completo acompanha o repositório e o anexo da versão HTML deste relatório. Os formatos continuam sendo {dados: ...} e {erro: {codigo, mensagem}}. Dados inválidos retornam 400; inexistentes, 404; duplicidade ou lotação, 409; indisponibilidade, 503; tempo excedido, 504.

8. TELAS E FUNCIONAMENTO PASSO A PASSO

Tela 1 — Página principal e serviços: a página identifica a aplicação e apresenta o estado real de Usuários, Eventos, Inscrições e Recomendações consultado pelo Gateway. A captura da versão Python está em docs/evidencias/python-interface-integrada.png, incluindo o painel dos quatro microsserviços online.

Tela 2 — Participante: informamos nome, e-mail e área de interesse. O cadastro salvo aparece na seleção. Ao trocar o participante selecionado, suas inscrições e sugestões são atualizadas. Essa seleção é apenas um recurso da demonstração local, sem login.

Tela 3 — Organizador: informamos título, descrição, data e horário futuros, local, área e capacidade. O servidor repete as validações da interface e recusa dados inválidos.

Tela 4 — Programação: os cartões mostram dados dos eventos e vagas disponíveis. O botão Inscrever-se envia o participante e o evento ao serviço de Inscrições por meio do Gateway. O serviço valida novamente a capacidade antes de confirmar.

Tela 5 — Minhas inscrições: após a confirmação, a inscrição aparece na consulta do participante selecionado. Uma nova tentativa para o mesmo evento é recusada; o botão também passa a indicar Inscrito.

Tela 6 — Recomendações: eventos futuros da mesma área, com vagas e sem inscrição prévia são sugeridos. Depois da inscrição, o evento escolhido sai dessa lista. Sem resultados, a interface informa que não há recomendações.

A captura completa da versão Python está em docs/evidencias/python-interface-integrada.png e está incorporada ao relatório HTML. Ela mostra o cadastro, a programação, os quatro serviços online, as inscrições e as recomendações. Na verificação, usamos Aluno Teste Python e Simpósio Python; a inscrição reduziu as vagas de duas para uma e retirou o evento das sugestões. O registro está em docs/12-integracao-interface-python.md.

