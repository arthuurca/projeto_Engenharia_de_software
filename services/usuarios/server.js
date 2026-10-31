import { application, area, database, errors, fail, id, listen, text } from '../../shared/core.js';

const db = database('usuarios');
db.exec(`CREATE TABLE IF NOT EXISTS participantes (
  id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, area TEXT NOT NULL
) STRICT`);
const app = application('usuarios', db);

app.get('/participantes', (_req, res) => {
  res.json({ dados: db.prepare('SELECT * FROM participantes ORDER BY id').all() });
});

app.get('/participantes/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM participantes WHERE id = ?').get(id(req.params.id));
  if (!row) fail(404, 'PARTICIPANTE_INEXISTENTE', 'Participante não encontrado.');
  res.json({ dados: row });
});

/** Creates a participant; normalized email is protected by a UNIQUE constraint. */
app.post('/participantes', (req, res) => {
  const nome = text(req.body?.nome, 'Nome', 120);
  const email = text(req.body?.email, 'E-mail', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'EMAIL_INVALIDO', 'Informe um e-mail válido.');
  const interesse = area(req.body?.area);
  let result;
  try {
    result = db.prepare('INSERT INTO participantes (nome, email, area) VALUES (?, ?, ?)').run(nome, email, interesse);
  } catch (error) {
    if (error.errcode === 2067) fail(409, 'EMAIL_DUPLICADO', 'Este e-mail já está cadastrado.');
    throw error;
  }
  const row = db.prepare('SELECT * FROM participantes WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json({ dados: row });
});

errors(app);
listen(app, process.env.USUARIOS_PORT || 3001, 'usuarios', db);
