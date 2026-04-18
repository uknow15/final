// admin-ads.js — Admin ad editor (only active when ?admin=1 is in the URL)
(function () {
  const params = new URLSearchParams(window.location.search);
  const isAdminView = params.get('admin') === '1';
  const editor = document.getElementById('admin-ads-editor');
  if (!editor) return;
  if (!isAdminView) {
    editor.style.display = 'none';
    return;
  }
  editor.style.display = 'block';

  const textarea = document.getElementById('admin-ads-html');
  const status = document.getElementById('admin-ads-status');
  const btnLoad = document.getElementById('admin-load-ads');
  const btnSave = document.getElementById('admin-save-ads');
  const btnSaveLocal = document.getElementById('admin-save-local');
  const btnInject = document.getElementById('admin-inject-now');

  function setStatus(msg, err = false) {
    if (!status) return;
    status.textContent = msg;
    status.style.color = err ? '#ff9bb3' : 'var(--muted)';
  }

  // Load from server endpoint /admin/ads-html
  btnLoad.addEventListener('click', async () => {
    setStatus('Loading from server…');
    try {
      const r = await fetch('/admin/ads-html', { cache: 'no-cache' });
      if (!r.ok) {
        setStatus('No server ad file found or fetch failed.', true);
        return;
      }
      const txt = await r.text();
      textarea.value = txt;
      setStatus('Loaded ad HTML from server.');
    } catch (e) {
      setStatus('Error loading from server.', true);
    }
  });

  // Save to server endpoint /admin/save-ads
  btnSave.addEventListener('click', async () => {
    const html = textarea.value || '';
    setStatus('Saving to server…');
    try {
      const r = await fetch('/admin/save-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html })
      });
      const j = await r.json();
      if (r.ok && j.status === 'saved') {
        setStatus('Saved to server.');
      } else {
        setStatus(j.detail || j.status || 'Save failed.', true);
      }
    } catch (e) {
      setStatus('Network error saving to server.', true);
    }
  });

  // Save to localStorage for quick testing
  btnSaveLocal.addEventListener('click', () => {
    const html = textarea.value || '';
    try {
      localStorage.setItem('site_ads_html', html);
      setStatus('Saved locally (localStorage).');
    } catch (e) {
      setStatus('Failed to save locally.', true);
    }
  });

  // Inject current HTML into visible ad slots immediately
  btnInject.addEventListener('click', () => {
    const html = textarea.value || localStorage.getItem('site_ads_html') || '';
    if (!html) {
      setStatus('No ad HTML to inject.', true);
      return;
    }
    document.querySelectorAll('.ads-slot').forEach(slot => {
      slot.innerHTML = html;
      slot.dataset.adsLoaded = '1';
    });
    setStatus('Injected into ad slots.');
  });

  // Preload textarea from server or localStorage on open
  (async function preload() {
    try {
      const r = await fetch('/admin/ads-html', { cache: 'no-cache' });
      if (r.ok) {
        const txt = await r.text();
        if (txt && txt.trim()) {
          textarea.value = txt;
          setStatus('Loaded server ad HTML.');
          return;
        }
      }
    } catch (e) { /* ignore */ }
    // fallback to localStorage
    const local = localStorage.getItem('site_ads_html') || '';
    if (local) {
      textarea.value = local;
      setStatus('Loaded local ad HTML.');
    } else {
      setStatus('Editor ready. Load or paste ad HTML.');
    }
  })();
})();
