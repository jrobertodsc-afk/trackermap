const crypto = require('crypto');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const ACCOUNT  = 'Instalador';
  const PASSWORD = 'host123';
  const BASE_URL = 'https://api.protrack365.com';

  try {
    const time = Math.floor(Date.now() / 1000);

    // signature = md5(md5(password) + time)
    const md5pass = crypto.createHash('md5').update(PASSWORD).digest('hex');
    const signature = crypto.createHash('md5').update(md5pass + time).digest('hex');

    const url = `${BASE_URL}/api/authorization?time=${time}&account=${ACCOUNT}&signature=${signature}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 0) {
      return res.status(400).json({ error: 'ProTrack365 auth failed', detail: data });
    }

    const token = data.record.access_token;

    // Retorna o token e a URL do portal
    res.status(200).json({
      success: true,
      access_token: token,
      portal_url: `https://www.protrack365.com/dealer2/#/`,
      expires_in: data.record.expires_in
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
