from agents.profiling_agent import run_profiling_agent
from agents.routing_agent import run_routing_agent

def orchestrate(session: dict) -> dict:
    """
    Main orchestrator — decides which agent to call based on session state.

    Session structure:
    {
        "session_id": "abc123",
        "messages": [...],         
        "profile": None or {...}, 
        "recommendations": None,  
        "stage": "profiling" | "recommending" | "done"
    }
    """

    stage = session.get("stage", "profiling")
    messages = session.get("messages", [])

    if stage == "profiling":
        result = run_profiling_agent(messages)

        response = {
            "reply": result["reply"],
            "stage": "profiling",
            "profile": None,
            "recommendations": None,
        }

        if result["profile_complete"] and result["profile"]:
            recommendations = run_routing_agent(result["profile"])
            response["stage"] = "done"
            response["profile"] = result["profile"]
            response["recommendations"] = recommendations
            response["reply"] = result["reply"]

        return response

    return {
        "reply": "Namaste! Main ET Saathi hoon. Aapki kaise madad kar sakta hoon?",
        "stage": "profiling",
        "profile": None,
        "recommendations": None,
    }