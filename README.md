# Creator Studio 🚀

A modern, dark-themed portfolio and knowledge site with an AI-powered chatbot, contact form, and AdSense integration.

## Features

- **Animated static pages** — Dark glassmorphism theme with scroll-reveal animations, floating hero, and smooth hover transitions
- **RAG Chatbot** — Retrieval-Augmented Generation chatbot using OpenAI embeddings + FAISS to answer questions from site content
- **Contact form** — Server-side form handler that delivers messages via SMTP
- **Ad integration** — Lazy-loaded AdSense slots with an admin editor (`?admin=1`)
- **Responsive** — Mobile-first design with slide-out navigation
- **Accessible** — Keyboard focus outlines, `prefers-reduced-motion` support, ARIA attributes

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Home — hero with video card, social links, featured product |
| `about.html` | About — team description and approach |
| `projects.html` | Projects — showcase grid with links to slides |
| `chatbot.html` | Chatbot — RAG-powered Q&A interface |
| `contact.html` | Contact — form with booking sidebar |
| `slide1-3.html` | Design system slides |
| `terms.html` | Terms of use (template) |
| `privacy.html` | Privacy policy (template) |
| `404.html` | Custom error page |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Python, Flask |
| AI | OpenAI Embeddings (`text-embedding-3-small`), GPT-4o-mini |
| Vector DB | FAISS (faiss-cpu) |
| Email | SMTP via Python `smtplib` |

## Setup

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd project_root
cp .env.example .env
# Edit .env with your API keys and SMTP credentials
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Build the FAISS index

Update the `SITE_PAGES` list in `ingest.py` with your page URLs (or use `http://localhost:5000/` for local development), then:

```bash
python ingest.py
```

This creates `faiss_index.bin` and `metadata.jsonl` in the project root.

### 4. Run the server

```bash
python app.py
```

Visit `http://localhost:5000` in your browser.

## Project Structure

```
project_root/
├── index.html          # Home page
├── about.html          # About page
├── projects.html       # Projects showcase
├── chatbot.html        # Chatbot interface
├── contact.html        # Contact form
├── terms.html          # Terms of use
├── privacy.html        # Privacy policy
├── 404.html            # Error page
├── slide1-3.html       # Design system slides
├── style.css           # Global styles
├── main.js             # Core JS (nav, animations, toast, back-to-top)
├── chatbot.js          # Chatbot frontend
├── contact.js          # Contact form handler
├── admin-ads.js        # Admin ad editor (index.html only)
├── app.py              # Flask backend (chat, contact, static)
├── ingest.py           # FAISS index builder
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variable template
└── .gitignore          # Git ignore rules
```

## Deployment Notes

- **Static hosting** (Netlify, Vercel, GitHub Pages): Works for frontend only. Chatbot and contact form require the Flask backend.
- **Full deployment** (Railway, Render, VPS): Deploy `app.py` as the entry point. Set environment variables from `.env.example`.
- **AdSense**: Paste your AdSense snippet into the `data-ads-html` attribute on any `.ads-slot` element, or use the admin editor at `?admin=1`.
- **Security**: The admin editor uses URL-parameter access (`?admin=1`) — for production, add proper authentication.
- **Rate limiting**: Consider adding Flask-Limiter for the `/chat` and `/contact` endpoints in production.

## License

MIT — feel free to use and modify.
