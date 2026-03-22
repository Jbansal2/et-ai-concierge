import { useEffect, useState } from "react"
import { getAds } from "../api/etSaathiApi"

const CATEGORY_LABELS = {
  amber: { dot: "bg-amber-400", label: "text-amber-600" },
  blue: { dot: "bg-blue-400", label: "text-blue-600" },
  green: { dot: "bg-emerald-400", label: "text-emerald-600" },
  purple: { dot: "bg-purple-400", label: "text-purple-600" },
  indigo: { dot: "bg-indigo-400", label: "text-indigo-600" },
  pink: { dot: "bg-pink-400", label: "text-pink-600" },
  teal: { dot: "bg-teal-400", label: "text-teal-600" },
}

const MOCK_IMAGES = {
  et_prime_001: "https://img.etimg.com/thumb/msid-112456789,width-300,height-200,imgsize-12345/et-prime.jpg",
  et_markets_001: "https://img.etimg.com/thumb/msid-112456790,width-300,height-200/markets.jpg",
}

export default function AdBanner({ sessionId }) {
  const [ads, setAds] = useState([])
  const [dismissed, setDismissed] = useState([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    getAds(sessionId)
      .then(data => {
        setAds(data.ads || [])
        setTimeout(() => setVisible(true), 600)
      })
      .catch(() => {})
  }, [sessionId])

  const activeAds = ads.filter(a => !dismissed.includes(a.id))
  if (activeAds.length === 0) return null

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(6px)",
      transition: "all 0.4s ease",
      fontFamily: "'DM Sans',sans-serif"
    }}>
      {activeAds.map((ad) => {
        const cfg = CATEGORY_LABELS[ad.bg] || CATEGORY_LABELS.blue

        return (
          <div key={ad.id} className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 mb-2.5">

            {/* Sponsored label — very subtle */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              <span className="text-[9px] text-gray-300 font-medium tracking-wide">Sponsored</span>
              <button
                onClick={() => setDismissed(p => [...p, ad.id])}
                className="w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-[9px] border-0 cursor-pointer transition-colors leading-none">
                ✕
              </button>
            </div>

            <a href={ad.url} target="_blank" rel="noopener noreferrer"
              className="flex gap-0 no-underline">

              {/* Left color strip */}
              <div className={`w-1 shrink-0 ${cfg.dot.replace("bg-", "bg-")}`} />

              {/* Content */}
              <div className="flex-1 p-4 pr-12">

                {/* Source tag */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className={`text-[10px] font-semibold tracking-wide uppercase ${cfg.label}`}>
                    {ad.title.split("—")[0].trim()}
                  </span>
                </div>

                {/* Headline — looks like a news article */}
                <div className="text-[14px] font-semibold text-gray-900 leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                  {ad.tagline}
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-300">ET Partner Content</span>
                    <span className="text-gray-200 text-[10px]">•</span>
                    <span className="text-[10px] text-gray-300">
                      {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-red-500 group-hover:opacity-70 transition-opacity">
                    {ad.cta} →
                  </span>
                </div>
              </div>

              {/* Right emoji block */}
              <div className={`w-16 shrink-0 flex items-center justify-center text-3xl bg-gray-50 border-l border-gray-50`}>
                {ad.image_emoji}
              </div>
            </a>
          </div>
        )
      })}
    </div>
  )
}