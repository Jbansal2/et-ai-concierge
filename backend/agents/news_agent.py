import urllib.request
import xml.etree.ElementTree as ET
import re

RSS_FEEDS = {
    "stocks": "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms",
    "mutual funds": "https://economictimes.indiatimes.com/mf/rssfeeds/2146842.cms",
    "mutual_funds": "https://economictimes.indiatimes.com/mf/rssfeeds/2146842.cms",
    "startups": "https://economictimes.indiatimes.com/small-biz/startups/rssfeeds/2146842.cms",
    "economy": "https://economictimes.indiatimes.com/news/economy/rssfeeds/2146842.cms",
    "real estate": "https://economictimes.indiatimes.com/industry/services/property-/-cstruction/rssfeeds/13358404.cms",
    "real_estate": "https://economictimes.indiatimes.com/industry/services/property-/-cstruction/rssfeeds/13358404.cms",
    "crypto": "https://economictimes.indiatimes.com/markets/cryptocurrency/rssfeeds/2146842.cms",
    "markets": "https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms",
    "default": "https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms",
}

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"}

def extract_image(item):
    for ns in ["{http://search.yahoo.com/mrss/}content", "{http://search.yahoo.com/mrss/}thumbnail"]:
        el = item.find(ns)
        if el is not None:
            url = el.get("url", "")
            if url and url.startswith("http"): return url

    enc = item.find("enclosure")
    if enc is not None:
        url = enc.get("url", "")
        if url and url.startswith("http"): return url

    desc = item.findtext("description", "")
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', desc)
    if match:
        url = match.group(1)
        if url.startswith("http"): return url

    return None

def fetch_article_image(article_url: str) -> str:
    try:
        req = urllib.request.Request(article_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=4) as response:
            html = response.read().decode("utf-8", errors="ignore")
            for pattern in [
                r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
                r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
            ]:
                match = re.search(pattern, html)
                if match:
                    url = match.group(1)
                    if url.startswith("http"): return url
    except Exception:
        pass
    return None

def fetch_from_feed(url: str, interest: str, max_items: int, seen: set) -> list:
    results = []
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=6) as response:
            content = response.read()
            root = ET.fromstring(content)
            for item in root.findall(".//item")[:max_items]:
                title = item.findtext("title", "").strip()
                link = item.findtext("link", "").strip()
                pub_date = item.findtext("pubDate", "")

                if not title or not link or title in seen:
                    continue

                seen.add(title)
                image = extract_image(item)
                if not image and link:
                    image = fetch_article_image(link)

                results.append({
                    "title": title,
                    "link": link,
                    "date": pub_date,
                    "category": interest,
                    "image": image
                })
    except Exception as e:
        print(f"RSS error [{interest}]: {e}")
    return results

def fetch_news(interests: list, max_items: int = 6) -> list:
    news = []
    seen = set()

    for interest in interests:
        key = interest.lower().strip()
        url = RSS_FEEDS.get(key) or RSS_FEEDS.get(key.replace(" ", "_")) or RSS_FEEDS["default"]
        items = fetch_from_feed(url, interest, max_items, seen)

        # Agar interest specific feed se items nahi aaye toh default se try karo
        if not items:
            items = fetch_from_feed(RSS_FEEDS["default"], interest, max_items, seen)

        news.extend(items)

    return news[:8]