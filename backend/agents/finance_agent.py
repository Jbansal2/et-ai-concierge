import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
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
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=300,
    )
    return response.choices[0].message.content.strip()