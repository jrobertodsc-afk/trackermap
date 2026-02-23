# TrackerMap

> Site estático de apresentação para TrackerMap — marketing, planos e contato.

## Como ver localmente

No terminal, dentro da pasta do projeto:

```bash
python -m http.server 8000
# então abra http://localhost:8000/
```

## Deploy (Vercel)

Importe o repositório no Vercel (https://vercel.com/import), escolha o repositório `jrobertodsc-afk/trackermap` e use o preset "Other" ou "Static Site". Não é necessário `Build Command`; deixe `Output Directory` vazio.

Também incluí `vercel.json` com configuração estática (arquivo raíz) para facilitar o deploy.

## Estrutura

- `index.html` — página principal
- `privacy.html` — política de privacidade
- `TrackerMap_Rastreamento_.svg` — logo

## Chatbot

O site inclui um widget de chatbot minimal que escala para o WhatsApp. Integração com n8n pode ser adicionada via webhook.

---
Gerado por assistente para preparar deploy na Vercel.

## Integração com ProTrack365 (Portal do Cliente)

Adicionei uma função proxy para facilitar a integração com a API ProTrack sem expor credenciais.

- Arquivo: `api/protrack/proxy.js`
- Como usar (exemplo):

	GET (via browser/JS):

	```js
	// exemplo: lista de dispositivos (depende dos métodos da API ProTrack)
	fetch('/api/protrack/proxy?q=METHOD=LIST_DEVICES&CLIENT=123')
		.then(r => r.text())
		.then(console.log)
	```

	POST (via JS):

	```js
	fetch('/api/protrack/proxy', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: 'METHOD=LIST_DEVICES&CLIENT=123' })
	}).then(r => r.text()).then(console.log)
	```

Configuração necessária no Vercel (Project → Settings → Environment Variables):

- `PROTRACK_BASE_URL` (ex: https://www.protrack365.com/api.jsp)
- `PROTRACK_USER` (se necessário)
- `PROTRACK_PASS` (se necessário)
- `PROTRACK_TOKEN` (opcional, se a API usar token)
- `PROTRACK_AUTH_MODE` — `auto` | `basic` | `query` (se `query`, o proxy adiciona `USER`/`PASS` como parâmetros de query)

Observação: o proxy apenas repassa requisições para o endpoint configurado; ajuste `query` conforme os métodos documentados pela ProTrack (https://www.protrack365.com/api.jsp#API1).
