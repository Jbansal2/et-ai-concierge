from fastapi import APIRouter
from pydantic import BaseModel
from agents.orchestrator import orchestrate
import uuid
from agents.memory_agent import save_profile, load_profile
from agents.news_agent import fetch_news
from agents.health_score_agent import calculate_health_score
from agents.finance_agent import run_finance_agent
from agents.cross_sell_agent import run_cross_sell_agent
from agents.portfolio_gap_agent import find_portfolio_gaps
from agents.ad_campaign_agent import get_personalized_ads
from agents.rag_agent import search_articles, get_index_stats, refresh_index

import yfinance as yf
from datetime import datetime

router = APIRouter()

# In-memory session store (replace with Redis in production)
sessions = {}


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    stage: str
    profile: dict | None = None
    recommendations: list | None = None


# ─────────────────────────────────────────────
# CHAT
# ─────────────────────────────────────────────

@router.post("/", response_model=ChatResponse)
def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())

    if session_id not in sessions:
        sessions[session_id] = {
            "session_id": session_id,
            "messages": [],
            "profile": None,
            "recommendations": None,
            "stage": "profiling",
        }

    session = sessions[session_id]
    session["messages"].append({"role": "user", "content": req.message})

    result = orchestrate(session)

    session["messages"].append({"role": "assistant", "content": result["reply"]})
    session["stage"] = result["stage"]

    if result.get("profile"):
        session["profile"] = result["profile"]
    if result.get("recommendations"):
        session["recommendations"] = result["recommendations"]

    # Save to memory only when profile is complete
    if result.get("profile") and result.get("recommendations"):
        save_profile(session_id, result["profile"], result["recommendations"])

    return ChatResponse(
        session_id=session_id,
        reply=result["reply"],
        stage=result["stage"],
        profile=result.get("profile"),
        recommendations=result.get("recommendations"),
    )


@router.get("/session/{session_id}")
def get_session(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}
    return sessions[session_id]


@router.post("/new")
def new_session(session_id: str = None):
    sid = session_id or str(uuid.uuid4())
    existing = load_profile(sid) if session_id else None

    if existing:
        sessions[sid] = {
            "session_id": sid,
            "messages": [],
            "profile": existing["profile"],
            "recommendations": existing["recommendations"],
            "stage": "done",
        }
        return {
            "session_id": sid,
            "returning_user": True,
            "profile": existing["profile"],
            "recommendations": existing["recommendations"]
        }

    sessions[sid] = {
        "session_id": sid,
        "messages": [],
        "profile": None,
        "recommendations": None,
        "stage": "profiling",
    }
    return {"session_id": sid, "returning_user": False}


# ─────────────────────────────────────────────
# NEWS
# ─────────────────────────────────────────────

@router.get("/news/{session_id}")
def get_news(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}
    profile = sessions[session_id].get("profile")
    if not profile:
        return {"news": []}
    interests = profile.get("interests", ["stocks"])
    news = fetch_news(interests)
    return {"news": news}


# ─────────────────────────────────────────────
# HEALTH SCORE
# ─────────────────────────────────────────────

@router.get("/health-score/{session_id}")
def get_health_score(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}
    profile = sessions[session_id].get("profile")
    if not profile:
        return {"error": "Profile not complete yet"}
    return calculate_health_score(profile)


# ─────────────────────────────────────────────
# FINANCE ASK
# ─────────────────────────────────────────────

@router.post("/ask/{session_id}")
def ask_finance(session_id: str, body: dict):
    if session_id not in sessions:
        return {"error": "Session not found"}
    profile = sessions[session_id].get("profile")
    if not profile:
        return {"error": "Profile not complete"}
    answer = run_finance_agent(profile, body.get("question", ""))
    return {"answer": answer}


# ─────────────────────────────────────────────
# CROSS SELL
# ─────────────────────────────────────────────

@router.get("/cross-sell/{session_id}")
def cross_sell(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}
    session = sessions[session_id]
    profile = session.get("profile")
    recs = session.get("recommendations", [])
    if not profile:
        return {"suggestions": []}
    current = [r["product_key"] for r in recs]
    suggestions = run_cross_sell_agent(profile, current)
    return {"suggestions": suggestions}


# ─────────────────────────────────────────────
# PORTFOLIO GAPS
# ─────────────────────────────────────────────

@router.get("/portfolio-gaps/{session_id}")
def get_portfolio_gaps(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}
    profile = sessions[session_id].get("profile")
    if not profile:
        return {"error": "Profile not complete"}

    result = find_portfolio_gaps(profile)

    url_map = {
        "ET Wealth":    "https://economictimes.indiatimes.com/wealth",
        "ET Tax":       "https://economictimes.indiatimes.com/wealth/tax",
        "ET Markets":   "https://economictimes.indiatimes.com/markets",
        "ET Insurance": "https://economictimes.indiatimes.com/wealth/insure",
        "ET MF":        "https://economictimes.indiatimes.com/mf",
        "ET Prime":     "https://economictimes.indiatimes.com/prime",
        "ET Startup":   "https://economictimes.indiatimes.com/small-biz/startups",
    }
    for gap in result.get("gaps", []):
        product = gap.get("et_product", "ET Wealth")
        gap["et_url"] = url_map.get(product, "https://economictimes.indiatimes.com/wealth")

    return result


# ─────────────────────────────────────────────
# ET SCORE
# ─────────────────────────────────────────────

@router.get("/et-score/{session_id}")
def get_et_score(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}
    profile = sessions[session_id].get("profile")
    if not profile:
        return {"error": "Profile not complete"}

    exp = profile.get("experience", "beginner")
    goals = profile.get("goals", [])
    interests = profile.get("interests", [])

    breakdown = {
        "profile_depth":    {"beginner": 15, "intermediate": 20, "expert": 25}.get(exp, 15),
        "goal_clarity":     min(len(goals) * 10, 25),
        "interest_breadth": min(len(interests) * 8, 25),
        "engagement":       20
    }
    total = sum(breakdown.values())

    level = "Platinum" if total >= 90 else "Gold" if total >= 70 else "Silver" if total >= 50 else "Bronze"
    next_level = {"Bronze": "Silver", "Silver": "Gold", "Gold": "Platinum"}.get(level)
    thresholds = {"Bronze": 50, "Silver": 70, "Gold": 90, "Platinum": 100}
    points_needed = (thresholds[next_level] - total) if next_level else 0

    return {
        "et_score":      total,
        "level":         level,
        "next_level":    next_level,
        "points_needed": points_needed,
        "badge":  {"Platinum": "💎", "Gold": "🥇", "Silver": "🥈", "Bronze": "🥉"}[level],
        "color":  {"Platinum": "#6366f1", "Gold": "#f59e0b", "Silver": "#94a3b8", "Bronze": "#cd7c2f"}[level],
        "breakdown": breakdown
    }


# ─────────────────────────────────────────────
# AI INSIGHT
# ─────────────────────────────────────────────

@router.get("/ai-insight/{session_id}")
def get_ai_insight(session_id: str):
    if session_id not in sessions:
        return {"insight": "Based on your profile, you're missing key ET opportunities.", "missing_count": 3}
    profile = sessions[session_id].get("profile")
    if not profile:
        return {"insight": "Complete your profile to get personalized insights.", "missing_count": 0}

    prompt = f"""Based on this user profile, write ONE powerful insight sentence (max 20 words) about what ET opportunities they are missing. Be specific to their goals and interests. No fluff.

Profile: {profile}

Return ONLY the insight sentence, nothing else."""

    answer = run_finance_agent(profile, prompt)
    missing = len(profile.get("interests", [])) + 1
    return {"insight": answer, "missing_count": missing}


# ─────────────────────────────────────────────
# MARKET TICKER
# ─────────────────────────────────────────────

@router.get("/market-ticker")
def get_market_ticker():
    try:
        symbols = {"sensex": "^BSESN", "nifty": "^NSEI"}
        individual = {
            "RELIANCE": "RELIANCE.NS", "TCS": "TCS.NS",
            "HDFC BANK": "HDFCBANK.NS", "INFOSYS": "INFY.NS",
            "WIPRO": "WIPRO.NS", "ICICI BANK": "ICICIBANK.NS",
            "MARUTI": "MARUTI.NS", "ITC": "ITC.NS",
            "BAJAJ FIN": "BAJFINANCE.NS", "ADANI ENT": "ADANIENT.NS",
        }
        indices_extra = {
            "Nifty Bank": "^NSEBANK",
            "Nifty IT": "^CNXIT",
            "Nifty Midcap": "^NSEMDCP50",
        }

        def get_quote(symbol):
            try:
                info = yf.Ticker(symbol).fast_info
                price = round(info.last_price, 2)
                prev = round(info.previous_close, 2)
                change = round(price - prev, 2)
                pct = round((change / prev) * 100, 2)
                return {
                    "price": f"{price:,.2f}",
                    "change": f"{abs(change):,.2f}",
                    "pct": f"{abs(pct):.2f}%",
                    "up": change >= 0
                }
            except Exception:
                return {"price": "N/A", "change": "0", "pct": "0%", "up": True}

        sensex = get_quote(symbols["sensex"])
        nifty = get_quote(symbols["nifty"])

        stocks = [{"symbol": name, **{k: get_quote(sym)[k] for k in ["price","change","up"]}}
                  for name, sym in individual.items()]

        indices = [{"name": name, "price": get_quote(sym)["price"],
                    "pct": f"{'+'if get_quote(sym)['up'] else '-'}{get_quote(sym)['pct']}",
                    "up": get_quote(sym)["up"]}
                   for name, sym in indices_extra.items()]

        gold = get_quote("GC=F")
        usd = get_quote("USDINR=X")

        gainers = sorted(
            [{"name": s["symbol"], "price": s["price"], "pct": s["change"]} for s in stocks],
            key=lambda x: float(x["pct"].replace(",", "")) if x["pct"] != "N/A" else 0,
            reverse=True
        )[:3]

        return {
            "sensex": sensex, "nifty": nifty,
            "gold": gold, "usd": usd,
            "indices": indices,
            "crypto": [
                {"name": "Bitcoin",  "price": "84,201", "pct": "+1.24%", "up": True},
                {"name": "Ethereum", "price": "1,934",  "pct": "+0.87%", "up": True},
                {"name": "Solana",   "price": "131",     "pct": "+2.11%", "up": True},
            ],
            "gainers": gainers,
            "stocks": stocks
        }
    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────────
# ADS
# ─────────────────────────────────────────────

@router.get("/ads/{session_id}")
def get_ads(session_id: str):
    if session_id not in sessions:
        return {"ads": []}
    profile = sessions[session_id].get("profile")
    if not profile:
        return {"ads": []}
    return {"ads": get_personalized_ads(profile, count=2)}


# ─────────────────────────────────────────────
# RAG — Semantic Search
# ─────────────────────────────────────────────

@router.get("/search/{session_id}")
def search_et_content(session_id: str, q: str, category: str = None):
    """Semantic search over real ET articles fetched from RSS"""
    if not q:
        return {"results": []}
    results = search_articles(q, top_k=3, category_filter=category)
    return {"results": results, "query": q}


@router.get("/rag-stats")
def rag_stats():
    """Check RAG index status — how many articles indexed"""
    return get_index_stats()


@router.post("/rag-refresh")
def rag_refresh():
    """Manually refresh RAG index from ET RSS feeds"""
    refresh_index()
    stats = get_index_stats()
    return {"status": "refreshed", "total_articles": stats["total_articles"]}