import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { ROOT } from '../shared/core.js';
import { DatabaseSync } from 'node:sqlite';

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}

test('Sprints 1 e 2 — fluxo integrado pelo Gateway e persistência real', { timeout: 45000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'eventos-sprint1-'));
  const env = { ...process.env, DATA_DIR: dir,
    USUARIOS_PORT: String(await freePort()), EVENTOS_PORT: String(await freePort()), GATEWAY_PORT: String(await freePort()),
    INSCRICOES_PORT: String(await freePort()), RECOMENDACOES_PORT: String(await freePort()) };
  const children = [];
  let log = '';
  const base = `http://127.0.0.1:${env.GATEWAY_PORT}`;
  async function start(file, port) {
    const child = spawn(process.execPath, [file], { cwd: ROOT, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(child);
    child.stdout.on('data', data => { log += data; });
    child.stderr.on('data', data => { log += data; });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(log);
      try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return child; } catch { /* wait for binding */ }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`Processo não iniciou: ${log}`);
  }
  async function api(path, body, method = body === undefined ? 'GET' : 'POST') {
    const res = await fetch(`${base}/api${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, ...(await res.json()) };
  }
  t.after(async () => {
    await Promise.all(children.map(stop));
    await rm(dir, { recursive: true, force: true });
  });
  let users = await start('services/usuarios/server.js', env.USUARIOS_PORT);
  let events = await start('services/eventos/server.js', env.EVENTOS_PORT);
  let registrations = await start('services/inscricoes/server.js', env.INSCRICOES_PORT);
  await start('services/recomendacoes/server.js', env.RECOMENDACOES_PORT);
  await start('gateway/server.js', env.GATEWAY_PORT);
  const validPerson = { nome: 'Participante de teste', email: ' TESTE@EXEMPLO.COM ', area: 'Computação' };
  const validEvent = { titulo: 'Encontro de pesquisa', descricao: 'Apresentações científicas.', inicio: new Date(Date.now() + 86400000).toISOString(), local: 'Auditório', area: 'Computação', capacidade: 20 };
  let personId, eventId;

  await t.test('interface e componentes são servidos pelo Gateway', async () => {
    for (const path of ['/', '/styles.css', '/app.js', '/components/field.js', '/components/event-card.js', '/api.js']) {
      const res = await fetch(base + path);
      assert.equal(res.status, 200, path);
    }
    const initial = await api('/eventos');
    assert.deepEqual(initial.dados, []);
    assert.deepEqual((await api('/participantes')).dados, []);
  });
  await t.test('participante válido, normalização e consulta individual', async () => {
    const result = await api('/participantes', validPerson);
    assert.equal(result.status, 201);
    assert.equal(result.dados.email, 'teste@exemplo.com');
    personId = result.dados.id;
    assert.equal((await api(`/participantes/${personId}`)).dados.nome, validPerson.nome);
    assert.equal((await api('/participantes')).dados.length, 1);
  });
  await t.test('e-mail repetido, campos ausentes e área inválida', async () => {
    assert.equal((await api('/participantes', { ...validPerson, email: 'teste@exemplo.com' })).status, 409);
    for (const changes of [{ nome: '  ' }, { email: 'invalido' }, { area: 'Outra' }])
      assert.equal((await api('/participantes', { ...validPerson, ...changes })).status, 400);
    for (const body of [{}, null, []]) assert.equal((await api('/participantes', body)).status, 400);
  });
  await t.test('evento válido, consulta e vagas calculadas pela ocupação', async () => {
    const result = await api('/eventos', validEvent);
    assert.equal(result.status, 201);
    eventId = result.dados.id;
    assert.equal((await api(`/eventos/${eventId}`)).dados.capacidade, 20);
    const list = await api('/eventos');
    assert.equal(list.dados[0].vagasDisponiveis, 20);
  });
  await t.test('datas, capacidade e textos inválidos', async () => {
    for (const changes of [
      { inicio: '2020-01-01T10:00:00Z' }, { inicio: '2099-02-30T10:00:00Z' },
      { inicio: '2099-01-01T10:00:00' }, { inicio: 'qualquer' },
      { capacidade: 0 }, { capacidade: -1 }, { capacidade: 1.5 }, { capacidade: '20' },
      { titulo: ' ' }, { descricao: '' }, { local: ' ' }, { area: 'Outra' }
    ]) assert.equal((await api('/eventos', { ...validEvent, ...changes })).status, 400, JSON.stringify(changes));
    assert.equal((await api('/eventos', {})).status, 400);
    assert.equal((await api('/eventos')).dados.length, 1);
  });
  await t.test('IDs inválidos, inexistência, JSON malformado e método não permitido', async () => {
    for (const path of ['/participantes/abc', '/eventos/0']) assert.equal((await api(path)).status, 400);
    for (const path of ['/participantes/999999', '/eventos/999999', '/inexistente']) assert.equal((await api(path)).status, 404);
    assert.equal((await api('/eventos', {}, 'DELETE')).status, 405);
    const res = await fetch(`${base}/api/eventos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).erro.codigo, 'JSON_INVALIDO');
  });
  await t.test('quatro microsserviços estão online', async () => {
    const result = await api('/status');
    assert.deepEqual(result.dados.map(row => row.estado), ['online', 'online', 'online', 'online']);
  });
  let otherId, lastSeatId, secondEventId;
  await t.test('inscrição confirmada atualiza vagas e sai das recomendações', async () => {
    otherId = (await api('/participantes', { ...validPerson, nome: 'Outra pessoa', email: 'outra@example.com' })).dados.id;
    secondEventId = (await api('/eventos', { ...validEvent, titulo: 'Segundo evento' })).dados.id;
    await api('/eventos', { ...validEvent, area: 'Saúde', titulo: 'Evento de saúde' });
    assert.deepEqual((await api(`/recomendacoes?participanteId=${personId}`)).dados.map(e => e.id), [eventId, secondEventId]);
    const result = await api('/inscricoes', { participanteId: personId, eventoId: eventId });
    assert.equal(result.status, 201);
    assert.equal((await api('/eventos')).dados.find(e => e.id === eventId).vagasDisponiveis, 19);
    assert.deepEqual((await api(`/recomendacoes?participanteId=${personId}`)).dados.map(e => e.id), [secondEventId]);
    const list = await api(`/inscricoes?participanteId=${personId}`);
    assert.equal(list.dados[0].evento.titulo, validEvent.titulo);
    assert.deepEqual((await api(`/inscricoes?participanteId=${otherId}`)).dados, []);
  });
  await t.test('duplicidade e referências inválidas não criam inscrições', async () => {
    const duplicate = await api('/inscricoes', { participanteId: personId, eventoId: eventId });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.erro.codigo, 'INSCRICAO_DUPLICADA');
    for (const body of [{ participanteId: 999999, eventoId: eventId }, { participanteId: personId, eventoId: 999999 }])
      assert.equal((await api('/inscricoes', body)).status, 404);
    for (const body of [{}, { participanteId: 0, eventoId: eventId }, { participanteId: personId, eventoId: 'abc' }])
      assert.equal((await api('/inscricoes', body)).status, 400);
    for (const path of ['/inscricoes', '/recomendacoes', '/inscricoes?participanteId=0', '/recomendacoes?participanteId=abc'])
      assert.equal((await api(path)).status, 400);
    for (const path of ['/inscricoes?participanteId=999999', '/recomendacoes?participanteId=999999'])
      assert.equal((await api(path)).status, 404);
    assert.equal((await api('/inscricoes/ids?participanteId=1')).status, 404);
    assert.equal((await api('/ocupacao')).status, 404);
    assert.equal((await api('/eventos')).dados.find(e => e.id === eventId).vagasDisponiveis, 19);
  });
  await t.test('duas solicitações simultâneas disputam a última vaga', async () => {
    lastSeatId = (await api('/eventos', { ...validEvent, titulo: 'Uma vaga', capacidade: 1 })).dados.id;
    const results = await Promise.all([personId, otherId].map(participanteId => api('/inscricoes', { participanteId, eventoId: lastSeatId })));
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal(results.find(r => r.status === 409).erro.codigo, 'EVENTO_LOTADO');
    assert.equal((await api('/eventos')).dados.find(e => e.id === lastSeatId).vagasDisponiveis, 0);
    for (const participanteId of [personId, otherId])
      assert.ok(!(await api(`/recomendacoes?participanteId=${participanteId}`)).dados.some(e => e.id === lastSeatId));
    const counts = await Promise.all([personId, otherId].map(async participanteId => (await api(`/inscricoes?participanteId=${participanteId}`)).dados.filter(row => row.eventoId === lastSeatId).length));
    assert.equal(counts.reduce((a, b) => a + b), 1);
  });
  await t.test('evento iniciado é recusado e excluído das recomendações', async () => {
    // Fixture changes only the isolated test database to simulate time passing without a long wait.
    const db = new DatabaseSync(join(dir, 'eventos.sqlite'));
    db.prepare('UPDATE eventos SET inicio = ? WHERE id = ?').run('2020-01-01T00:00:00.000Z', secondEventId);
    db.close();
    const result = await api('/inscricoes', { participanteId: personId, eventoId: secondEventId });
    assert.equal(result.status, 409);
    assert.equal(result.erro.codigo, 'EVENTO_INICIADO');
    assert.deepEqual((await api(`/recomendacoes?participanteId=${personId}`)).dados, []);
  });
  await t.test('inscrições persistem e falhas de dependências não inventam vagas', async () => {
    await stop(registrations);
    assert.equal((await api('/eventos')).status, 503);
    assert.equal((await api(`/recomendacoes?participanteId=${personId}`)).status, 503);
    assert.equal((await api(`/eventos/${eventId}`)).status, 200);
    registrations = await start('services/inscricoes/server.js', env.INSCRICOES_PORT);
    assert.ok((await api(`/inscricoes?participanteId=${personId}`)).dados.some(row => row.eventoId === eventId));
    assert.equal((await api('/eventos')).dados.find(e => e.id === eventId).vagasDisponiveis, 19);
    await stop(events);
    assert.equal((await api('/inscricoes', { participanteId: otherId, eventoId: eventId })).status, 503);
    assert.equal((await api(`/inscricoes?participanteId=${personId}`)).status, 503);
    events = await start('services/eventos/server.js', env.EVENTOS_PORT);
    assert.deepEqual((await api(`/inscricoes?participanteId=${otherId}`)).dados.filter(row => row.eventoId === eventId), []);
  });
  await t.test('dados permanecem após encerrar e reiniciar os dois serviços', async () => {
    await Promise.all([stop(users), stop(events)]);
    users = await start('services/usuarios/server.js', env.USUARIOS_PORT);
    events = await start('services/eventos/server.js', env.EVENTOS_PORT);
    assert.equal((await api(`/participantes/${personId}`)).dados.email, 'teste@exemplo.com');
    assert.equal((await api(`/eventos/${eventId}`)).dados.titulo, validEvent.titulo);
  });
  await t.test('Gateway informa indisponibilidade e não devolve falso sucesso', async () => {
    await stop(users);
    const response = await api('/participantes');
    assert.equal(response.status, 503);
    assert.equal(response.erro.codigo, 'SERVICO_INDISPONIVEL');
    assert.equal((await api('/status')).dados[0].estado, 'indisponivel');
    assert.equal((await api('/eventos')).status, 200);
  });
});
