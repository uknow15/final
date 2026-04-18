// contact.js — Contact form submission handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return; // guard: only run on contact page

  const statusEl = document.getElementById('contact-status');
  const sendBtn = document.getElementById('send-btn');

  function setStatus(text, isError = false) {
    if (!statusEl) return;
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
    sendBtn.textContent = 'Sending…';
    setStatus('Sending message…');

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject: service, message })
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
