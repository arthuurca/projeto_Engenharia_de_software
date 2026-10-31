# Migração dos serviços para Python — passo 3

Implementados `python/gateway/app.py`, `python/services/usuarios/app.py`, `python/services/eventos/app.py`, `python/services/inscricoes/app.py`, `python/services/recomendacoes/app.py` e a infraestrutura em `python/common.py`.

O Gateway continua na porta 3000; os serviços usam 3001 a 3004. As URLs e portas podem ser configuradas pelas mesmas variáveis de ambiente do projeto Node.js. `DATA_DIR` permite bancos separados para testes. Cada serviço acessa somente seu próprio arquivo SQLite. Foram preservados os envelopes `{dados: ...}` e `{erro: {codigo, mensagem}}`, as rotas públicas e as rotas internas necessárias para calcular a ocupação e as recomendações.

Inscrições consulta Usuários e Eventos antes de iniciar a transação. O banco de Inscrições confere duplicidade e contagem dentro de `BEGIN IMMEDIATE` e insere antes de confirmar. Não há chamada HTTP durante essa transação. Recomendações filtra eventos da mesma área, com data futura, vagas e sem inscrição do participante.

O teste `tests/python_migration.py` passou com os cinco processos Python, portas e bancos temporários. Duas solicitações simultâneas para um evento de capacidade um resultaram em uma confirmação e uma recusa por lotação. O teste também verificou cadastro, e-mail duplicado, vagas e sugestões. A revisão completa dos critérios de aceitação, a adaptação do relatório final e a substituição da versão principal ainda serão feitas nas próximas etapas.
