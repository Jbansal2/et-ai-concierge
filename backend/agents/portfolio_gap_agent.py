import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
import json

client = Groq(api_key=GROQ_API_KEY)

ET_URLS = {
    "ET Wealth": "https://economictimes.indiatimes.com/wealth",
    "ET Tax": "https://economictimes.indiatimes.com/wealth/tax",
    "ET Markets": "https://economictimes.indiatimes.com/markets",
    "ET Insurance": "https://economictimes.indiatimes.com/wealth/insure",
    "ET MF": "https://economictimes.indiatimes.com/mf",
    "ET Prime": "https://economictimes.indiatimes.com/prime",
    "ET Startup": "https://economictimes.indiatimes.com/small-biz/startups",
}

def find_portfolio_gaps(profile: dict) -> dict:
    prompt = f"""
You are ET Saathi's portfolio analysis agent. Based on the user profile, identify their investment gaps.

User Profile:
{json.dumps(profile, indent=2)}

Analyze and return a JSON with exactly this structure:
{{
  "gaps": [
    {{
      "category": "Emergency Fund",
      "status": "missing",
      "severity": "high",
      "icon": "🚨",
      "message": "You have no emergency fund. Keep 6 months expenses liquid.",
      "et_product": "ET Wealth"
    }}
  ],
  "strong_areas": [
    {{
      "category": "Long Term Planning",
      "icon": "✅",
      "message": "Good focus on retirement planning."
    }}
  ],
  "overall_gap_score": 65
}}

Rules:
- Identify exactly 3-4 gaps based on their profile
- Identify 2-3 strong areas
- Gaps can be: Emergency Fund, Tax Planning, Insurance, Diversification, Debt Management, International Exposure, Gold Allocation
- et_product must be one of: ET Wealth, ET Tax, ET Markets, ET Insurance, ET MF, ET Prime, ET Startup
- Severity: high/medium/low
- overall_gap_score: 0-100 (higher = better portfolio health)
- Return ONLY the JSON, nothing else.
"""
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=700,
    )
    try:
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        if "}" in text:
            text = text[:text.rfind("}")+1]
        data = json.loads(text.strip())

        # Fix URLs from map
        for gap in data.get("gaps", []):
            product = gap.get("et_product", "ET Wealth")
            gap["et_url"] = ET_URLS.get(product, ET_URLS["ET Wealth"])

        return data
    except Exception:
        return {
            "gaps": [
                {"category": "Emergency Fund", "severity": "high", "icon": "🚨",
                 "message": "Keep 6 months expenses as liquid savings.",
                 "et_product": "ET Wealth", "et_url": ET_URLS["ET Wealth"]},
                {"category": "Tax Planning", "severity": "medium", "icon": "📊",
                 "message": "ELSS investments can save up to ₹46,800 in taxes.",
                 "et_product": "ET Tax", "et_url": ET_URLS["ET Tax"]},
            ],
            "strong_areas": [
                {"category": "Investment Mindset", "icon": "✅", "message": "You are actively investing"}
            ],
            "overall_gap_score": 50
        }