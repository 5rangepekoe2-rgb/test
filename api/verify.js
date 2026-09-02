export default async function handler(req, res) {
  const key = atob('c2stb3ItdjEtNjM5YzBlZGQzNmFhNGEzODZkZGMwNjJkMTk0MzA5Y2ZlOWU5YmYzYWNkYzZlMTE3M2M4NmUzODBiMzEyYjQ3Mw==');
  try {
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers.host;
    const upstream = await fetch(`${proto}://${host}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenRouter-Key': key
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: '서울시 공공서비스예약 테스트입니다. 정상 연결이면 정상이라고만 답하세요.' }],
        temperature: 0,
        webSearch: false
      })
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = { raw }; }
    return res.status(upstream.status).json({
      ok: upstream.ok,
      status: upstream.status,
      answer: data?.choices?.[0]?.message?.content || null,
      error: data?.error || null
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'verification failed' });
  }
}
