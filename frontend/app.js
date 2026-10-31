import { api } from './api.js';
import { field } from './components/field.js';
import { eventCard } from './components/event-card.js';

const areas = ['Computação', 'Engenharias', 'Saúde', 'Ciências Humanas'];
const $ = id => document.getElementById(id);
let participants = [];
let participantLoad = 0;
let eventLoad = 0;
let statusLoad = 0;
let personalLoad = 0;
let eventRows = [];
let recommendationRows = [];
let registeredIds = new Set();
let registrationBusy = false;
let eventsState = 'loading';

function renderEvents() {
  const options = event => ({ onRegister: register, participantSelected: Boolean($('participant-select').value),
    registered: registeredIds.has(event.id), busy: registrationBusy });
  $('events-list').replaceChildren(...eventRows.map(event => eventCard(event, options(event))));
  if (!eventRows.length && eventsState === 'ready') $('events-list').append(empty('Ainda não há eventos cadastrados. Cadastre o primeiro na área do organizador.'));
  $('recommendations-list').replaceChildren(...recommendationRows.map(event => eventCard(event, options(event))));
}

function empty(text) {
  const element = document.createElement('p');
  element.className = 'empty'; element.textContent = text;
  return element;
}

async function register(event) {
  const participanteId = Number($('participant-select').value);
  if (!participanteId) return message('registration-message', 'Selecione um participante antes de se inscrever.', 'error');
  if (registrationBusy) return;
  const person = participants.find(row => row.id === participanteId);
  registrationBusy = true;
  renderEvents();
  message('registration-message', 'Confirmando inscrição…');
  try {
    await api('/inscricoes', { method: 'POST', body: { participanteId, eventoId: event.id } });
    message('registration-message', `Inscrição de ${person.nome} em ${event.titulo} confirmada.`, 'success');
  } catch (error) { message('registration-message', error.message, 'error'); }
  finally {
    await Promise.allSettled([loadEvents(), loadPersonal()]);
    registrationBusy = false;
    renderEvents();
  }
}

async function loadPersonal() {
  const generation = ++personalLoad;
  const person = participants.find(row => String(row.id) === $('participant-select').value);
  registeredIds = new Set(); recommendationRows = [];
  $('registrations-list').replaceChildren(); $('recommendations-list').replaceChildren();
  $('personal-person').textContent = person ? `${person.nome} · ${person.area}` : 'Selecione um participante na área abaixo.';
  message('registrations-message', person ? 'Carregando inscrições…' : 'Selecione um participante para consultar as inscrições.');
  message('recommendations-message', person ? 'Carregando recomendações…' : 'Selecione um participante para receber sugestões.');
  renderEvents();
  if (!person) return;
  await Promise.allSettled([
    (async () => {
      try {
        const rows = await api(`/inscricoes?participanteId=${person.id}`);
        if (generation !== personalLoad) return;
        registeredIds = new Set(rows.map(row => row.eventoId));
        $('registrations-list').replaceChildren(...rows.map(row => eventCard(row.evento)));
        message('registrations-message', rows.length ? '' : 'Você ainda não está inscrito em eventos.');
        renderEvents();
      } catch (error) { if (generation === personalLoad) message('registrations-message', error.message, 'error'); }
    })(),
    (async () => {
      try {
        const rows = await api(`/recomendacoes?participanteId=${person.id}`);
        if (generation !== personalLoad) return;
        recommendationRows = rows;
        message('recommendations-message', rows.length ? '' : 'Não há recomendações disponíveis para seu interesse.');
        renderEvents();
      } catch (error) { if (generation === personalLoad) message('recommendations-message', error.message, 'error'); }
    })()
  ]);
}

for (const spec of [
  { name: 'nome', label: 'Nome', maxLength: 120 },
  { name: 'email', label: 'E-mail', type: 'email', maxLength: 254 },
  { name: 'area', label: 'Área de interesse', options: areas }
]) $('participant-fields').append(field(spec));

for (const spec of [
  { name: 'titulo', label: 'Título', maxLength: 160 },
  { name: 'descricao', label: 'Descrição', type: 'textarea', maxLength: 2000 },
  { name: 'inicio', label: 'Data e horário de início', type: 'datetime-local', hint: 'Informe o horário de Brasília.' },
  { name: 'local', label: 'Local', maxLength: 200 },
  { name: 'areaEvento', label: 'Área científica', options: areas },
  { name: 'capacidade', label: 'Limite de vagas', type: 'number', min: 1, step: 1 }
]) $('event-fields').append(field(spec));

function message(id, text, kind = '') {
  $(id).textContent = text;
  $(id).className = `message ${kind}`;
}

function selection() {
  const person = participants.find(p => String(p.id) === $('participant-select').value);
  $('selected-person').textContent = person ? `${person.nome} · ${person.area}` : 'Nenhum participante selecionado.';
  try {
    if (person) localStorage.setItem('participanteId', String(person.id));
    else localStorage.removeItem('participanteId');
  } catch { /* Selection still works when browser storage is disabled. */ }
  message('registration-message', '');
  void loadPersonal();
}

async function loadParticipants(preferred) {
  const generation = ++participantLoad;
  try {
    const rows = await api('/participantes');
    if (generation !== participantLoad) return;
    let previous = preferred || $('participant-select').value;
    try { previous ||= localStorage.getItem('participanteId'); } catch { /* optional persistence */ }
    participants = rows;
    const select = $('participant-select');
    select.replaceChildren(new Option(rows.length ? 'Selecione um participante' : 'Nenhum participante cadastrado', ''));
    for (const person of rows) select.add(new Option(person.nome, String(person.id)));
    select.value = rows.some(p => String(p.id) === String(previous)) ? String(previous) : '';
    select.disabled = !rows.length;
    selection();
  } catch (error) {
    if (generation !== participantLoad) return;
    participants = [];
    $('participant-select').replaceChildren(new Option('Não foi possível carregar', ''));
    $('participant-select').disabled = true;
    $('selected-person').textContent = error.message;
    void loadPersonal();
  }
}

async function loadEvents() {
  const generation = ++eventLoad;
  eventsState = 'loading';
  message('events-message', 'Carregando eventos…');
  try {
    const rows = await api('/eventos');
    if (generation !== eventLoad) return;
    eventRows = rows;
    eventsState = 'ready';
    renderEvents();
    message('events-message', '');
  } catch (error) {
    if (generation !== eventLoad) return;
    eventRows = [];
    eventsState = 'error';
    renderEvents();
    $('events-list').replaceChildren();
    message('events-message', error.message, 'error');
  }
}

async function loadStatus() {
  const generation = ++statusLoad;
  try {
    const rows = await api('/status');
    if (generation !== statusLoad) return;
    $('services').replaceChildren(...rows.map(service => {
      const item = document.createElement('li');
      const states = { online: 'Online', indisponivel: 'Indisponível', planejado: 'Sprint 2' };
      item.textContent = `${service.nome} · ${states[service.estado]}`;
      item.className = service.estado === 'online' ? 'state-online' : service.estado === 'indisponivel' ? 'state-off' : '';
      return item;
    }));
  } catch (error) {
    if (generation !== statusLoad) return;
    const item = document.createElement('li');
    item.className = 'state-off';
    item.textContent = error.message;
    $('services').replaceChildren(item);
  }
}

function submit(formId, messageId, build, path, after) {
  $(formId).addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    message(messageId, 'Salvando…');
    try {
      const body = build(Object.fromEntries(new FormData(form)));
      const saved = await api(path, { method: 'POST', body });
      form.reset();
      message(messageId, 'Cadastro realizado com sucesso.', 'success');
      await after(saved);
    } catch (error) { message(messageId, error.message, 'error'); }
    finally { button.disabled = false; }
  });
}

submit('participant-form', 'participant-message', data => data, '/participantes', saved => loadParticipants(String(saved.id)));
submit('event-form', 'event-message', data => {
  // datetime-local has no zone; interpret the entered clock as Brasília, never the browser's zone.
  const date = new Date(`${data.inicio}:00-03:00`);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error('Informe uma data e horário futuros.');
  const capacidade = Number(data.capacidade);
  if (!Number.isSafeInteger(capacidade) || capacidade <= 0) throw new Error('O limite de vagas deve ser um inteiro maior que zero.');
  return { titulo: data.titulo, descricao: data.descricao, inicio: date.toISOString(), local: data.local, area: data.areaEvento, capacidade };
}, '/eventos', () => Promise.allSettled([loadEvents(), loadPersonal()]));

$('participant-select').addEventListener('change', selection);
$('refresh-participants').addEventListener('click', () => loadParticipants());
$('refresh-events').addEventListener('click', () => Promise.allSettled([loadEvents(), loadPersonal()]));
$('refresh-personal').addEventListener('click', () => Promise.allSettled([loadEvents(), loadPersonal()]));
$('refresh-status').addEventListener('click', loadStatus);
await Promise.allSettled([loadParticipants(), loadEvents(), loadStatus()]);
