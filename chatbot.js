// posts query to /chat and displays answer + sources
const messagesEl = document.getElementById('messages');
const qInput = document.getElementById('q');
const sendBtn = document.getElementById('send');
const sourcesEl = document.getElementById('sources');

function appendMessage(text, cls='bot'){
  const div = document.createElement('div');
  div.className = 'message ' + (cls === 'user' ? 'user' : 'bot');
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function ask(q){
  appendMessage(q, 'user');
  appendMessage('Thinking...', 'bot');
  try {
    const res = await fetch('/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({q})
    });
    const j = await res.json();
    // replace last bot "Thinking..." with real answer
    const botMsgs = messagesEl.querySelectorAll('.message.bot');
    if (botMsgs.length) botMsgs[botMsgs.length-1].textContent = j.answer || 'No answer.';
    // show sources
    if (j.sources && j.sources.length){
      sourcesEl.innerHTML = '<strong>Sources:</strong> ' + j.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>`).join(' · ');
    } else sourcesEl.textContent = '';
  } catch (err) {
    appendMessage('Error contacting server.', 'bot');
  }
}

sendBtn?.addEventListener('click', () => {
  const q = qInput.value.trim();
  if (!q) return;
  ask(q);
  qInput.value = '';
});
qInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { sendBtn.click(); }
});
