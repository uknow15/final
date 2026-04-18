# ingest.py
import os, json, math
from bs4 import BeautifulSoup
import requests
from tqdm import tqdm
import numpy as np
import faiss
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# CONFIG
SITE_PAGES = [
  "https://your-domain-or-local/index.html",
  "https://your-domain-or-local/about.html",
  "https://your-domain-or-local/projects.html",
  "https://your-domain-or-local/contact.html",
  "https://your-domain-or-local/chatbot.html",
  "https://your-domain-or-local/terms.html",
  "https://your-domain-or-local/privacy.html"
]
CHUNK_TOKENS = 400  # approximate chunk size
EMBED_MODEL = "text-embedding-3-small"
OUT_INDEX = "data/faiss_index.bin"
OUT_META = "data/metadata.jsonl"

def extract_text_from_url(url):
    r = requests.get(url, timeout=10)
    soup = BeautifulSoup(r.text, "html.parser")
    # remove scripts/styles
    for s in soup(["script","style","noscript"]):
        s.decompose()
    text = soup.get_text(separator="\n")
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return "\n".join(lines)

def chunk_text(text, max_chars=2000):
    # simple char-based chunking to approximate token chunks
    words = text.split()
    chunks = []
    cur = []
    cur_len = 0
    for w in words:
        cur.append(w)
        cur_len += len(w) + 1
        if cur_len > max_chars:
            chunks.append(" ".join(cur))
            cur = []
            cur_len = 0
    if cur:
        chunks.append(" ".join(cur))
    return chunks

def embed_texts(texts):
    # OpenAI embeddings in batches
    embeddings = []
    BATCH = 16
    for i in range(0, len(texts), BATCH):
        batch = texts[i:i+BATCH]
        resp = client.embeddings.create(model=EMBED_MODEL, input=batch)
        for item in resp.data:
            embeddings.append(item.embedding)
    return np.array(embeddings).astype("float32")

def main():
    os.makedirs("data", exist_ok=True)
    docs = []
    for url in SITE_PAGES:
        try:
            text = extract_text_from_url(url)
            chunks = chunk_text(text, max_chars=1800)
            for i, c in enumerate(chunks):
                docs.append({"url":url, "text":c, "title": url.split("/")[-1], "id": f"{os.path.basename(url)}_{i}"})
        except Exception as e:
            print("Failed to fetch", url, e)

    texts = [d["text"] for d in docs]
    print(f"Embedding {len(texts)} chunks...")
    embs = embed_texts(texts)

    dim = embs.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embs)
    faiss.write_index(index, OUT_INDEX)
    # save metadata
    with open(OUT_META, "w", encoding="utf-8") as f:
        for d in docs:
            f.write(json.dumps(d, ensure_ascii=False) + "\n")
    print("Ingest complete. Index and metadata saved.")

if __name__ == "__main__":
    main()
