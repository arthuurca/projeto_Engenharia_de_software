import { spawn } from 'node:child_process';
import { ROOT } from '../shared/core.js';

// Separate OS processes keep the services independently executable.
const files = ['services/usuarios/server.js', 'services/eventos/server.js', 'services/inscricoes/server.js', 'services/recomendacoes/server.js', 'gateway/server.js'];
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill();
  process.exitCode = code;
}
for (const file of files) {
  const child = spawn(process.execPath, [file], { cwd: ROOT, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) { console.error(`${file} encerrou (${code}).`); stop(code || 1); } });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
console.log('Sprint 2 — abra http://127.0.0.1:' + (process.env.GATEWAY_PORT || 3000));
