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

## Lead capture (Supabase)

This project now includes a serverless endpoint to capture leads into Supabase:

- Endpoint: `/api/leads` (POST)
- Required Vercel env vars:
	- `SUPABASE_URL` (e.g. https://xyz.supabase.co)
	- `SUPABASE_SERVICE_ROLE_KEY` (service_role key; keep secret)

Payload example (JSON):

```json
{ "name": "João", "phone": "(71) 9xxxx-xxxx", "plan": "Premium", "message": "Quero mais info" }
```

What to create in Supabase:

Run this SQL in Supabase SQL editor to create a simple `leads` table:

```sql
create table leads (
	id serial primary key,
	name text,
	phone text,
	plan text,
	message text,
	source_page text,
	created_at timestamptz default now()
);
```

Customers table schema (create in Supabase):

```sql
create table customers (
	id serial primary key,
	name text not null,
	phone text not null,
	email text,
	cpf text,
	birthday date,
	address text,
	plan text,
	created_at timestamptz default now()
);
```

Behavior: when the contact form is submitted the client will POST to `/api/leads` (server) which inserts into Supabase and then opens WhatsApp (so you keep the same contact flow while storing leads).

Security note: keep `SUPABASE_SERVICE_ROLE_KEY` secret in Vercel; do not expose it to the browser.

