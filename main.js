// assets/js/main.js
(() => {
  'use strict';

  // Mobile nav toggle
  const body = document.body;
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelector('.nav-links');
  if (nav && navLinks) {
    const btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Toggle navigation');
    btn.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
    nav.appendChild(btn);

    btn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.classList.toggle('nav-open', open);
    });

    // close nav when a link is clicked (mobile)
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        body.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Active link highlight based on current URL
  const links = document.querySelectorAll('.nav-links a');
  const current = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === current || (href === 'index.html' && current === '')) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });

  // Smooth scroll for internal anchors
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }
  });

  // Simple reveal on scroll for elements with .reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Lightweight ad slot lazy loader
  // Adds the AdSense script only when ad slot is visible to avoid early loading
  const adObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const slot = entry.target;
        if (!slot.dataset.adsLoaded) {
          // The site owner should paste their AdSense snippet into data-ads-html attribute
          // Example: <div id="ads-slot" data-ads-html="&lt;script&gt;...&lt;/script&gt;"></div>
          const html = slot.getAttribute('data-ads-html') || slot.innerHTML;
          if (html && html.trim()) {
            slot.innerHTML = html;
            slot.dataset.adsLoaded = '1';
          }
        }
        adObserver.unobserve(slot);
      }
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('.ads-slot').forEach(s => adObserver.observe(s));

  // Small accessibility enhancement: focus outlines for keyboard users only
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  window.addEventListener('keydown', handleFirstTab);

  // Minimal helper to show toast messages (used by contact form or other scripts)
  window.showToast = function (msg, timeout = 3500) {
    let t = document.getElementById('site-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'site-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;padding:10px 14px;border-radius:10px;z-index:9999;font-size:14px;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => { t.style.opacity = '0'; }, timeout);
  };

  // Expose a small helper to highlight a source link when clicked from chatbot sources
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.source-link');
    if (!a) return;
    a.classList.add('source-highlight');
    setTimeout(() => a.classList.remove('source-highlight'), 2200);
  });

})();

// assets/js/contact.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-status');
  const sendBtn = document.getElementById('send-btn');

  function setStatus(text, isError=false) {
    statusEl.textContent = text;
    statusEl.style.color = isError ? '#ff9bb3' : 'var(--muted)';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const service = form.service.value || '';
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      setStatus('Please fill in name, email, and message.', true);
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    setStatus('Sending message...');

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, subject: service, message})
      });
      const j = await res.json();
      if (res.ok && j.status === 'sent') {
        setStatus('Message sent. Thank you!');
        form.reset();
      } else {
        const detail = j.detail || j.error || 'Failed to send message.';
        setStatus(detail, true);
      }
    } catch (err) {
      setStatus('Network error. Try again later.', true);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Message';
    }
  });
});
// Admin ad editor behavior (append to assets/js/main.js or include as admin-ads.js)
(function(){
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

  function setStatus(msg, err=false) {
    status.textContent = msg;
    status.style.color = err ? '#ff9bb3' : 'var(--muted)';
  }

  // Load from server endpoint /admin/ads-html
  btnLoad.addEventListener('click', async () => {
    setStatus('Loading from server...');
    try {
      const r = await fetch('/admin/ads-html', {cache:'no-cache'});
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
    setStatus('Saving to server...');
    try {
      const r = await fetch('/admin/save-ads', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({html})
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
  (async function preload(){
    // try server first
    try {
      const r = await fetch('/admin/ads-html', {cache:'no-cache'});
      if (r.ok) {
        const txt = await r.text();
        if (txt && txt.trim()) {
          textarea.value = txt;
          setStatus('Loaded server ad HTML.');
          return;
        }
      }
    } catch(e){}
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
