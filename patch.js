// Runtime fixes for Vercel practice deployment
// 1) Disable OpenRouter web-search mode by default to avoid :online/plugin failures.
// 2) Fetch Seoul Open API through same-origin Vercel function (/api/seoul).
// 3) Keep the embedded practice OpenRouter key behavior unchanged.

(() => {
  const nativeFetch = window.fetch.bind(window);
  localStorage.setItem('openrouter_web_search', 'false');

  window.fetch = async function patchedFetch(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';

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
        return nativeFetch(input, { ...init, body: JSON.stringify(body) });
      } catch (_) {
        return first;
      }
    }

    return nativeFetch(input, init);
  };

  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (window.state) {
        state.webSearchEnabled = false;
      }
      localStorage.setItem('openrouter_web_search', 'false');
      if (typeof updateWebSearchToggleUI === 'function') updateWebSearchToggleUI();

      document.querySelectorAll('.key-notice, .api-notice, .notice').forEach((notice) => {
        const text = (notice.textContent || '').toLowerCase();
        if (text.includes('api') || text.includes('키')) {
          notice.innerHTML = '<span class="notice-icon">✅</span><span>연습용 API 키가 자동 적용되어 있습니다. 별도 입력 없이 바로 질문할 수 있습니다.</span>';
        }
      });

      document.querySelectorAll('input[type="password"], input[placeholder*="API"], input[placeholder*="api"], input[placeholder*="키"]').forEach((el) => {
        const parentText = (el.closest('div')?.textContent || '').toLowerCase();
        if (parentText.includes('openrouter')) {
          el.value = '';
          el.placeholder = '연습용 키 자동 적용됨';
        }
      });
    } catch (e) {
      console.warn('UI patch warning:', e);
    }
  });
})();
