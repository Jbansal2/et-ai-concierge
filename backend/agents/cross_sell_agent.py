import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
from config import GROQ_API_KEY, get_model

import json

client = Groq(api_key=GROQ_API_KEY)

ET_SERVICES = [
    {"name": "ET Money", "desc": "Invest in mutual funds", "url": "https://etmoney.com"},
    {"name": "ET Prime", "desc": "Premium business insights", "url": "https://economictimes.com/prime"},
    {"name": "ET Markets Pro", "desc": "Advanced market tools", "url": "https://economictimes.com/markets"},
    {"name": "ET Masterclass", "desc": "Finance courses", "url": "https://economictimes.com/masterclass"},
]

def run_cross_sell_agent(profile: dict, current_products: list) -> list:
    """
    Suggests additional ET services user hasn't tried yet.
    """
    prompt = f"""
You are ET Saathi's cross-sell agent. Based on user profile, suggest 2 ET services they should try next.

User Profile:
{json.dumps(profile, indent=2)}

Already Recommended: {json.dumps(current_products, indent=2)}

Available Services:
{json.dumps(ET_SERVICES, indent=2)}

Return a JSON array of 2 suggestions with a personalized reason:
[
  {{
    "name": "ET Money",
    "reason": "Personalized reason based on their profile",
    "url": "https://etmoney.com",
    "cta": "Try Now"
  }}
]
Return ONLY the JSON array.
"""
    response = client.chat.completions.create(
        model=get_model("cross_sell"),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=300,
    )
    try:
        return json.loads(response.choices[0].message.content.strip())
    except Exception:
        return []