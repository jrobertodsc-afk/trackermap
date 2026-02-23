// Serverless endpoint to register customers into Supabase
// Requires Vercel env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured on server' });
  }

  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch (e) {}

  const name = (body.name || body.nome || '').toString().trim();
  const phone = (body.phone || body.tel || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const cpf = (body.cpf || '').toString().trim();
  const birthday = (body.birthday || '').toString().trim();
  const address = (body.address || '').toString().trim();
  const plan = (body.plan || body.plano || '').toString().trim();

  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

  const payload = [{ name, phone, email, cpf, birthday, address, plan }];

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: 'supabase_error', details: text });
    }

    const data = await r.json();
    return res.status(201).json({ ok: true, record: data[0] || data });
  } catch (err) {
    return res.status(500).json({ error: 'server_error', details: String(err) });
  }
}
