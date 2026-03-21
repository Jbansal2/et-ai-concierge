def calculate_health_score(profile: dict) -> dict:
    score = 0
    breakdown = {}

    exp = profile.get("experience", "beginner")
    exp_score = {"beginner": 8, "intermediate": 15, "expert": 20}.get(exp, 8)
    breakdown["investment_knowledge"] = exp_score
    score += exp_score

    goals = profile.get("goals", [])
    goal_score = min(len(goals) * 8, 20)
    breakdown["goal_clarity"] = goal_score
    score += goal_score

    interests = profile.get("interests", [])
    div_score = min(len(interests) * 6, 20)
    breakdown["diversification"] = div_score
    score += div_score

    long_term = any(g in ["retirement", "wealth building", "child education"]
                   for g in goals)
    lt_score = 20 if long_term else 8
    breakdown["long_term_planning"] = lt_score
    score += lt_score

    eng_score = 15  # baseline for completing profiling
    breakdown["engagement"] = eng_score
    score += eng_score

    # Grade
    if score >= 80:
        grade, advice = "A", "Excellent! You have a strong financial foundation."
    elif score >= 60:
        grade, advice = "B", "Good start! A few improvements can boost your wealth."
    elif score >= 40:
        grade, advice = "C", "You're on the right track. Let's build better habits."
    else:
        grade, advice = "D", "Don't worry — ET Saathi will guide you step by step."

    return {
        "total_score": score,
        "grade": grade,
        "advice": advice,
        "breakdown": breakdown,
        "max_score": 100
    }