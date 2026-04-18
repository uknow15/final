# ingest.py — Build FAISS index from site pages
import os, json
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

# CONFIG — Update BASE_URL to your deployed domain or keep localhost for dev
BASE_URL = "http://localhost:5000"
SITE_PAGES = [
    f"{BASE_URL}/index.html",
    f"{BASE_URL}/about.html",
    f"{BASE_URL}/projects.html",
    f"{BASE_URL}/contact.html",
    f"{BASE_URL}/chatbot.html",
    f"{BASE_URL}/terms.html",
    f"{BASE_URL}/privacy.html",
]

CHUNK_TOKENS = 400  # approximate chunk size
EMBED_MODEL = "text-embedding-3-small"
OUT_INDEX = "faiss_index.bin"
OUT_META = "metadata.jsonl"


def extract_text_from_url(url):
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    # remove scripts/styles
    for s in soup(["script", "style", "noscript"]):
        s.decompose()
    text = soup.get_text(separator="\n")
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return "\n".join(lines)


def chunk_text(text, max_chars=2000):
    """Simple char-based chunking to approximate token chunks."""
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
    """OpenAI embeddings in batches."""
    embeddings = []
    BATCH = 16
    for i in tqdm(range(0, len(texts), BATCH), desc="Embedding"):
        batch = texts[i:i + BATCH]
        resp = client.embeddings.create(model=EMBED_MODEL, input=batch)
        for item in resp.data:
            embeddings.append(item.embedding)
    return np.array(embeddings).astype("float32")


def main():
    docs = []
    for url in SITE_PAGES:
        try:
            text = extract_text_from_url(url)
            chunks = chunk_text(text, max_chars=1800)
            page_name = url.split("/")[-1] or "index.html"
            for i, c in enumerate(chunks):
                docs.append({
                    "url": url,
                    "text": c,
                    "title": page_name,
                    "id": f"{page_name}_{i}"
                })
            print(f"  ✓ {page_name}: {len(chunks)} chunk(s)")
        except Exception as e:
            print(f"  ✗ Failed to fetch {url}: {e}")

    if not docs:
        print("No documents to index. Make sure the server is running.")
        return

    texts = [d["text"] for d in docs]
    print(f"\nEmbedding {len(texts)} chunks...")
    embs = embed_texts(texts)

    dim = embs.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embs)
    faiss.write_index(index, OUT_INDEX)

    # save metadata
    with open(OUT_META, "w", encoding="utf-8") as f:
        for d in docs:
            f.write(json.dumps(d, ensure_ascii=False) + "\n")

    print(f"\n✓ Ingest complete. {len(docs)} chunks indexed.")
    print(f"  Index: {OUT_INDEX}")
    print(f"  Metadata: {OUT_META}")


if __name__ == "__main__":
    main()
