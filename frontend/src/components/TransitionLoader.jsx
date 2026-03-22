import { useEffect, useState } from "react"

const STEPS = [
  "Analyzing your financial profile...",
  "Finding the best ET products for you...",
  "Calculating your financial health score...",
  "Personalizing your dashboard...",
  "Almost ready..."
]

export default function TransitionLoader({ onDone }) {
  const [step, setStep] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        current++
        if (current >= STEPS.length) {
          clearInterval(interval)
          setTimeout(onDone, 600)
          return
        }
        setStep(current)
        setFade(true)
      }, 300)
    }, 900)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes logoPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes fadeRing { 0%{opacity:0.3} 100%{opacity:1} }
      `}</style>

      {/* Logo */}
      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-8 shadow-lg shadow-red-100"
        style={{ animation: "logoPulse 1.5s ease infinite" }}>
        ✦
      </div>

      {/* Spinner rings */}
      <div className="relative w-12 h-12 mb-8">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-red-500"
          style={{ animation: "spin 0.8s linear infinite" }} />
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-50" />
        </div>
      </div>

      {/* Step text */}
      <div
        className="text-[15px] font-medium text-gray-900 text-center max-w-[260px] leading-relaxed mb-1"
        style={{
          opacity: fade ? 1 : 0,
          transform: fade ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.3s ease"
        }}>
        {STEPS[step]}
      </div>

      <div className="text-xs text-gray-300 mb-7">
        Step {step + 1} of {STEPS.length}
      </div>

      {/* Progress pills */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < step
                ? "w-4 bg-red-300"
                : i === step
                ? "w-6 bg-red-500"
                : "w-1.5 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-10 flex items-center gap-2">
        <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded-md flex items-center justify-center text-white text-[9px] font-bold">
          ✦
        </div>
        <span className="text-[11px] text-gray-300 font-medium tracking-wide">ET SAATHI AI</span>
      </div>
    </div>
  )
}