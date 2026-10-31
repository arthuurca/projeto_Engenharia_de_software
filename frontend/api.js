/** Single reusable HTTP client. All business requests pass through the Gateway. */
export async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(12000)
    });
  } catch {
    throw new Error('Não foi possível acessar o sistema. Verifique a conexão e os serviços.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.erro?.mensagem || 'Não foi possível concluir a operação.');
  return result.dados;
}
