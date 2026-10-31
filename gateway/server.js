import express from 'express';
import { resolve } from 'node:path';
import { application, errors, fail, listen, ROOT } from '../shared/core.js';
import { urls } from '../shared/http.js';

const app = application('gateway');
const services = [
  { nome: 'usuarios', url: process.env.USUARIOS_URL || `http://127.0.0.1:${process.env.USUARIOS_PORT || 3001}`, implementado: true },
  { nome: 'eventos', url: process.env.EVENTOS_URL || `http://127.0.0.1:${process.env.EVENTOS_PORT || 3002}`, implementado: true },
  { nome: 'inscricoes', url: urls.inscricoes, implementado: true },
  { nome: 'recomendacoes', url: urls.recomendacoes, implementado: true }
];

app.get('/api/status', async (_req, res) => {
  const dados = await Promise.all(services.map(async service => {
    if (!service.implementado) return { nome: service.nome, estado: 'planejado', mensagem: 'Previsto para a Sprint 2' };
    try {
      const response = await fetch(`${service.url}/health`, { signal: AbortSignal.timeout(3000) });
      const body = await response.json();
      return { nome: service.nome, estado: response.ok && body.status === 'ok' ? 'online' : 'indisponivel' };
    } catch { return { nome: service.nome, estado: 'indisponivel' }; }
  }));
  res.json({ dados });
});

// Allowlisted routes: the Gateway is not an arbitrary HTTP proxy.
app.use('/api', async (req, res, next) => {
  const route = req.path;
  const match = /^\/(participantes|eventos)(?:\/[^/]+)?$/.exec(route)
    || /^\/(inscricoes|recomendacoes)$/.exec(route);
  if (!match) return next();
  if (req.method !== 'GET' && !(req.method === 'POST' && /^\/(participantes|eventos|inscricoes)$/.test(route)))
    return res.status(405).json({ erro: { codigo: 'METODO_INVALIDO', mensagem: 'Método não permitido.' } });
  const service = services.find(item => item.nome === (match[1] === 'participantes' ? 'usuarios' : match[1]));
  try {
    const response = await fetch(`${service.url}${req.url}`, {
      method: req.method, headers: { 'Content-Type': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(req.body ?? {}) : undefined,
      signal: AbortSignal.timeout(10000)
    });
    res.status(response.status).type('json').send(await response.text());
  } catch (error) {
    if (error.name === 'TimeoutError') fail(504, 'TEMPO_EXCEDIDO', 'O serviço demorou para responder. Tente novamente.');
    fail(503, 'SERVICO_INDISPONIVEL', 'Serviço indisponível. Verifique se todos os processos estão em execução.');
  }
});

app.use(express.static(resolve(ROOT, 'frontend')));
errors(app);
listen(app, process.env.GATEWAY_PORT || 3000, 'gateway');
