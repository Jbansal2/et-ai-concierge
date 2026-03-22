import { useEffect, useState } from "react"

export default function HealthScore({ data }) {
  const [animated, setAnimated] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!animated || !data) return
    let start = 0
    const end = data.total_score
    const duration = 1200
    const step = (end / duration) * 16
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [animated, data])

  if (!data) return null

  const { total_score, grade, advice, breakdown } = data

  const gradeConfig = {
    A: { color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", label: "Excellent" },
    B: { color: "#3b82f6", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", label: "Good" },
    C: { color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", label: "Average" },
    D: { color: "#ef4444", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Needs Work" },
  }[grade] || { color: "#e53e3e", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Getting Started" }

  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated ? total_score / 100 : 0) * circumference

  const barColors = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-emerald-400 to-emerald-600",
    "from-amber-400 to-amber-600",
    "from-red-400 to-red-500",
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Score Ring */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 100 100"
            className="-rotate-90 w-full h-full">
            {/* Background track */}
            <circle cx="50" cy="50" r={radius}
              fill="none" stroke="#f3f4f6" strokeWidth="7" />
            {/* Score arc */}
            <circle cx="50" cy="50" r={radius}
              fill="none"
              stroke={gradeConfig.color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 leading-none">
              {count}
            </span>
            <span className="text-[11px] text-gray-400 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Grade badge */}
        <div className={`flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full border ${gradeConfig.bg} ${gradeConfig.border}`}>
          <span className={`text-lg font-bold ${gradeConfig.text}`}>{grade}</span>
          <span className={`text-xs font-semibold ${gradeConfig.text}`}>{gradeConfig.label}</span>
        </div>
      </div>

      {/* Advice */}
      <div className={`${gradeConfig.bg} rounded-xl px-4 py-3 mb-5`}>
        <p className={`text-xs ${gradeConfig.text} text-center leading-relaxed font-medium`}>
          {advice}
        </p>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-3">
        {Object.entries(breakdown).map(([key, val], i) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] text-gray-500 capitalize font-medium">
                {key.replace(/_/g, " ")}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-900">{val}</span>
                <span className="text-[10px] text-gray-300">/20</span>
              </div>
            </div>
            {/* Bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColors[i % barColors.length]}`}
                style={{
                  width: animated ? `${(val / 20) * 100}%` : "0%",
                  transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.12}s`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[10px] text-gray-300 font-medium">POWERED BY ET SAATHI AI</span>
        <span className={`text-[10px] font-bold ${gradeConfig.text}`}>
          {total_score >= 80 ? "Top 20%" : total_score >= 60 ? "Top 50%" : "Improving"}
        </span>
      </div>
    </div>
  )
}