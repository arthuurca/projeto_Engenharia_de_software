import { fail } from './core.js';

export const urls = {
  usuarios: process.env.USUARIOS_URL || `http://127.0.0.1:${process.env.USUARIOS_PORT || 3001}`,
  eventos: process.env.EVENTOS_URL || `http://127.0.0.1:${process.env.EVENTOS_PORT || 3002}`,
  inscricoes: process.env.INSCRICOES_URL || `http://127.0.0.1:${process.env.INSCRICOES_PORT || 3003}`,
  recomendacoes: process.env.RECOMENDACOES_URL || `http://127.0.0.1:${process.env.RECOMENDACOES_PORT || 3004}`
};

/** Calls a dependency without retrying writes or hiding unavailable results. */
export async function get(service, path) {
  let response, result;
  try {
    response = await fetch(`${urls[service]}${path}`, { signal: AbortSignal.timeout(3000) });
    result = await response.json();
  } catch (error) {
    if (error.name === 'TimeoutError') fail(504, 'TEMPO_EXCEDIDO', `O serviço ${service} demorou para responder.`);
    fail(503, 'SERVICO_INDISPONIVEL', `O serviço ${service} está indisponível.`);
  }
  if (!response.ok) fail(response.status, result.erro?.codigo || 'DEPENDENCIA_FALHOU', result.erro?.mensagem || `Falha no serviço ${service}.`);
  return result.dados;
}
