import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
from config import GROQ_API_KEY, get_model
from agents.retry_utils import with_retry

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """
You are ET Saathi, a friendly AI concierge for Economic Times (ET).

Collect these 5 things through natural conversation:
1. user_type (investor/student/entrepreneur/professional/homemaker)
2. goals (wealth building/retirement/child education/home buying)
3. experience (beginner/intermediate/expert)
4. interests (stocks/mutual funds/startups/economy/real estate)
5. language (hindi/english)

Rules:
- Ask ONE question at a time.
- Be warm and conversational.
- Reply in Hindi if user writes in Hindi.
- Once you have all 5 answers, your VERY NEXT response MUST start with a short friendly line, then IMMEDIATELY output PROFILE_READY: followed by the JSON block.
- Do NOT say "let me summarize" or "I have your profile" without outputting the JSON.
- CRITICAL: The JSON must appear in your response. No exceptions.

Example of correct final response:
"That's perfect! Here's your personalized ET setup.
PROFILE_READY:
{
  "user_type": "investor",
  "goals": ["wealth building", "retirement"],
  "experience": "intermediate",
  "interests": ["stocks", "mutual funds"],
  "language": "english",
  "profile_complete": true
}"

Start by greeting the user and asking what they do.
"""

def run_profiling_agent(messages: list) -> dict:
    response = client.chat.completions.create(
    model=get_model("profiling"),
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        temperature=0.4,
        max_tokens=600,
    )

    reply = response.choices[0].message.content

    if "PROFILE_READY:" in reply:
        parts = reply.split("PROFILE_READY:")
        text_reply = parts[0].strip()
        import json
        try:
            json_str = parts[1].strip()
            if "}" in json_str:
                json_str = json_str[:json_str.rfind("}")+1]
            profile_json = json.loads(json_str)
        except Exception:
            profile_json = None
        return {
            "reply": text_reply or "Great! Your profile is ready. Setting up your personalised ET experience!",
            "profile": profile_json,
            "profile_complete": True,
        }

    return {
        "reply": reply,
        "profile": None,
        "profile_complete": False,
    }

def run_profiling_agent(messages: list) -> dict:
    def _call():
        response = client.chat.completions.create(
            model=get_model("profiling"),
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
            temperature=0.4,
            max_tokens=600,
        )
        return response.choices[0].message.content

    # Fallback response agar sab retry fail ho jayein
    def _fallback():
        return "I'm having trouble connecting. Could you please repeat that?"

    reply = with_retry(_call, retries=3, delay=0.5, fallback=_fallback)

    if "PROFILE_READY:" in reply:
        parts = reply.split("PROFILE_READY:")
        text_reply = parts[0].strip()
        import json
        try:
            json_str = parts[1].strip()
            if "}" in json_str:
                json_str = json_str[:json_str.rfind("}")+1]
            profile_json = json.loads(json_str)
        except Exception:
            profile_json = None
        return {
            "reply": text_reply or "Profile ready! Setting up your ET experience.",
            "profile": profile_json,
            "profile_complete": True,
        }

    return {
        "reply": reply,
        "profile": None,
        "profile_complete": False,
    }    