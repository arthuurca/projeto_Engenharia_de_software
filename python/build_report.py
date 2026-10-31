"""Gera a cópia visual do relatório textual com código e evidências reais."""
import base64
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / 'relatorio.txt').read_text(encoding='utf-8-sig')
parts = ['<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Relatório — Arthur e Ana Leticia</title><style>body{max-width:1050px;margin:40px auto;padding:20px;font:16px/1.6 Georgia;color:#173e32}pre{white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%}summary{cursor:pointer;padding:12px}details{border:1px solid #ccc;margin:12px 0}details pre{padding:15px;font-size:12px}</style>', '<h1>Relatório do projeto — versão Python</h1>', '<pre>' + escape(text) + '</pre>', '<h2>Evidência da versão Python</h2>']
image = ROOT / 'docs/evidencias/python-interface-integrada.png'
parts.append('<img alt="Interface integrada aos serviços Python" src="data:image/png;base64,' + base64.b64encode(image.read_bytes()).decode() + '">')
parts.append('<h2>Código do sistema</h2>')
files = sorted((ROOT / 'python').rglob('*.py')) + sorted((ROOT / 'frontend').rglob('*.js'))
for file in files:
    parts.append('<details><summary>' + escape(str(file.relative_to(ROOT))) + '</summary><pre>' + escape(file.read_text(encoding='utf-8-sig')) + '</pre></details>')
parts.append('</html>')
(ROOT / 'relatorio.html').write_text('\n'.join(parts), encoding='utf-8')
print('Relatório visual Python gerado.')
