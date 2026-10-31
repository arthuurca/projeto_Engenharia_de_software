import { application, database, errors, fail, id, listen } from '../../shared/core.js';
import { get } from '../../shared/http.js';

const db = database('inscricoes');
db.exec(`CREATE TABLE IF NOT EXISTS inscricoes (
  id INTEGER PRIMARY KEY, participanteId INTEGER NOT NULL, eventoId INTEGER NOT NULL,
  criadaEm TEXT NOT NULL, UNIQUE(participanteId, eventoId)
) STRICT`);
const app = application('inscricoes', db);

// Internal endpoints only read this database, avoiding circular HTTP calls.
app.get('/ocupacao', (_req, res) => res.json({ dados: db.prepare('SELECT eventoId, COUNT(*) AS total FROM inscricoes GROUP BY eventoId').all() }));
app.get('/inscricoes/ids', (req, res) => {
  const participanteId = id(req.query.participanteId);
  res.json({ dados: db.prepare('SELECT eventoId FROM inscricoes WHERE participanteId = ?').all(participanteId).map(row => row.eventoId) });
});

app.get('/inscricoes', async (req, res) => {
  const participanteId = id(req.query.participanteId);
  await get('usuarios', `/participantes/${participanteId}`);
  const rows = db.prepare('SELECT * FROM inscricoes WHERE participanteId = ? ORDER BY id').all(participanteId);
  const dados = await Promise.all(rows.map(async row => ({ ...row, evento: await get('eventos', `/eventos/${row.eventoId}`) })));
  res.json({ dados });
});

app.post('/inscricoes', async (req, res) => {
  const participanteId = id(req.body?.participanteId);
  const eventoId = id(req.body?.eventoId);
  const [, evento] = await Promise.all([
    get('usuarios', `/participantes/${participanteId}`), get('eventos', `/eventos/${eventoId}`)
  ]);
  // All network I/O happens before locking. Capacity is immutable in this version.
  // The count and INSERT are atomic, including requests racing for the last seat.
  db.exec('BEGIN IMMEDIATE');
  let row;
  try {
    if (new Date(evento.inicio).getTime() <= Date.now()) fail(409, 'EVENTO_INICIADO', 'O evento já começou.');
    if (db.prepare('SELECT id FROM inscricoes WHERE participanteId = ? AND eventoId = ?').get(participanteId, eventoId))
      fail(409, 'INSCRICAO_DUPLICADA', 'Você já está inscrito neste evento.');
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM inscricoes WHERE eventoId = ?').get(eventoId);
    if (total >= evento.capacidade) fail(409, 'EVENTO_LOTADO', 'Não há vagas disponíveis neste evento.');
    const result = db.prepare('INSERT INTO inscricoes (participanteId, eventoId, criadaEm) VALUES (?, ?, ?)')
      .run(participanteId, eventoId, new Date().toISOString());
    row = db.prepare('SELECT * FROM inscricoes WHERE id = ?').get(Number(result.lastInsertRowid));
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  res.status(201).json({ dados: row });
});

errors(app);
listen(app, process.env.INSCRICOES_PORT || 3003, 'inscricoes', db);
