export default async function handler(req, res) {
  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  const INTERNAL_KEY = process.env.INTERNAL_KEY;

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({ error: 'APPS_SCRIPT_URL no configurada en Vercel' });
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(APPS_SCRIPT_URL, { method: 'GET' });
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).send(text);
    }

    if (req.method === 'POST') {
      let payload;
      if (typeof req.body === 'string') {
        payload = req.body.length ? JSON.parse(req.body) : {};
      } else if (req.body && typeof req.body === 'object') {
        payload = req.body;
      } else {
        payload = {};
      }

      const forwardBody = { ...payload, key: INTERNAL_KEY };

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(forwardBody)
      });
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).send(text);
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('[proxy] Error llamando a Apps Script:', err);
    return res.status(502).json({ error: 'No se pudo contactar al backend (Apps Script)' });
  }
}