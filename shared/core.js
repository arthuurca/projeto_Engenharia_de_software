import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const AREAS = ['Computação', 'Engenharias', 'Saúde', 'Ciências Humanas'];

export function fail(status, codigo, mensagem) {
  const error = new Error(mensagem);
  Object.assign(error, { status, codigo });
  throw error;
}

export function text(value, label, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    fail(400, 'CAMPO_INVALIDO', `${label}: preencha um texto de até ${max} caracteres.`);
  return value.trim();
}

export function area(value) {
  if (!AREAS.includes(value)) fail(400, 'AREA_INVALIDA', 'Selecione uma área válida.');
  return value;
}

export function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)))
    fail(400, 'ID_INVALIDO', 'O identificador deve ser um inteiro positivo.');
  return Number(value);
}

export function database(name) {
  const path = resolve(process.env.DATA_DIR || resolve(ROOT, 'data'), `${name}.sqlite`);
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 3000 });
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  return db;
}

export function application(service, db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (_req, res) => {
    try {
      db?.prepare('SELECT 1').get();
      res.json({ status: 'ok', servico: service });
    } catch {
      res.status(503).json({ erro: { codigo: 'BANCO_INDISPONIVEL', mensagem: 'Banco de dados indisponível.' } });
    }
  });
  return app;
}

export function errors(app) {
  app.use((_req, _res, next) => {
    try { fail(404, 'ROTA_INEXISTENTE', 'Rota não encontrada.'); } catch (error) { next(error); }
  });
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error.message);
    const mensagem = error.type === 'entity.parse.failed' ? 'O corpo deve conter JSON válido.'
      : error.type === 'entity.too.large' ? 'O conteúdo enviado é muito grande.'
      : status < 500 || error.codigo ? error.message : 'Não foi possível concluir a operação.';
    res.status(status).json({ erro: { codigo: error.codigo || (status === 400 ? 'JSON_INVALIDO' : 'ERRO_INTERNO'), mensagem } });
  });
}

/** Each entry point owns its process and closes its database on termination. */
export function listen(app, port, service, db) {
  const server = app.listen(Number(port), '127.0.0.1', () => console.log(`${service}: http://127.0.0.1:${port}`));
  server.on('error', (error) => { console.error(`${service}: ${error.message}`); process.exit(1); });
  const stop = () => {
    server.close(() => { db?.close(); process.exit(0); });
    setTimeout(() => process.exit(1), 2000).unref();
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  return server;
}
