import { application, errors, id, listen } from '../../shared/core.js';
import { get } from '../../shared/http.js';

const app = application('recomendacoes');

/** Deterministic recommendation: same area, future start, free seats, not registered. */
app.get('/recomendacoes', async (req, res) => {
  const participanteId = id(req.query.participanteId);
  const person = await get('usuarios', `/participantes/${participanteId}`);
  const [events, registrations] = await Promise.all([
    get('eventos', '/eventos'), get('inscricoes', `/inscricoes/ids?participanteId=${participanteId}`)
  ]);
  const excluded = new Set(registrations);
  const now = Date.now();
  const dados = events.filter(event => event.area === person.area && new Date(event.inicio).getTime() > now
    && event.vagasDisponiveis > 0 && !excluded.has(event.id))
    .sort((a, b) => a.inicio.localeCompare(b.inicio) || a.id - b.id);
  res.json({ dados });
});

errors(app);
listen(app, process.env.RECOMENDACOES_PORT || 3004, 'recomendacoes');
