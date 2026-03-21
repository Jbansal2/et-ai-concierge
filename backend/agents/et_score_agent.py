from __future__ import annotations

from typing import Any


def _clamp_int(value: Any, minimum: int, maximum: int, default: int) -> int:
    try:
        value_int = int(value)
    except Exception:
        return default
    return max(minimum, min(maximum, value_int))

def calculate_et_score(profile: dict, recommendations: list, health_score: int) -> dict:
    score = 0
    breakdown: dict[str, int] = {}

    profile = profile or {}
    recommendations = recommendations or []

    fields = ["user_type", "goals", "experience", "interests", "language"]
    filled = sum(1 for field in fields if profile.get(field))
    profile_score = int((filled / len(fields)) * 25)
    breakdown["profile_completeness"] = profile_score
    score += profile_score

    health_score = _clamp_int(health_score, 0, 100, 0)
    fin_score = int((health_score / 100) * 25)
    breakdown["financial_health"] = fin_score
    score += fin_score

    interests = profile.get("interests", [])
    if isinstance(interests, str):
        interests = [i.strip() for i in interests.split(",") if i.strip()]
    if not isinstance(interests, list):
        interests = []
    div_score = min(len(interests) * 7, 25)
    breakdown["content_diversity"] = div_score
    score += div_score

    recs = len(recommendations) if isinstance(recommendations, list) else 0
    eng_score = min(recs * 8, 25)
    breakdown["et_engagement"] = eng_score
    score += eng_score

    score = _clamp_int(score, 0, 100, 0)

    if score >= 85:
        level, badge, color = "ET Champion", "🏆", "#f59e0b"
    elif score >= 70:
        level, badge, color = "ET Pro", "⭐", "#3b82f6"
    elif score >= 50:
        level, badge, color = "ET Explorer", "🚀", "#6366f1"
    else:
        level, badge, color = "ET Starter", "🌱", "#10b981"

    next_level_score = 85 if score >= 70 else (70 if score >= 50 else 50)
    points_needed = max(0, next_level_score - score)

    return {
        "et_score": score,
        "level": level,
        "badge": badge,
        "color": color,
        "breakdown": breakdown,
        "points_needed": points_needed,
        "next_level": "ET Champion" if level != "ET Champion" else "Max Level"
    }
