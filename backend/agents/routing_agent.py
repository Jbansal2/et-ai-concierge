import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
from config import GROQ_API_KEY, get_model
from agents.retry_utils import with_retry


import json

client = Groq(api_key=GROQ_API_KEY)


# ET Products data
ET_PRODUCTS = {
    "et_prime": {
        "name": "ET Prime",
        "description": "In-depth business analysis, exclusive stories, expert opinions",
        "best_for": ["investor", "professional", "entrepreneur"],
        "url": "https://economictimes.com/prime"
    },
    "et_markets": {
        "name": "ET Markets",
        "description": "Stock market, mutual funds, IPOs, portfolio tracker",
        "best_for": ["investor", "trader"],
        "url": "https://economictimes.com/markets"
    },
    "et_masterclass": {
        "name": "ET Masterclass",
        "description": "Finance and business courses by industry experts",
        "best_for": ["student", "beginner", "professional"],
        "url": "https://economictimes.com/masterclass"
    },
    "et_wealth": {
        "name": "ET Wealth",
        "description": "Personal finance, tax planning, insurance, retirement",
        "best_for": ["investor", "professional", "homemaker"],
        "url": "https://economictimes.com/wealth"
    },
    "et_startup": {
        "name": "ET Startup",
        "description": "Startup ecosystem, funding news, founder stories",
        "best_for": ["entrepreneur", "student"],
        "url": "https://economictimes.com/startup"
    },
    "et_services": {
        "name": "ET Financial Services",
        "description": "Credit cards, loans, insurance, wealth management",
        "best_for": ["investor", "professional", "homemaker"],
        "url": "https://economictimes.com/services"
    }
}

ROUTING_PROMPT = """
You are ET Saathi's routing engine. Given a user profile, recommend the top 3 most relevant ET products.

Available ET products:
{products}

User profile:
{profile}

Return a JSON array of exactly 3 recommended products with a short personalised reason for each.
Format:
[
  {{
    "product_key": "et_markets",
    "product_name": "ET Markets",
    "reason": "Since you're an active investor tracking mutual funds, ET Markets gives you real-time data and portfolio tools.",
    "url": "https://economictimes.com/markets"
  }}
]

Return ONLY the JSON array, no extra text.
"""

def run_routing_agent(profile: dict) -> list:
    """
    Takes a user profile and returns top 3 ET product recommendations.
    """
    products_str = json.dumps(ET_PRODUCTS, indent=2)
    profile_str = json.dumps(profile, indent=2)

    response = client.chat.completions.create(
    model=get_model("routing"),
        messages=[
            {
                "role": "user",
                "content": ROUTING_PROMPT.format(
                    products=products_str,
                    profile=profile_str
                )
            }
        ],
        temperature=0.3,
        max_tokens=512,
    )

    reply = response.choices[0].message.content.strip()

    try:
        recommendations = json.loads(reply)
        return recommendations
    except Exception:
        # Fallback to default recommendations
        return [
            {
                "product_key": "et_prime",
                "product_name": "ET Prime",
                "reason": "Get deep business insights tailored for you.",
                "url": "https://economictimes.com/prime"
            },
            {
                "product_key": "et_markets",
                "product_name": "ET Markets",
                "reason": "Track markets, stocks, and your investments.",
                "url": "https://economictimes.com/markets"
            },
            {
                "product_key": "et_wealth",
                "product_name": "ET Wealth",
                "reason": "Plan your finances, taxes, and retirement.",
                "url": "https://economictimes.com/wealth"
            }
        ]
        
        
def run_routing_agent(profile: dict) -> list:
    def _call():
        response = client.chat.completions.create(
            model=get_model("routing"),
            messages=[{"role": "user", "content": ROUTING_PROMPT.format(...)}],
            temperature=0.3,
            max_tokens=512,
        )
        return json.loads(response.choices[0].message.content.strip())

    def _fallback():
        return [
            {"product_key": "et_markets", "product_name": "ET Markets",
             "reason": "Track your investments.", "url": "https://economictimes.com/markets"},
            {"product_key": "et_wealth", "product_name": "ET Wealth",
             "reason": "Plan your finances.", "url": "https://economictimes.com/wealth"},
        ]

    return with_retry(_call, retries=3, delay=0.5, fallback=_fallback)        