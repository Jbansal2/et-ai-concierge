import { useEffect, useState } from "react"
import { getPortfolioGaps } from "../api/etSaathiApi"

export default function PortfolioGaps({ sessionId }) {
  const [data, setData] = useState(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    getPortfolioGaps(sessionId)
      .then(data => {
        setData(data)
        setTimeout(() => setAnimated(true), 300)
      })
      .catch(() => {})
  }, [sessionId])

  if (!data) return null

  const scoreColor = data.overall_gap_score >= 70
    ? "text-emerald-500" : data.overall_gap_score >= 50
    ? "text-amber-500" : "text-red-500"

  const scoreBarColor = data.overall_gap_score >= 70
    ? "from-emerald-400 to-emerald-500"
    : data.overall_gap_score >= 50
    ? "from-amber-400 to-amber-500"
    : "from-red-400 to-red-500"

  const severityConfig = {
    high: {
      border: "border-l-red-400",
      bg: "bg-red-50",
      pill: "bg-red-50 text-red-500",
      link: "text-red-500",
      dot: "bg-red-400"
    },
    medium: {
      border: "border-l-amber-400",
      bg: "bg-amber-50",
      pill: "bg-amber-50 text-amber-500",
      link: "text-amber-500",
      dot: "bg-amber-400"
    },
    low: {
      border: "border-l-emerald-400",
      bg: "bg-emerald-50",
      pill: "bg-emerald-50 text-emerald-500",
      link: "text-emerald-500",
      dot: "bg-emerald-400"
    },
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* Score header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-gray-400 leading-relaxed">
            Based on your profile and goals
          </div>
        </div>
        <div className={`text-2xl font-bold leading-none ${scoreColor}`}>
          {data.overall_gap_score}%
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor} transition-all duration-1000`}
          style={{ width: animated ? `${data.overall_gap_score}%` : "0%" }}
        />
      </div>

      {/* Gaps */}
      {data.gaps?.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-red-500 tracking-widest mb-2.5">
            AREAS TO IMPROVE
          </div>
          <div className="flex flex-col gap-2">
            {data.gaps.map((gap, i) => {
              const sc = severityConfig[gap.severity] || severityConfig.high
              return (
                <div key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border-l-[3px] ${sc.bg} ${sc.border}`}>
                  <span className="text-base shrink-0 mt-0.5">{gap.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-gray-900">{gap.category}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 capitalize ${sc.pill}`}>
                        {gap.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed mb-1.5">
                      {gap.message}
                    </p>

                    <a
                      href={gap.et_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold no-underline hover:opacity-70 transition-opacity ${sc.link}`}
                    >
                      Fix with {gap.et_product} →
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Strong areas */}
      {data.strong_areas?.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-emerald-500 tracking-widest mb-2.5">
            STRONG AREAS
          </div>
          <div className="flex flex-col gap-1.5">
            {data.strong_areas.map((area, i) => (
              <div key={i}
                className="flex items-center gap-3 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-semibold text-emerald-600">{area.category}</span>
                  <span className="text-[11px] text-gray-400 ml-1.5">{area.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[10px] text-gray-300 tracking-wide font-medium">ET PORTFOLIO ANALYSIS</span>
        <span className={`text-[10px] font-bold ${scoreColor}`}>
          {data.overall_gap_score >= 70
            ? "Well diversified"
            : data.overall_gap_score >= 50
            ? "Needs attention"
            : "Action required"}
        </span>
      </div>
    </div>
  )
}