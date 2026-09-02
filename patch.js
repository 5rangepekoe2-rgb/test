/* Runtime compatibility patch for Vercel practice deployment. */
(() => {
  const nativeFetch = window.fetch.bind(window);

  function getSeoulKey(url) {
    try {
      const decoded = decodeURIComponent(url);
      const match = decoded.match(/openAPI\.seoul\.go\.kr:8088\/([^/]+)\/json\/ListPublicReservationEducation/i);
      return match ? match[1] : null;
    } catch (_) {
      return null;
    }
  }

  window.fetch = async function patchedFetch(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';

    // HTTPS Vercel page -> HTTP Seoul API is blocked as mixed content.
    // Route it through our same-origin Vercel serverless proxy instead.
    const seoulKey = getSeoulKey(url);
    if (seoulKey) {
      return nativeFetch(`/api/seoul?key=${encodeURIComponent(seoulKey)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
    }

    // OpenRouter web-search options can fail for some model/provider combinations.
    // Try the requested mode first, then automatically retry as a normal chat call.
    if (url.includes('openrouter.ai/api/v1/chat/completions') && init?.body) {
      const first = await nativeFetch(input, init);
      if (first.ok) return first;

      try {
        const body = JSON.parse(init.body);
        const usesOnline = typeof body.model === 'string' && body.model.endsWith(':online');
        const usesPlugin = Array.isArray(body.plugins) && body.plugins.length > 0;
        if (!usesOnline && !usesPlugin) return first;

        if (usesOnline) body.model = body.model.replace(/:online$/, '');
        delete body.plugins;

        console.warn('OpenRouter web-search request failed; retrying without web plugin.');
        return nativeFetch(input, { ...init, body: JSON.stringify(body) });
      } catch (_) {
        return first;
      }
    }

    return nativeFetch(input, init);
  };
})();
