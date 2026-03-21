import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import numpy as np
import urllib.request
import xml.etree.ElementTree as ET_XML
import re
from agents.retry_utils import with_retry

# ET RSS feeds
ET_RSS_FEEDS = [
    "https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms",
    "https://economictimes.indiatimes.com/mf/rssfeeds/2146842.cms",
    "https://economictimes.indiatimes.com/wealth/rssfeeds/2146842.cms",
    "https://economictimes.indiatimes.com/small-biz/startups/rssfeeds/2146842.cms",
    "https://economictimes.indiatimes.com/news/economy/rssfeeds/2146842.cms",
    "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms",
    "https://economictimes.indiatimes.com/wealth/tax/rssfeeds/2146842.cms",
    "https://economictimes.indiatimes.com/industry/services/property-/-cstruction/rssfeeds/13358404.cms",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

_model = None
_index = None
_articles = []

def _load_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print("Loading embedding model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Model loaded.")
    return _model

def fetch_all_articles(max_per_feed: int = 20) -> list:
    """Fetch real articles from ET RSS feeds"""
    articles = []
    seen = set()

    for feed_url in ET_RSS_FEEDS:
        try:
            req = urllib.request.Request(feed_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=6) as resp:
                root = ET_XML.parse(resp).getroot()
                for item in root.findall(".//item")[:max_per_feed]:
                    title = item.findtext("title", "").strip()
                    link = item.findtext("link", "").strip()
                    desc = item.findtext("description", "").strip()
                    pub_date = item.findtext("pubDate", "")

                    # Clean HTML from description
                    desc_clean = re.sub(r"<[^>]+>", "", desc).strip()[:300]

                    if title and link and title not in seen:
                        seen.add(title)
                        # Detect category from feed URL
                        category = "markets"
                        if "mf" in feed_url: category = "mutual funds"
                        elif "wealth/tax" in feed_url: category = "tax"
                        elif "wealth" in feed_url: category = "personal finance"
                        elif "startup" in feed_url: category = "startups"
                        elif "economy" in feed_url: category = "economy"
                        elif "stocks" in feed_url: category = "stocks"
                        elif "property" in feed_url: category = "real estate"

                        articles.append({
                            "title": title,
                            "content": desc_clean or title,
                            "url": link,
                            "category": category,
                            "date": pub_date
                        })
        except Exception as e:
            print(f"RSS fetch error [{feed_url}]: {e}")
            continue

    print(f"Fetched {len(articles)} articles from ET RSS")
    return articles

def build_index(articles: list):
    """Build FAISS vector index from articles"""
    import faiss
    model = _load_model()
    texts = [f"{a['title']} {a['content']}" for a in articles]
    vecs = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    vecs = vecs / np.linalg.norm(vecs, axis=1, keepdims=True)
    index = faiss.IndexFlatIP(vecs.shape[1])
    index.add(vecs.astype(np.float32))
    return index

def _ensure_index():
    """Lazy load — build index on first search request"""
    global _index, _articles
    if _index is None or len(_articles) == 0:
        print("Building RAG index from ET RSS...")
        _articles = fetch_all_articles()
        if _articles:
            _index = build_index(_articles)
            print(f"RAG index ready — {len(_articles)} articles indexed")
        else:
            print("No articles fetched — RAG unavailable")

def refresh_index():
    """Call this to refresh articles — run periodically"""
    global _index, _articles
    _articles = fetch_all_articles()
    if _articles:
        _index = build_index(_articles)
        print(f"RAG index refreshed — {len(_articles)} articles")

def search_articles(query: str, top_k: int = 3, category_filter: str = None) -> list:
    """
    Semantic search over real ET articles.
    Optionally filter by category.
    """
    def _search():
        import faiss
        _ensure_index()
        if _index is None or not _articles:
            return []

        model = _load_model()
        q_vec = model.encode([query], convert_to_numpy=True)
        q_vec = q_vec / np.linalg.norm(q_vec)

        # Search more, then filter
        k = min(top_k * 3, len(_articles))
        scores, indices = _index.search(q_vec.astype(np.float32), k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= len(_articles):
                continue
            if float(score) < 0.2:
                continue
            article = _articles[idx].copy()
            article["relevance_score"] = round(float(score), 3)

            # Category filter
            if category_filter and article["category"] != category_filter:
                continue

            results.append(article)
            if len(results) >= top_k:
                break

        return results

    return with_retry(_search, retries=2, delay=0.5, fallback=[])

def get_index_stats() -> dict:
    """Return stats about current index"""
    _ensure_index()
    return {
        "total_articles": len(_articles),
        "categories": list(set(a["category"] for a in _articles)),
        "index_ready": _index is not None
    }