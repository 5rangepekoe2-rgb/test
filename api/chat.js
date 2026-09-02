export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const clientKey = req.headers['x-openrouter-key'];
    if (!clientKey) {
      return res.status(400).json({ error: 'OpenRouter key missing' });
    }

    const payload = {
      model: body.model || 'google/gemini-2.5-flash',
      messages: Array.isArray(body.messages) ? body.messages : [],
      temperature: Number.isFinite(Number(body.temperature)) ? Number(body.temperature) : 0.7,
      stream: false
    };

    if (body.webSearch) {
      if (!payload.model.endsWith(':online')) payload.model += ':online';
      payload.plugins = [{ id: 'web' }];
    }

    let upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://vercel.app',
        'X-Title': 'Seoul Public Service Reservation AI Assistant'
      },
      body: JSON.stringify(payload)
    });

    // Some models/providers reject :online or the web plugin. Retry once without it.
    if (!upstream.ok && body.webSearch) {
      payload.model = payload.model.replace(/:online$/, '');
      delete payload.plugins;
      upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.origin || 'https://vercel.app',
          'X-Title': 'Seoul Public Service Reservation AI Assistant'
        },
        body: JSON.stringify(payload)
      });
    }

    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); }
    catch { data = { error: raw || `OpenRouter HTTP ${upstream.status}` }; }

    if (!upstream.ok) {
      const message = data?.error?.message || data?.error || `OpenRouter HTTP ${upstream.status}`;
      return res.status(upstream.status).json({ error: message });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'AI proxy failed' });
  }
}
