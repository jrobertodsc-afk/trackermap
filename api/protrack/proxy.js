// Simple ProTrack proxy for Vercel serverless functions
// Usage:
// GET  /api/protrack/proxy?q=METHOD=...&param=...
// POST /api/protrack/proxy  { "query": "METHOD=...&param=..." }

export default async function handler(req, res) {
  const BASE = process.env.PROTRACK_BASE_URL || '';
  const USER = process.env.PROTRACK_USER || '';
  const PASS = process.env.PROTRACK_PASS || '';
  const TOKEN = process.env.PROTRACK_TOKEN || '';
  const AUTH_MODE = (process.env.PROTRACK_AUTH_MODE || 'auto').toLowerCase();

  if (!BASE) {
    return res.status(500).json({ error: 'PROTRACK_BASE_URL not configured' });
  }

  // Accept query via GET param `q` or POST JSON { query: 'a=1&b=2' }
  let queryString = '';
  if (req.method === 'GET') {
    queryString = req.query.q || '';
  } else if (req.method === 'POST') {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      queryString = body.query || '';
    } catch (e) {
      return res.status(400).json({ error: 'invalid JSON body' });
    }
  } else {
    return res.setHeader('Allow', 'GET, POST').status(405).end('Method Not Allowed');
  }

  // Build target URL. Many ProTrack APIs use a single endpoint like api.jsp?METHOD=...
  const url = BASE + (queryString ? (BASE.includes('?') ? '&' : '?') + queryString : '');

  const headers = {};
  if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  } else if (AUTH_MODE === 'basic' && USER && PASS) {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');
  } else if (AUTH_MODE === 'query' && USER && PASS) {
    // append user/pass as query params
    // If queryString already contains params, we append below by rebuilding the url
  }

  // If AUTH_MODE is 'query', include credentials in the URL instead of headers
  let targetUrl = url;
  if (AUTH_MODE === 'query' && USER) {
    const sep = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${sep}USER=${encodeURIComponent(USER)}&PASS=${encodeURIComponent(PASS)}`;
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { ...headers },
    };
    if (req.method === 'POST') {
      fetchOptions.body = JSON.stringify({ query: queryString });
      fetchOptions.headers['Content-Type'] = 'application/json';
    }

    const proxied = await fetch(targetUrl, fetchOptions);
    const contentType = proxied.headers.get('content-type') || 'text/plain';
    const text = await proxied.text();

    // Basic CORS for browser calls (adjust as needed)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', contentType);
    return res.status(proxied.status).send(text);
  } catch (err) {
    return res.status(502).json({ error: 'proxy_error', details: String(err) });
  }
}
