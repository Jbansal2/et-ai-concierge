import { useEffect, useState } from "react"
import { getETScore } from "../api/etSaathiApi"

export default function ETScore({ sessionId }) {
  const [data, setData] = useState(null)
  const [animated, setAnimated] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    getETScore(sessionId)
      .then(data => {
        setData(data)
        setTimeout(() => setAnimated(true), 300)
      })
      .catch(() => {})
  }, [sessionId])

  useEffect(() => {
    if (!animated || !data) return
    let start = 0
    const end = Number(data?.et_score) || 0
    const step = (end / 1200) * 16
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [animated, data])

  if (!data) return null

  const { et_score, level, next_level, points_needed, badge, color, breakdown } = data
  const score = Number(et_score) || 0
  const ringColor = color || "var(--accent)"
  const safeBreakdown = breakdown && typeof breakdown === "object" ? breakdown : {}

  const levelConfig = {
    Platinum: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600", bar: "from-indigo-400 to-indigo-600" },
    Gold: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", bar: "from-amber-400 to-amber-500" },
    Silver: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-500", bar: "from-slate-300 to-slate-500" },
    Bronze: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", bar: "from-orange-400 to-orange-500" },
  }[level] || { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-500", bar: "from-gray-300 to-gray-500" }

  const circumference = 2 * Math.PI * 40
  const offset = circumference - (animated ? score / 100 : 0) * circumference

  const barColors = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-emerald-400 to-emerald-600",
    "from-amber-400 to-amber-500",
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Score ring + level */}
      <div className="flex items-center gap-4 mb-5">

        {/* Ring */}
        <div className="relative w-24 h-24 shrink-0">
          <svg width="96" height="96" viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="7" />
            <circle cx="50" cy="50" r="40" fill="none"
              stroke={ringColor} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 leading-none">{count}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">/100</span>
          </div>
        </div>

        {/* Level info */}
        <div className="flex-1">
          <div className="text-2xl mb-1">{badge}</div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${levelConfig.bg} ${levelConfig.border} ${levelConfig.text}`}>
            {level} Member
          </div>
          {points_needed > 0 && next_level && (
            <div className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              <span className="font-semibold text-gray-600">{points_needed} pts</span> to {next_level}
            </div>
          )}
        </div>
      </div>

      {/* Progress to next level */}
      {points_needed > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
            <span>Progress to {next_level}</span>
            <span>{score}/100</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${levelConfig.bar}`}
              style={{
                width: animated ? `${score}%` : "0%",
                transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)"
              }}
            />
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="flex flex-col gap-3">
        {Object.entries(safeBreakdown).map(([key, val], i) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] text-gray-500 capitalize font-medium">
                {key.replace(/_/g, " ")}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-gray-900">{val}</span>
                <span className="text-[10px] text-gray-300">/25</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColors[i % barColors.length]}`}
                style={{
                  width: animated ? `${(val / 25) * 100}%` : "0%",
                  transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.12}s`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[10px] text-gray-300 font-medium tracking-wide">ET LOYALTY SCORE</span>
        <span className={`text-[10px] font-bold ${levelConfig.text}`}>
          {level === "Platinum" ? "Elite Member" : level === "Gold" ? "Top 30%" : level === "Silver" ? "Top 60%" : "Getting Started"}
        </span>
      </div>
    </div>
  )
}