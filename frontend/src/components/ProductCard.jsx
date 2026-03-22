export default function ProductCard({ rec }) {
  const iconConfig = {
    et_markets: { emoji: "📈", bg: "bg-blue-50", text: "text-blue-600" },
    et_prime: { emoji: "⭐", bg: "bg-amber-50", text: "text-amber-600" },
    et_wealth: { emoji: "💰", bg: "bg-green-50", text: "text-green-600" },
    et_startup: { emoji: "🚀", bg: "bg-purple-50", text: "text-purple-600" },
    et_masterclass: { emoji: "🎓", bg: "bg-indigo-50", text: "text-indigo-600" },
    et_services: { emoji: "🏦", bg: "bg-teal-50", text: "text-teal-600" },
  }

  const icon = iconConfig[rec.product_key] || { emoji: "📰", bg: "bg-gray-50", text: "text-gray-500" }

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl p-4 flex gap-3.5 items-start hover:border-red-200 hover:shadow-md hover:translate-x-1 transition-all duration-200 cursor-pointer"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* Icon */}
      <div className={`w-11 h-11 ${icon.bg} rounded-xl flex items-center justify-center text-xl shrink-0`}>
        {icon.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-semibold text-[14px] text-gray-900">{rec.product_name}</div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${icon.bg} ${icon.text}`}>
            FOR YOU
          </span>
        </div>
        <div className="text-xs text-gray-400 leading-relaxed mb-3">{rec.reason}</div>
        <a href={rec.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:opacity-70 transition-opacity no-underline">
          Explore →
        </a>
      </div>
    </div>
  )
}