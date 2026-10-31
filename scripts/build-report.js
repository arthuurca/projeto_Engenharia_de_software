import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from '../shared/core.js';

// Generates the text report and a self-contained printable copy with actual evidence.
const read = file => readFileSync(resolve(ROOT, file), 'utf8');
const plain = value => value.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1 — $2')
  .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '$1 ($2)').replace(/^#{1,6}\s*/gm, '').replace(/\*\*/g, '').replace(/`/g, '');
const specifications = read('docs/02-requisitos-e-product-backlog.md');
const requirements = plain(specifications.slice(specifications.indexOf('## Requisitos funcionais'), specifications.indexOf('## Itens necessários para a entrega')))
  .replace('a ocupação será integrada em PB04', 'a ocupação é integrada com PB04')
  .replace('Os contratos serão definidos na arquitetura.', 'Os contratos estão documentados na arquitetura.')
  .replace('detalhes de armazenamento serão definidos na arquitetura.', 'o armazenamento em UTC está definido na arquitetura.')
  .replace('O status inicial de todos é A fazer.', 'Todos os itens foram implementados e verificados nas sprints 1 e 2.')
  .replace('Estes requisitos complementam os oito requisitos técnicos e de entrega (RT01–RT08) do planejamento inicial (planejamento-inicial.md).', 'Os requisitos abaixo orientaram as verificações do sistema.');
const planning = read('docs/03-planejamento-do-trabalho.md');
const sprints = plain(planning.slice(planning.indexOf('### Sprint 1'), planning.indexOf('## Critério de conclusão e registro')));
const technical = plain(read('docs/07-codigo-e-demonstracao.md').split('## Telas e roteiro explicado')[0]);
const report = `ENGENHARIA DE SOFTWARE — 2026.2

SISTEMA DE GERENCIAMENTO DE EVENTOS CIENTÍFICOS
USANDO MICROSSERVIÇOS E COMPONENTES DE SOFTWARE

Arthur Carvalho e Ana Leticia Nobre

Repositório GitHub: https://github.com/arthuurca/projeto_Engenharia_de_software
Versão de revisão: 31/10/2026

1. APRESENTAÇÃO E ENUNCIADO

Desenvolvemos um sistema web para cadastrar eventos científicos, registrar participantes, controlar inscrições e recomendar eventos por área de interesse. Nosso objetivo foi construir uma versão pequena, com um fluxo completo de uso, demonstrando microsserviços, API Gateway e componentes reutilizáveis.

Os organizadores precisam divulgar os dados dos eventos e acompanhar suas vagas. Os participantes precisam consultar os eventos, realizar inscrições e encontrar atividades relacionadas aos seus interesses. Reunimos essas operações em uma interface simples.

O organizador pode cadastrar eventos e consultar a programação. O participante pode cadastrar seus dados, selecionar seu nome para a demonstração, consultar eventos, inscrever-se e acompanhar suas inscrições e recomendações. Nesta versão acadêmica local, não implementamos autenticação ou controle de permissões. Utilizamos dados fictícios.

O participante possui nome, e-mail e uma área de interesse. O evento possui título, descrição, data e horário de início, local, área e capacidade. Definimos as áreas Computação, Engenharias, Saúde e Ciências Humanas. Não incluímos edição, exclusão, cancelamento de inscrições, pagamentos, certificados, submissão de artigos, envio de e-mails ou aplicativo móvel. As recomendações usam regras simples, sem agentes de IA, que são opcionais no tema.

2. METODOLOGIA E ORGANIZAÇÃO DO TRABALHO

Organizamos o trabalho em três sprints, com um processo ágil simplificado inspirado em Scrum. Usamos o Product Backlog para definir o que construir e os Sprint Backlogs para dividir a execução. O acompanhamento considera os estados A fazer, Em andamento e Concluído. Não adotamos todos os papéis e eventos formais do Scrum; a organização foi adaptada a um trabalho em dupla.

Na divisão inicial, Arthur ficou como responsável previsto pelos microsserviços, pelo Gateway e pelas instruções de execução, e Ana pela interface, pelos componentes e pela organização do relatório. Requisitos, arquitetura, integração, testes e revisão foram definidos como atividades compartilhadas. Essa divisão representa o planejamento; os registros técnicos descrevem os resultados observados sem afirmar reuniões ou retrospectivas que não foram registradas.

Na Sprint 1, foram implementados Gateway, Usuários, Eventos e as telas de cadastro e consulta. Na Sprint 2, foram adicionados Inscrições, Recomendações e o cálculo real de vagas. Nesta revisão da Sprint 3, conferimos os testes, a documentação e os materiais de entrega. O endereço do repositório foi incluído na capa para acompanhar a publicação do código.

3. REQUISITOS E PRODUCT BACKLOG

${requirements}

4. SPRINT BACKLOGS E RESULTADOS

Mantivemos abaixo os objetivos e as tarefas que orientaram as sprints. As entregas esperadas descrevem o planejamento; a situação efetiva está registrada logo depois de cada etapa no resumo de resultados.

${sprints}

Resultados da Sprint 1: S1-01 a S1-05 implementados e documentados. PB01 e PB02 concluídos tecnicamente. PB03 foi iniciado com consulta de eventos e completado na Sprint 2.

Resultados da Sprint 2: S2-01 a S2-06 implementados e documentados. PB03 a PB06 concluídos tecnicamente, incluindo vagas, inscrição, consultas pessoais e sugestões.

Resultados da revisão da Sprint 3:
- S3-01: testes de integração aprovados, com validações e indisponibilidade.
- S3-02: regras principais, persistência e execução independente verificadas.
- S3-03: responsabilidades, endpoints, componentes e recomendação documentados.
- S3-04: capturas reais da interface e dos quatro serviços online organizadas.
- S3-05: instruções e pacote de código preparados; código organizado para publicação no repositório indicado na capa.
- S3-06: relatório e roteiro preparados; link do GitHub incluído; apresentação a ser realizada pela dupla.

5. ARQUITETURA DO SISTEMA

Navegador (HTML, CSS e JavaScript)
                  |
          API Gateway :3000
          /      |      |       \\
 Usuários   Eventos  Inscrições  Recomendações
   :3001     :3002     :3003        :3004
     |         |         |
 usuarios   eventos   inscricoes
 .sqlite    .sqlite    .sqlite

Cada serviço executa em um processo separado. A interface faz as chamadas de negócio somente pelo Gateway. Os serviços consultam as APIs dos demais quando precisam de informações; cada banco é acessado somente pelo serviço proprietário.

Inscrições consulta Usuários e a rota básica de Eventos antes de confirmar. A listagem de Eventos consulta a ocupação em Inscrições. Recomendações consulta interesses, eventos com vagas e IDs das inscrições. As rotas internas de ocupação não fazem novas consultas a Eventos, evitando chamadas circulares.

Os processos escutam localmente em 127.0.0.1, com portas configuráveis. Não utilizamos Docker ou um servidor separado de banco nesta versão.

6. TECNOLOGIAS UTILIZADAS

- Gateway: JavaScript, Node.js 24.19.0 e Express 5.3.0; sem banco.
- Usuários: JavaScript, Node.js 24.19.0 e Express 5.3.0; SQLite.
- Eventos: JavaScript, Node.js 24.19.0 e Express 5.3.0; SQLite.
- Inscrições: JavaScript, Node.js 24.19.0 e Express 5.3.0; SQLite.
- Recomendações: JavaScript, Node.js 24.19.0 e Express 5.3.0; sem banco.
- Interface: HTML, CSS e JavaScript com módulos nativos e fetch.
- Comunicação: HTTP e JSON.
- Testes: node:test com processos separados, portas e bancos temporários.
- Dependências e código: npm, package-lock.json e Git; repositório GitHub indicado na capa.

O SQLite é acessado pelo módulo node:sqlite da versão de Node indicada no README. As versões das dependências estão registradas no package-lock.json. Datas são armazenadas em UTC e exibidas no horário de Brasília.

7. REUSO, ESPECIFICAÇÃO E CÓDIGO DOCUMENTADO

${technical}

O código completo acompanha o projeto nas pastas gateway, services, shared, frontend, scripts e tests. Os comentários explicam os pontos de integração e a transação, e a documentação acima relaciona cada arquivo à sua responsabilidade. Os contratos detalhados, incluindo entradas, respostas e erros, estão em docs/04-arquitetura-e-tecnologias.md. O README apresenta exemplos de chamadas e instruções de execução.

8. TELAS E FUNCIONAMENTO PASSO A PASSO

Tela 1 — Página principal e serviços: a página identifica a aplicação e apresenta o estado real de Usuários, Eventos, Inscrições e Recomendações consultado pelo Gateway. A captura está em docs/evidencias/sprint2-servicos.png.

Tela 2 — Participante: informamos nome, e-mail e área de interesse. O cadastro salvo aparece na seleção. Ao trocar o participante selecionado, suas inscrições e sugestões são atualizadas. Essa seleção é apenas um recurso da demonstração local, sem login.

Tela 3 — Organizador: informamos título, descrição, data e horário futuros, local, área e capacidade. O servidor repete as validações da interface e recusa dados inválidos.

Tela 4 — Programação: os cartões mostram dados dos eventos e vagas disponíveis. O botão Inscrever-se envia o participante e o evento ao serviço de Inscrições por meio do Gateway. O serviço valida novamente a capacidade antes de confirmar.

Tela 5 — Minhas inscrições: após a confirmação, a inscrição aparece na consulta do participante selecionado. Uma nova tentativa para o mesmo evento é recusada; o botão também passa a indicar Inscrito.

Tela 6 — Recomendações: eventos futuros da mesma área, com vagas e sem inscrição prévia são sugeridos. Depois da inscrição, o evento escolhido sai dessa lista. Sem resultados, a interface informa que não há recomendações.

A captura completa do fluxo está em docs/evidencias/sprint2-interface.png. A cópia visual deste relatório, relatorio.html, incorpora as capturas para consulta sem depender de um site externo.

Na verificação pelo navegador, usamos um participante fictício de Computação e o evento Encontro de Pesquisa em Computação. Após a inscrição, as vagas passaram de 30 para 29, o evento apareceu nas inscrições e deixou de ser recomendado. A Mostra de Projetos de Software continuou sendo sugerida. O registro detalhado está em docs/06-registro-sprint2.md.

9. TESTES E EXECUÇÃO

Executamos a suíte npm test com 15 testes reportados: um principal e 14 subtestes, todos aprovados. A suíte verifica cadastros, validações, IDs, duplicidade, consultas por participante, vagas, recomendações, eventos iniciados, persistência após reinício e falhas de dependências.

No teste de concorrência, dois participantes solicitaram simultaneamente a última vaga. Apenas uma inscrição recebeu confirmação, e a outra foi recusada por lotação. Nos testes de persistência, encerramos e iniciamos os serviços e conferimos os mesmos registros. Os bancos usados nas verificações são temporários e separados dos dados locais.

Para simular um evento iniciado sem esperar, o teste altera somente o banco temporário de eventos. Não criamos uma rota de edição na aplicação. Ao interromper uma dependência, as operações que precisam dela retornam erro em vez de inventar vagas ou sugestões vazias.

Para executar em outra máquina:
1. Instalar Node.js 24.19.0 ou superior na linha 24, com npm.
2. Extrair o projeto e abrir um terminal na pasta que contém package.json.
3. Executar npm ci para instalar as versões do package-lock.json.
4. Executar npm test para verificar o funcionamento.
5. Executar npm start e abrir http://127.0.0.1:3000.
6. Cadastrar dados fictícios e seguir o roteiro do README.
7. Encerrar os processos com Ctrl+C. Os dados locais ficam preservados em data/.

Uma instalação nova começa sem cadastros. O pacote não inclui node_modules nem os bancos locais; os bancos são criados automaticamente. É necessário acesso à internet para instalar as dependências na primeira vez, mas não para usar o sistema depois.

10. SITUAÇÃO DA ENTREGA

O código funcional, as instruções, os backlogs, a arquitetura, a documentação dos componentes e as evidências estão organizados no projeto. O vídeo exigido especificamente para jogos não se aplica ao nosso sistema de eventos.

O repositório de entrega é https://github.com/arthuurca/projeto_Engenharia_de_software, também indicado na capa. O código, os relatórios e as evidências acompanham a entrega. Antes de enviar ao professor, vamos conferir o acesso ao repositório e ensaiar o roteiro de apresentação.

11. REFERÊNCIAS

Material da disciplina. Orientações do Projeto 2026.2, fornecidas em imagem e guardadas em fontes/orientacoes-projeto-2026-2.png.
Material da disciplina. Elementos do Relatório do Projeto utilizando Microservices. PDF fornecido para o trabalho, disponível na pasta fontes.
EXPRESS. Installing. https://expressjs.com/en/starter/installing/. Consulta em 31 out. 2026.
NODE.JS. SQLite, documentação da linha 24. https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html. Consulta em 31 out. 2026.

O tema e os integrantes foram registrados em fontes/tema-e-integrantes.md. As regras e os limites específicos são decisões do escopo do nosso projeto.
`;
writeFileSync(resolve(ROOT, 'relatorio.txt'), report, 'utf8');
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const body = report.split('\n\n').map(paragraph => {
  if (paragraph.startsWith('|')) {
    const rows = paragraph.split('\n').filter(line => line.startsWith('|') && !/^\|[\s:|-]+\|$/.test(line));
    const nowrap = /^\|\s*(?:ID|Ordem \/ ID)\s*\|/.test(rows[0]);
    return '<div class="table"><table>' + rows.map((row, index) => '<tr>' + row.split('|').slice(1, -1)
      .map((cell, column) => `<${index ? 'td' : 'th'}${nowrap && column === 0 ? ' style="white-space:nowrap"' : ''}>${escape(cell.trim())}</${index ? 'td' : 'th'}>`).join('') + '</tr>').join('') + '</table></div>';
  }
  if (paragraph.startsWith('Navegador (')) return `<pre>${escape(paragraph)}</pre>`;
  if (/^\d+\. [A-ZÁÉÍÓÚÇ]/.test(paragraph)) return `<h2>${escape(paragraph)}</h2>`;
  return `<p>${escape(paragraph)}</p>`;
}).join('\n');
const images = ['sprint2-servicos.png', 'sprint2-interface.png'].map((file, index) => {
  const data = readFileSync(resolve(ROOT, 'docs/evidencias', file)).toString('base64');
  return `<figure><figcaption>Figura ${index + 1} — ${index ? 'Interface completa: programação, inscrição, recomendação e cadastros.' : 'Quatro microsserviços em execução, consultados por HTTP.'}</figcaption><img alt="Evidência real do sistema" src="data:image/png;base64,${data}"></figure>`;
}).join('\n');
const codeFiles = ['gateway/server.js', 'services/usuarios/server.js', 'services/eventos/server.js', 'services/inscricoes/server.js',
  'services/recomendacoes/server.js', 'shared/core.js', 'shared/http.js', 'frontend/components/field.js',
  'frontend/components/event-card.js', 'frontend/api.js', 'frontend/app.js', 'scripts/start.js'];
const code = codeFiles.map(file => `<details><summary>${escape(file)}</summary><pre>${escape(read(file))}</pre></details>`).join('\n');
writeFileSync(resolve(ROOT, 'relatorio.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório — Arthur e Ana Leticia</title><style>body{font:16px/1.6 Georgia,serif;color:#172d26;max-width:1000px;margin:40px auto;padding:0 24px}p{white-space:pre-wrap;overflow-wrap:anywhere}h2{margin-top:40px;font:700 21px/1.4 system-ui;break-after:avoid}img{display:block;max-width:100%;height:auto;margin:20px auto}figure{margin:40px 0}figcaption{font:14px/1.5 system-ui}header{padding:15px;background:#eef3ec;font:14px/1.5 system-ui}a{color:#176347}table{border-collapse:collapse;width:100%;font:14px/1.5 system-ui}th,td{border:1px solid #cad6cc;padding:10px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eef3ec}.table{margin:24px 0;overflow-x:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 monospace;background:#f4f6f3;padding:16px}details{margin:15px 0;border:1px solid #cad6cc;padding:12px}summary{font:600 14px system-ui;cursor:pointer}@media print{body{max-width:none;margin:0;font-size:11pt;padding:0}header{display:none}@page{margin:18mm}img{max-width:100%}table{font-size:9pt}.table{overflow:visible}tr{break-inside:avoid}}</style></head><body><header>Cópia visual do relatorio.txt, com capturas e código em anexo. GitHub: https://github.com/arthuurca/projeto_Engenharia_de_software. <a href="#evidencias">Ir às capturas</a> · <a href="#codigo">Ir ao código</a>.</header>${body}<section id="evidencias"><h2>ANEXO A — EVIDÊNCIAS DA INTERFACE</h2>${images}</section><section id="codigo"><h2>ANEXO B — CÓDIGO DO SISTEMA</h2><p>Os arquivos abaixo correspondem à implementação entregue. A especificação de responsabilidades e entradas está na seção 7. Clique no nome de cada arquivo para consultar seu código.</p>${code}</section></body></html>`, 'utf8');
console.log('relatorio.txt e relatorio.html atualizados. Link do GitHub incluído.');

