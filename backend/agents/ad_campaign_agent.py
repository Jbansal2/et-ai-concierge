import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
import json

client = Groq(api_key=GROQ_API_KEY)

# ET ke real ad campaigns
ET_ADS = [
    {
        "id": "et_prime_001",
        "title": "ET Prime — India's #1 Business Intelligence",
        "tagline": "Read what India's top investors read",
        "cta": "Start Free Trial",
        "url": "https://economictimes.indiatimes.com/prime",
        "image_emoji": "",
        "bg": "amber",
        "target": ["investor", "professional", "entrepreneur"],
        "interests": ["stocks", "economy", "startups"],
        "goals": ["wealth building"]
    },
    {
        "id": "et_markets_001",
        "title": "ET Markets Pro",
        "tagline": "Real-time data, portfolio tracker & expert picks",
        "cta": "Track Your Portfolio",
        "url": "https://economictimes.indiatimes.com/markets",
        "image_emoji": "",
        "bg": "blue",
        "target": ["investor", "trader"],
        "interests": ["stocks", "mutual funds"],
        "goals": ["wealth building", "retirement"]
    },
    {
        "id": "et_wealth_001",
        "title": "ET Wealth — Your Money, Multiplied",
        "tagline": "Tax saving, insurance & retirement planning",
        "cta": "Plan Your Wealth",
        "url": "https://economictimes.indiatimes.com/wealth",
        "image_emoji": "",
        "bg": "green",
        "target": ["investor", "professional", "homemaker"],
        "interests": ["mutual funds", "real estate"],
        "goals": ["retirement", "home buying", "child education"]
    },
    {
        "id": "et_mf_001",
        "title": "ET Money — SIP in 5 Minutes",
        "tagline": "Zero commission mutual funds. Start with ₹500",
        "cta": "Start SIP Now",
        "url": "https://www.etmoney.com",
        "image_emoji": "",
        "bg": "purple",
        "target": ["student", "beginner", "professional"],
        "interests": ["mutual funds"],
        "goals": ["wealth building", "retirement"]
    },
    {
        "id": "et_masterclass_001",
        "title": "ET Masterclass — Learn from the Best",
        "tagline": "Finance courses by India's top experts",
        "cta": "Enroll Now",
        "url": "https://economictimes.indiatimes.com/masterclass",
        "image_emoji": "",
        "bg": "indigo",
        "target": ["student", "beginner"],
        "interests": ["stocks", "mutual funds"],
        "goals": ["wealth building"]
    },
    {
        "id": "et_startup_001",
        "title": "ET Startup — India's Startup Bible",
        "tagline": "Funding news, founder stories & investor insights",
        "cta": "Explore Startups",
        "url": "https://economictimes.indiatimes.com/small-biz/startups",
        "image_emoji": "",
        "bg": "pink",
        "target": ["entrepreneur", "investor"],
        "interests": ["startups"],
        "goals": ["wealth building"]
    },
    {
        "id": "et_tax_001",
        "title": "Save Tax. Save More.",
        "tagline": "Find every deduction you're missing this year",
        "cta": "Calculate Savings",
        "url": "https://economictimes.indiatimes.com/wealth/tax",
        "image_emoji": "",
        "bg": "teal",
        "target": ["professional", "investor"],
        "interests": ["mutual funds"],
        "goals": ["wealth building", "retirement"]
    },
]

def get_personalized_ads(profile: dict, count: int = 2) -> list:
    """
    Rule-based + AI scoring to pick most relevant ads for user profile.
    """
    user_type = profile.get("user_type", "").lower()
    interests = [i.lower() for i in profile.get("interests", [])]
    goals = [g.lower() for g in profile.get("goals", [])]
    experience = profile.get("experience", "beginner").lower()

    scored = []
    for ad in ET_ADS:
        score = 0

        # User type match
        if user_type in ad.get("target", []):
            score += 3

        # Interest match
        for interest in interests:
            if interest in ad.get("interests", []):
                score += 2

        # Goal match
        for goal in goals:
            if goal in ad.get("goals", []):
                score += 2

        # Experience boost
        if experience == "beginner" and ad["id"] in ["et_masterclass_001", "et_mf_001"]:
            score += 2
        if experience in ["intermediate", "expert"] and ad["id"] in ["et_markets_001", "et_prime_001"]:
            score += 2

        scored.append((score, ad))

    # Sort by score descending
    scored.sort(key=lambda x: x[0], reverse=True)

    # Use AI to write personalized tagline for top ads
    top_ads = [ad for _, ad in scored[:count]]

    try:
        prompt = f"""
User profile: {json.dumps(profile)}

For each of these ET ads, write a SHORT personalized tagline (max 10 words) that speaks directly to this user's goals.

Ads: {json.dumps([{"id": a["id"], "title": a["title"]} for a in top_ads])}

Return JSON array:
[{{"id": "ad_id", "personalized_tagline": "tagline here"}}]
Return ONLY JSON array.
"""
        res = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=200,
        )
        text = res.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        taglines = json.loads(text.strip())
        tagline_map = {t["id"]: t["personalized_tagline"] for t in taglines}

        for ad in top_ads:
            if ad["id"] in tagline_map:
                ad["tagline"] = tagline_map[ad["id"]]
    except Exception:
        pass

    return top_ads