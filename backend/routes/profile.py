from fastapi import APIRouter
from routes.chat import sessions

router = APIRouter()

@router.get("/{session_id}")
def get_profile(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}
    session = sessions[session_id]
    return {
        "session_id": session_id,
        "profile": session.get("profile"),
        "recommendations": session.get("recommendations"),
        "stage": session.get("stage"),
    }