import { application, area, database, errors, fail, id, listen, text } from '../../shared/core.js';
import { get } from '../../shared/http.js';

const db = database('eventos');
db.exec(`CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY, titulo TEXT NOT NULL, descricao TEXT NOT NULL,
  inicio TEXT NOT NULL, local TEXT NOT NULL, area TEXT NOT NULL,
  capacidade INTEGER NOT NULL CHECK (capacidade > 0)
) STRICT`);
const app = application('eventos', db);

/** Occupancy endpoint does not call Events again; failures must not fabricate seats. */
app.get('/eventos', async (_req, res) => {
  const rows = db.prepare('SELECT * FROM eventos ORDER BY inicio, id').all();
  const occupation = new Map((await get('inscricoes', '/ocupacao')).map(row => [row.eventoId, row.total]));
  res.json({ dados: rows.map(row => ({ ...row, vagasDisponiveis: row.capacidade - (occupation.get(row.id) || 0) })) });
});

app.get('/eventos/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM eventos WHERE id = ?').get(id(req.params.id));
  if (!row) fail(404, 'EVENTO_INEXISTENTE', 'Evento não encontrado.');
  res.json({ dados: row });
});

app.post('/eventos', (req, res) => {
  const titulo = text(req.body?.titulo, 'Título', 160);
  const descricao = text(req.body?.descricao, 'Descrição', 2000);
  const local = text(req.body?.local, 'Local', 200);
  const categoria = area(req.body?.area);
  const raw = req.body?.inicio;
  // Strict ISO shape plus round-trip of the calendar part prevents dates such as February 30.
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(raw))
    fail(400, 'DATA_INVALIDA', 'Informe uma data ISO válida com fuso horário.');
  const calendar = raw.slice(0, 19);
  const check = new Date(`${calendar}Z`);
  const instant = new Date(raw);
  if (!Number.isFinite(check.getTime()) || check.toISOString().slice(0, 19) !== calendar || !Number.isFinite(instant.getTime()))
    fail(400, 'DATA_INVALIDA', 'Informe uma data existente.');
  if (instant.getTime() <= Date.now()) fail(400, 'DATA_PASSADA', 'O evento deve começar no futuro.');
  const capacidade = req.body?.capacidade;
  if (!Number.isSafeInteger(capacidade) || capacidade <= 0)
    fail(400, 'CAPACIDADE_INVALIDA', 'O limite de vagas deve ser um inteiro maior que zero.');
  const result = db.prepare('INSERT INTO eventos (titulo, descricao, inicio, local, area, capacidade) VALUES (?, ?, ?, ?, ?, ?)')
    .run(titulo, descricao, instant.toISOString(), local, categoria, capacidade);
  res.status(201).json({ dados: db.prepare('SELECT * FROM eventos WHERE id = ?').get(Number(result.lastInsertRowid)) });
});

errors(app);
listen(app, process.env.EVENTOS_PORT || 3002, 'eventos', db);
