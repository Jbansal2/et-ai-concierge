const CATEGORY_COLORS = {
  stocks: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  "mutual funds": { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  startups: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500" },
  economy: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  "real estate": { bg: "bg-teal-50", text: "text-teal-600", dot: "bg-teal-500" },
  crypto: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
}

const DEFAULT_COLOR = { bg: "bg-red-50", text: "text-red-500", dot: "bg-red-500" }

function formatDate(dateStr) {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  } catch { return "" }
}

export default function NewsFeed({ news, interests }) {

  // Empty state
  if (!news || news.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
        style={{ fontFamily: "'DM Sans',sans-serif" }}>
        {interests?.map((interest, i) => (
          <a key={i}
            href={`https://economictimes.indiatimes.com/topic/${interest.replace(" ", "-")}`}
            target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors no-underline"
            style={{ borderBottom: i < interests.length - 1 ? "1px solid #f5f5f5" : "none" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span className="text-sm text-gray-700 flex-1">
              Latest <strong className="text-gray-900">{interest}</strong> news on ET
            </span>
            <span className="text-gray-300 group-hover:text-red-400 transition-colors text-sm">→</span>
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {news.map((item, i, arr) => {
        const color = CATEGORY_COLORS[item.category?.toLowerCase()] || DEFAULT_COLOR
        const date = formatDate(item.date)

        return (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
            className="group flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors no-underline"
            style={{ borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}>

            {/* Left — image or number */}
            {item.image ? (
              <div className="shrink-0 w-20 h-16 rounded-xl overflow-hidden bg-gray-100 relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => {
                    e.target.parentElement.innerHTML =
                      `<div class="w-full h-full flex items-center justify-center bg-gray-50 text-2xl">📰</div>`
                  }}
                />
                {/* Category overlay */}
                <div className={`absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md capitalize ${color.bg} ${color.text}`}>
                  {item.category}
                </div>
              </div>
            ) : (
              <div className="shrink-0 flex flex-col items-center pt-1 gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-50 group-hover:bg-red-50 flex items-center justify-center text-[11px] font-bold text-gray-300 group-hover:text-red-400 transition-colors">
                  {i + 1}
                </div>
                <div className={`w-1 flex-1 rounded-full ${color.dot} opacity-20`} />
              </div>
            )}

            {/* Right — content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900 leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                  {item.title}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!item.image && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${color.bg} ${color.text}`}>
                      {item.category}
                    </span>
                  )}
                  {date && (
                    <span className="text-[10px] text-gray-300">{date}</span>
                  )}
                </div>
                <span className="text-gray-200 group-hover:text-red-400 transition-colors text-xs shrink-0">→</span>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}