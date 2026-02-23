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
