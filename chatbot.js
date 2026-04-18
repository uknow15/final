// chatbot.js — Chatbot with server mode + client-side fallback
(() => {
  'use strict';

  const messagesEl = document.getElementById('messages');
  const qInput = document.getElementById('q');
  const sendBtn = document.getElementById('send');
  const sourcesEl = document.getElementById('sources');

  if (!messagesEl || !qInput || !sendBtn) return;

  // ── Client-side knowledge base (fallback when Flask backend is unavailable) ──
  const knowledgeBase = [
    {
      keywords: ['about', 'who', 'team', 'company', 'creator studio'],
      answer: 'Creator Studio is a small team focused on design, performance, and practical AI integrations. We craft static pages with smooth animations and pair them with a retrieval-augmented chatbot that answers using the site\'s own content.',
      source: { url: 'about.html', title: 'About' }
    },
    {
      keywords: ['project', 'work', 'portfolio', 'demo', 'showcase'],
      answer: 'We have three featured projects: Project Alpha (a marketing microsite with animated hero and chatbot), Docs Portal (documentation with RAG search), and Landing Template (landing page with AdSense and SMTP contact form).',
      source: { url: 'projects.html', title: 'Projects' }
    },
    {
      keywords: ['contact', 'email', 'reach', 'touch', 'booking', 'hire'],
      answer: 'You can reach us through the Contact page. Fill in your name, email, select a service (Video Production, Web Design, Chatbot Integration, or Other), and describe your project. For direct booking, email nova.lane@example.com.',
      source: { url: 'contact.html', title: 'Contact' }
    },
    {
      keywords: ['chatbot', 'ai', 'rag', 'question', 'answer', 'bot'],
      answer: 'The chatbot uses Retrieval-Augmented Generation (RAG) with OpenAI embeddings and FAISS vector search. It retrieves relevant passages from site pages and generates answers with source citations. For full AI-powered answers, run the Flask backend with "python app.py".',
      source: { url: 'chatbot.html', title: 'Chatbot' }
    },
    {
      keywords: ['design', 'style', 'theme', 'animation', 'css', 'color', 'dark'],
      answer: 'The site uses a dark glassmorphism theme with design tokens (--bg, --accent, --muted), scroll-reveal animations, floating hero effects, and hover transforms. It respects prefers-reduced-motion for accessibility. See the design slides for details.',
      source: { url: 'slide1.html', title: 'Design System Slides' }
    },
    {
      keywords: ['privacy', 'data', 'cookie', 'collect', 'gdpr'],
      answer: 'We collect contact form submissions (name, email, subject, message) sent via SMTP. Chat queries are processed server-side. Ad networks like AdSense may collect data per their policies. See our Privacy Policy for full details.',
      source: { url: 'privacy.html', title: 'Privacy Policy' }
    },
    {
      keywords: ['terms', 'legal', 'license', 'use', 'rights'],
      answer: 'All site content is for informational purposes. The chatbot answers are based on site content and not guaranteed for completeness. For legal inquiries, use the contact form. See the Terms of Use page for full details.',
      source: { url: 'terms.html', title: 'Terms of Use' }
    },
    {
      keywords: ['tech', 'stack', 'built', 'technology', 'flask', 'python', 'openai', 'faiss'],
      answer: 'The site is built with HTML, CSS, and vanilla JavaScript for the frontend. The backend uses Python Flask, OpenAI embeddings (text-embedding-3-small), GPT-4o-mini for chat, and FAISS for vector search. Contact form uses SMTP.',
      source: { url: 'about.html', title: 'About' }
    },
    {
      keywords: ['service', 'offer', 'video', 'web', 'integration'],
      answer: 'Creator Studio offers Video Production, Web Design, and Chatbot Integration services. We build clean animated web templates and knowledge-aware chatbots. Get in touch via the Contact page.',
      source: { url: 'contact.html', title: 'Contact' }
    },
    {
      keywords: ['ad', 'adsense', 'monetize', 'advertising'],
      answer: 'The site supports AdSense integration with lazy-loaded ad slots. Admins can manage ad HTML via the admin editor (add ?admin=1 to the URL). Ads are loaded only when slots become visible to improve performance.',
      source: { url: 'slide2.html', title: 'Ad Slot Placement' }
    }
  ];

  let useServerMode = true; // Try server first, fall back to client

  function appendMessage(text, cls = 'bot') {
    const div = document.createElement('div');
    div.className = 'message ' + (cls === 'user' ? 'user' : 'bot');
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function renderSources(sources) {
    sourcesEl.innerHTML = '';
    if (!sources || !sources.length) return;

    const label = document.createElement('strong');
    label.textContent = 'Sources: ';
    sourcesEl.appendChild(label);

    sources.forEach((s, i) => {
      if (i > 0) sourcesEl.appendChild(document.createTextNode(' · '));
      const a = document.createElement('a');
      a.href = s.url || '#';
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.title || s.url || 'Source';
      a.className = 'source-link';
      sourcesEl.appendChild(a);
    });
  }

  // ── Client-side search (keyword matching) ──
  function clientSearch(query) {
    const q = query.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const entry of knowledgeBase) {
      let score = 0;
      for (const kw of entry.keywords) {
        if (q.includes(kw)) score += 2;
        // Partial word match
        const words = q.split(/\s+/);
        for (const w of words) {
          if (kw.includes(w) && w.length > 2) score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore >= 2) {
      return { answer: bestMatch.answer, sources: [bestMatch.source] };
    }

    return {
      answer: 'I don\'t have specific information about that. Try asking about: the team, projects, services, contact info, design system, tech stack, or privacy policy.',
      sources: []
    };
  }

  // ── Ask via server or fallback ──
  async function ask(query) {
    appendMessage(query, 'user');
    const thinkingEl = appendMessage('Thinking…', 'bot');
    sendBtn.disabled = true;

    // Try server mode first
    if (useServerMode) {
      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query })
        });

        if (res.ok) {
          const j = await res.json();
          if (j.error) {
            thinkingEl.textContent = j.error;
          } else {
            thinkingEl.textContent = j.answer || 'No answer.';
            renderSources(j.sources);
          }
          sendBtn.disabled = false;
          return;
        }
      } catch (e) {
        // Server unavailable — switch to client mode silently
      }

      // Server failed — switch to client fallback
      useServerMode = false;
    }

    // Client-side fallback
    // Small delay to feel natural
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
    const result = clientSearch(query);
    thinkingEl.textContent = result.answer;
    renderSources(result.sources);
    sendBtn.disabled = false;
  }

  // ── Welcome message ──
  appendMessage('Hi! Ask me anything about this site — projects, services, tech stack, or how to get in touch.', 'bot');

  // ── Event listeners ──
  sendBtn.addEventListener('click', () => {
    const q = qInput.value.trim();
    if (!q) return;
    ask(q);
    qInput.value = '';
  });

  qInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendBtn.click();
    }
  });
})();
