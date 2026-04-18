# app.py
import os, json, numpy as np
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
CONTACT_RECIPIENT = os.getenv("CONTACT_RECIPIENT")  # your email

EMBED_MODEL = "text-embedding-3-small"
LLM_MODEL = "gpt-4o-mini"  # replace with preferred model

client = OpenAI(api_key=OPENAI_API_KEY)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=BASE_DIR, static_url_path='/')

# load FAISS index and metadata
INDEX_PATH = os.path.join(BASE_DIR, "faiss_index.bin")
META_PATH = os.path.join(BASE_DIR, "metadata.jsonl")
index = None
metadata = []

def load_index():
    global index, metadata
    try:
        import faiss
        if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
            index = faiss.read_index(INDEX_PATH)
            with open(META_PATH, "r", encoding="utf-8") as f:
                metadata = [json.loads(line) for line in f if line.strip()]
            print(f"Loaded FAISS index ({index.ntotal} vectors) and {len(metadata)} metadata entries.")
        else:
            print(f"WARNING: Index or metadata file not found. Chatbot will not work.")
            print(f"  Expected: {INDEX_PATH}")
            print(f"  Expected: {META_PATH}")
    except ImportError:
        print("WARNING: faiss-cpu not installed. Chatbot will not work.")
    except Exception as e:
        print(f"WARNING: Failed to load index: {e}")

load_index()

def embed_query(q):
    resp = client.embeddings.create(model=EMBED_MODEL, input=[q])
    return np.array(resp.data[0].embedding).astype("float32")

def retrieve(q, k=4):
    if index is None:
        return []
    vec = embed_query(q)
    D, I = index.search(np.array([vec]), k)
    results = []
    for idx in I[0]:
        if 0 <= idx < len(metadata):
            results.append(metadata[idx])
    return results

def build_prompt(query, retrieved):
    context = "\n\n---\n\n".join([f"Source: {r['url']}\n\n{r['text']}" for r in retrieved])
    system = ("You are a helpful assistant that answers questions using only the provided site content. "
              "If the answer is not present in the content, say you don't know and offer to help otherwise.")
    prompt = f"{system}\n\nContext:\n{context}\n\nUser question: {query}\n\nAnswer concisely and cite sources by URL."
    return prompt

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    q = data.get('q', '').strip()
    if not q:
        return jsonify({'error': 'empty query'}), 400
    if index is None:
        return jsonify({'answer': 'Chatbot index is not loaded. Please run ingest.py first.', 'sources': []}), 200

    # retrieve
    retrieved = retrieve(q, k=4)
    prompt = build_prompt(q, retrieved)
    # call LLM
    try:
        resp = client.responses.create(
            model=LLM_MODEL,
            input=prompt,
            max_tokens=600
        )
        # extract text
        answer = ""
        if resp and getattr(resp, "output", None):
            parts = []
            for item in resp.output:
                if getattr(item, "content", None):
                    for c in item.content:
                        if hasattr(c, 'type') and c.type == "output_text":
                            parts.append(getattr(c, 'text', ''))
                        elif isinstance(c, dict) and c.get("type") == "output_text":
                            parts.append(c.get("text", ""))
            answer = "\n".join(parts).strip()
    except Exception as e:
        return jsonify({'answer': f'Error generating response: {str(e)}', 'sources': []}), 200

    # prepare sources
    sources = []
    for r in retrieved:
        sources.append({"url": r.get("url"), "title": r.get("title", "")})
    return jsonify({'answer': answer, 'sources': sources})

@app.route('/contact', methods=['POST'])
def contact():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', 'Contact Form')
    message = data.get('message', '').strip()
    if not (name and email and message):
        return jsonify({'error': 'missing fields'}), 400

    msg = EmailMessage()
    msg['Subject'] = f"Website contact: {subject}"
    msg['From'] = SMTP_USER or 'no-reply@example.com'
    msg['To'] = CONTACT_RECIPIENT or SMTP_USER
    body = f"Name: {name}\nEmail: {email}\n\n{message}"
    msg.set_content(body)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
        return jsonify({'status': 'sent'})
    except Exception as e:
        return jsonify({'status': 'error', 'detail': str(e)}), 500

# serve static files
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(BASE_DIR, path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
