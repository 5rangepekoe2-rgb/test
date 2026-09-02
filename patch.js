// Runtime fixes for Vercel practice deployment
(() => {
  const nativeFetch = window.fetch.bind(window);
  const PRACTICE_KEY_B64 = 'c2stb3ItdjEtNjM5YzBlZGQzNmFhNGEzODZkZGMwNjJkMTk0MzA5Y2ZlOWU5YmYzYWNkYzZlMTE3M2M4NmUzODBiMzEyYjQ3Mw==';
  const PRACTICE_KEY = atob(PRACTICE_KEY_B64);

  // Force the supplied practice key and stable defaults.
  localStorage.setItem('openrouter_key', PRACTICE_KEY);
  localStorage.setItem('openrouter_web_search', 'false');

  function extractSeoulKey(url) {
    try {
      const decoded = decodeURIComponent(url);
      const match = decoded.match(/openAPI\.seoul\.go\.kr:8088\/([^/]+)\/json\/ListPublicReservationEducation/i);
      return match ? match[1] : null;
    } catch (_) {
      return null;
    }
  }

  window.fetch = async function patchedFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';

    // Route Seoul Open API through same-origin Vercel function to avoid mixed-content/CORS errors.
    const seoulKey = extractSeoulKey(url);
    if (seoulKey) {
      return nativeFetch(`/api/seoul?key=${encodeURIComponent(seoulKey)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
    }

    // Route OpenRouter through same-origin Vercel function.
    if (url.includes('openrouter.ai/api/v1/chat/completions') && init?.body) {
      try {
        const body = JSON.parse(init.body);
        const cleanModel = String(body.model || 'google/gemini-2.5-flash').replace(/:online$/, '');
        const webSearch = cleanModel !== body.model || (Array.isArray(body.plugins) && body.plugins.length > 0);

        const proxyResponse = await nativeFetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OpenRouter-Key': PRACTICE_KEY
          },
          body: JSON.stringify({
            model: cleanModel,
            messages: body.messages || [],
            temperature: body.temperature,
            webSearch
          })
        });

        if (!proxyResponse.ok) return proxyResponse;

        const json = await proxyResponse.json();
        const text = json?.choices?.[0]?.message?.content || '';
        const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`;
        return new Response(sse, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
        });
      } catch (error) {
        console.error('Chat proxy patch failed:', error);
        return new Response(JSON.stringify({ error: { message: error?.message || 'Chat proxy failed' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return nativeFetch(input, init);
  };

  document.addEventListener('DOMContentLoaded', () => {
    localStorage.setItem('openrouter_key', PRACTICE_KEY);
    localStorage.setItem('openrouter_web_search', 'false');

    try {
      state.apiKey = PRACTICE_KEY;
      state.webSearchEnabled = false;
      if (typeof updateWebSearchToggleUI === 'function') updateWebSearchToggleUI();
    } catch (_) {}

    const notice = document.querySelector('.key-notice');
    if (notice) {
      notice.innerHTML = '<span class="notice-icon">✅</span><span>연습용 API 키가 자동 적용되어 있습니다. 별도 입력 없이 바로 질문할 수 있습니다.</span>';
    }

    const keyInput = document.getElementById('api-key-input');
    if (keyInput) {
      keyInput.value = PRACTICE_KEY;
      keyInput.placeholder = '연습용 키 자동 적용됨';
    }
  });
})();
