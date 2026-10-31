# Validação da migração Python — passo 5

Comando executado na raiz:

```powershell
.venv\Scripts\python.exe tests\python_migration.py -v
```

Resultado: **dois métodos de teste aprovados**, sem erros ou falhas, em aproximadamente 21 segundos. O segundo método reúne sete cenários identificados com subTest. Não são os 15 testes da versão Node.js: esta é a suíte adaptada para processos Python reais.

## Cobertura executada

- Inicialização dos cinco processos e estado online dos quatro serviços.
- Cadastro de participantes, normalização e duplicidade de e-mail.
- Recusa de nome vazio, e-mail inválido e área inexistente.
- Cadastro de eventos e recusa de capacidade zero, negativa, fracionária ou booleana, título vazio, data inexistente, passada ou sem fuso.
- Inscrição confirmada, consulta com dados do evento, filtro pelo participante e rejeição de referências inexistentes.
- Inscrição duplicada recusada com código de negócio esperado.
- Duas solicitações simultâneas pela última vaga: exatamente uma confirmação, uma recusa e zero vagas restantes.
- Recomendações excluem lotação, inscrição prévia e outra área.
- Evento iniciado recusa inscrição; simulação feita somente no banco temporário de teste.
- Parâmetros inválidos, registros inexistentes e bloqueio de rotas internas pelo Gateway.
- Reinício de Usuários, Eventos e Inscrições; cadastros, inscrição e ocupação preservados.
- Interrupção de Inscrições: consultas de vagas e recomendações retornam 503; a consulta básica de evento continua disponível e o painel identifica a indisponibilidade.

O teste utiliza portas livres e bancos temporários, sem alterar os dados da demonstração. A verificação da interface pelo navegador está registrada em docs/12-integracao-interface-python.md.

Não foi necessária alteração das regras dos serviços para os cenários desta etapa. O resultado valida o escopo verificado, sem representar um teste de carga ou de todas as combinações possíveis de entrada. O próximo passo é atualizar os materiais de entrega para Python e preparar a substituição da versão principal.
