import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
import json

client = Groq(api_key=GROQ_API_KEY)

def run_content_agent(profile: dict, query: str) -> str:
    """
    Given user profile and a query, returns personalized ET content suggestions.
    """
    prompt = f"""
You are ET Saathi's content agent. Based on the user profile below, suggest 3 relevant ET articles or content pieces they should read today.

User Profile:
{json.dumps(profile, indent=2)}

User Query: {query}

Return a JSON array of 3 content suggestions:
[
  {{
    "title": "Article title here",
    "summary": "One line summary",
    "category": "markets/startups/economy/wealth",
    "url": "https://economictimes.com/relevant-path",
    "read_time": "3 min"
  }}
]
Return ONLY the JSON array, nothing else.
"""
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=512,
    )
    try:
        return json.loads(response.choices[0].message.content.strip())
    except Exception:
        return []