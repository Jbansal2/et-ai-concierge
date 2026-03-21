from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router as chat_router
from routes.profile import router as profile_router
from contextlib import asynccontextmanager
from agents.rag_agent import _ensure_index
import threading

@asynccontextmanager
async def lifespan(app):
    threading.Thread(target=_ensure_index, daemon=True).start()
    yield

app = FastAPI(title="ET Saathi API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(profile_router, prefix="/api/profile", tags=["profile"])

@app.get("/")
def root():
    return {"status": "ET Saathi backend running"}