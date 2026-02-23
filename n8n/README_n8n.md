n8n Integration Guide

Overview
- The serverless endpoints `/api/register` and `/api/leads` will POST to an n8n webhook URL if the environment variable `N8N_WEBHOOK_URL` is set in Vercel. This allows your partner (who has n8n access) to implement messaging/workflows without sharing credentials.

Recommended webhook payloads
- New customer (`event: 'customer.created'`):
{
  "event": "customer.created",
  "record": { /* new customers table row as returned by Supabase */ }
}

- New lead (`event: 'lead.created'`):
{
  "event": "lead.created",
  "record": { /* new leads table row */ }
}

Suggested n8n workflow (high level)
1. Webhook Trigger (POST) — configure path and accept JSON
2. Switch / IF node — route on `{{ $json.event }}`:
   - `customer.created` -> send welcome message
   - `lead.created` -> send acknowledgement message
3. For messages:
   - Twilio node (WhatsApp/SMS) or HTTP Request node to Twilio API
   - SendGrid / SMTP node for email
   - Optional: create/update row in Supabase (PostgREST) or call a custom endpoint
4. Logging / retry: push failures to a queue or Slack notification

Example n8n node chain for `customer.created`
- Webhook -> Set (compose message) -> Twilio (send WhatsApp) -> HTTP Request (optional CRM update)

Notes for your partner
- Share this webhook URL with the app by adding it to Vercel as `N8N_WEBHOOK_URL`.
- If using Twilio WhatsApp, configure Twilio credentials in n8n's credentials manager.
- For idempotency, use the `record.id` in the payload to avoid duplicate sends.

Security
- Keep `N8N_WEBHOOK_URL` secret. Use a random path/token and validate incoming requests in n8n if possible.

If you want, I can also generate an n8n export file (workflow JSON) tailored to Twilio + SendGrid — your partner will need to import it into their n8n instance and fill credentials.
