const dateFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'medium', timeStyle: 'short' });

/** Shared event presentation, ready for the recommendation list in Sprint 2. */
export function eventCard(event, { onRegister, registered = false, participantSelected = false, busy = false } = {}) {
  const card = document.createElement('article');
  card.className = 'card';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = event.area;
  const title = document.createElement('h3');
  title.textContent = event.titulo;
  const description = document.createElement('p');
  description.className = 'description';
  description.textContent = event.descricao;
  const details = document.createElement('dl');
  for (const [label, value] of [['Quando', dateFormat.format(new Date(event.inicio))], ['Local', event.local], ['Capacidade', `${event.capacidade} participantes`], ...(Number.isInteger(event.vagasDisponiveis) ? [['Vagas disponíveis', String(event.vagasDisponiveis)]] : [])]) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    details.append(dt, dd);
  }
  card.append(tag, title, description, details);
  if (onRegister) {
    const button = document.createElement('button');
    const started = new Date(event.inicio).getTime() <= Date.now();
    button.type = 'button';
    button.textContent = registered ? 'Inscrito' : started ? 'Evento iniciado' : event.vagasDisponiveis <= 0 ? 'Sem vagas' : 'Inscrever-se';
    button.disabled = busy || registered || started || event.vagasDisponiveis <= 0 || !participantSelected;
    button.setAttribute('aria-label', `${button.textContent}: ${event.titulo}`);
    button.addEventListener('click', () => onRegister(event));
    card.append(button);
  }
  return card;
}
