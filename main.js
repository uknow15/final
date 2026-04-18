// main.js — Core site functionality
(() => {
  'use strict';

  // ── Mobile nav toggle ──
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

  // ── Active link highlight based on current URL ──
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

  // ── Smooth scroll for internal anchors ──
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

  // ── Reveal-on-scroll for elements with .reveal ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── Lazy ad-slot loader ──
  const adObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const slot = entry.target;
        if (!slot.dataset.adsLoaded) {
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

  // ── Keyboard-user focus outlines ──
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  window.addEventListener('keydown', handleFirstTab);

  // ── Toast helper ──
  window.showToast = function (msg, timeout = 3500) {
    let t = document.getElementById('site-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'site-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:14px;pointer-events:none;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => { t.style.opacity = '0'; }, timeout);
  };

  // ── Source-link highlight (chatbot sources) ──
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.source-link');
    if (!a) return;
    a.classList.add('source-highlight');
    setTimeout(() => a.classList.remove('source-highlight'), 2200);
  });

  // ── Back-to-top button ──
  const btt = document.createElement('button');
  btt.id = 'back-to-top';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML = '&#8593;';
  document.body.appendChild(btt);

  window.addEventListener('scroll', () => {
    btt.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btt.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

})();
