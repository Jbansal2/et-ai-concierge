import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
from config import GROQ_API_KEY, get_model
from agents.retry_utils import with_retry


import json

client = Groq(api_key=GROQ_API_KEY)

def run_finance_agent(profile: dict, question: str) -> str:
    """
    Answers financial questions based on user profile.
    """
    prompt = f"""
You are ET Saathi's financial advisor agent. Answer the user's financial question based on their profile.

User Profile:
{json.dumps(profile, indent=2)}

User Question: {question}

Rules:
- Give practical, actionable advice
- Keep response under 150 words
- Reference specific ET tools when relevant (ET Markets, ET Wealth, etc.)
- Be warm and friendly
- If Hindi question, reply in Hindi
"""
    response = client.chat.completions.create(
        model=get_model("finance"),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=300,
    )
    return response.choices[0].message.content.strip()



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