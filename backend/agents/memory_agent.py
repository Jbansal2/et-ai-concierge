from __future__ import annotations

import json
import os
from typing import Any


MEMORY_FILE = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "user_memory.json")
)


def save_profile(session_id: str, profile: dict, recommendations: list) -> None:
    memory = load_all_memory()
    memory[session_id] = {"profile": profile, "recommendations": recommendations}

    os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
    tmp_path = f"{MEMORY_FILE}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(memory, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, MEMORY_FILE)


def load_profile(session_id: str) -> dict[str, Any] | None:
    memory = load_all_memory()
    value = memory.get(session_id)
    return value if isinstance(value, dict) else None


def load_all_memory() -> dict[str, Any]:
    if not os.path.exists(MEMORY_FILE):
        return {}
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            value = json.load(f)
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError:
        return {}
