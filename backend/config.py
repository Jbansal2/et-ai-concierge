import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/etsaathi")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
PORT = int(os.getenv("PORT", 8000))

# Smart model routing — large for complex, small for simple
GROQ_MODEL_LARGE = "llama-3.3-70b-versatile"   # profiling, finance, gap analysis
GROQ_MODEL_SMALL = "llama-3.1-8b-instant"       # routing, cross-sell, health score

def get_model(task: str) -> str:
    simple_tasks = ["routing", "cross_sell", "health_score", "ad_campaign", "et_score"]
    return GROQ_MODEL_SMALL if task in simple_tasks else GROQ_MODEL_LARGE

GROQ_MODEL = GROQ_MODEL_LARGE 