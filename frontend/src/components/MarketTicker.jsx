import { useEffect, useState } from "react"
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from "recharts"
import { getMarketTicker } from "../api/etSaathiApi"

function Sparkline({ points, up, height = 40 }) {
  if (!points || points.length < 2) return <div style={{ width: 80, height }} />
  return (
    <ResponsiveContainer width={80} height={height}>
      <LineChart data={points}>
        <YAxis domain={["auto", "auto"]} hide />
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", fontSize: "11px", padding: "4px 8px" }}
          formatter={v => [v.toLocaleString("en-IN"), ""]}
          labelFormatter={() => ""}
        />
        <Line type="monotone" dataKey="v" dot={false}
          stroke={up ? "#16a34a" : "#dc2626"} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function MarketTicker() {
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState("indices")
  const [history, setHistory] = useState({})

  const fetchData = () => {
    getMarketTicker()
      .then(d => {
        setData(d)
        setHistory(prev => {
          const updated = { ...prev }
          const allItems = [
            { key: "SENSEX", price: d.sensex?.price },
            { key: "NIFTY", price: d.nifty?.price },
            ...(d.stocks || []).map(s => ({ key: s.symbol, price: s.price }))
          ]
          allItems.forEach(({ key, price }) => {
            const val = parseFloat(price?.replace(/,/g, "") || 0)
            if (!updated[key]) updated[key] = []
            updated[key] = [...updated[key].slice(-19), { v: val }]
          })
          return updated
        })
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return (
    <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-center text-sm text-gray-300"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>
      Loading market data...
    </div>
  )

  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  const dateStr = now.toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })

  return (
    <div className="bg-white border-b border-gray-100" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .ticker-scroll { animation: tickerScroll 40s linear infinite; }
        .ticker-scroll:hover { animation-play-state: paused; }
      `}</style>

      {/* Main bar */}
      <div className="flex items-stretch overflow-x-auto border-b border-gray-50">

        {/* LIVE + Time */}
        <div className="flex flex-col justify-center px-3.5 py-2.5 border-r border-gray-100 shrink-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"
              style={{ animation: "livePulse 1.5s infinite" }} />
            <span className="text-[10px] font-bold text-red-500 tracking-wider">LIVE</span>
          </div>
          <span className="text-[10px] text-gray-300 whitespace-nowrap">{timeStr}</span>
          <span className="text-[10px] text-gray-300 whitespace-nowrap">{dateStr}</span>
        </div>

        {/* SENSEX */}
        <div className="flex items-center gap-3 px-4 py-2 border-r border-gray-100 shrink-0">
          <div>
            <div className="text-[10px] font-semibold text-gray-400 mb-0.5">SENSEX</div>
            <div className="text-xl font-bold text-gray-900 leading-none">{data.sensex?.price}</div>
            <div className={`text-[11px] font-medium mt-1 ${data.sensex?.up ? "text-green-600" : "text-red-500"}`}>
              {data.sensex?.up ? "↑" : "↓"} {data.sensex?.change} ({data.sensex?.pct})
            </div>
          </div>
          <Sparkline points={history.SENSEX || []} up={data.sensex?.up} height={48} />
        </div>

        {/* NIFTY */}
        <div className="flex items-center gap-3 px-4 py-2 border-r border-gray-100 shrink-0">
          <div>
            <div className="text-[10px] font-semibold text-gray-400 mb-0.5">NIFTY</div>
            <div className="text-xl font-bold text-gray-900 leading-none">{data.nifty?.price}</div>
            <div className={`text-[11px] font-medium mt-1 ${data.nifty?.up ? "text-green-600" : "text-red-500"}`}>
              {data.nifty?.up ? "↑" : "↓"} {data.nifty?.change} ({data.nifty?.pct})
            </div>
          </div>
          <Sparkline points={history.NIFTY || []} up={data.nifty?.up} height={48} />
        </div>

        {/* Indices / Crypto tabs */}
        <div className="px-3.5 py-2 border-r border-gray-100 shrink-0 min-w-[260px]">
          <div className="flex gap-1 mb-2">
            {["indices", "crypto"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-0.5 text-[11px] font-bold tracking-wider border-0 bg-transparent cursor-pointer transition-all border-b-2 ${activeTab === tab ? "text-red-500 border-red-500" : "text-gray-300 border-transparent"}`}
                style={{ fontFamily: "'DM Sans',sans-serif" }}>
                {tab === "indices" ? "INDICES" : "CRYPTO"}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {(activeTab === "indices" ? data.indices : data.crypto)?.slice(0, 3).map((item, i) => (
              <div key={i} className="flex justify-between items-center px-1 py-0.5 rounded hover:bg-gray-50 transition-colors">
                <span className="text-xs text-gray-500">{item.name}</span>
                <div className="flex gap-2">
                  <span className="text-xs font-semibold text-gray-900">{item.price}</span>
                  <span className={`text-[11px] ${item.up ? "text-green-600" : "text-red-500"}`}>{item.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Gainers */}
        <div className="px-3.5 py-2 border-r border-gray-100 shrink-0 min-w-[200px]">
          <div className="text-[10px] font-bold text-red-500 tracking-wider mb-2">TOP GAINERS</div>
          {data.gainers?.slice(0, 3).map((item, i) => (
            <div key={i} className="flex justify-between items-center px-1 py-0.5 rounded hover:bg-gray-50 transition-colors">
              <span className="text-xs text-gray-500">{item.name}</span>
              <div className="flex gap-1.5">
                <span className="text-xs font-semibold text-gray-900">{item.price}</span>
                <span className="text-[11px] text-green-600">+{item.pct}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Gold + USD */}
        <div className="flex items-center gap-5 px-4 shrink-0">
          {[{ label: "GOLD", key: "gold" }, { label: "USD/INR", key: "usd" }].map(({ label, key }) => (
            <div key={key}>
              <div className="text-[10px] font-bold text-gray-900 mb-0.5">{label}</div>
              <div className="text-sm font-bold text-gray-900">{data[key]?.price}</div>
              <div className={`text-[11px] ${data[key]?.up ? "text-green-600" : "text-red-500"}`}>
                {data[key]?.up ? "↑" : "↓"} {data[key]?.change} ({data[key]?.pct})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="overflow-hidden py-1 relative bg-white">
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="ticker-scroll flex w-max">
          {[...(data.stocks || []), ...(data.stocks || [])].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 px-5 border-r border-gray-50 whitespace-nowrap">
              <span className="text-xs font-semibold text-gray-700">{s.symbol}</span>
              <span className="text-xs text-gray-500">{s.price}</span>
              <span className={`text-[11px] font-medium ${s.up ? "text-green-600" : "text-red-500"}`}>
                {s.up ? "▲" : "▼"} {s.change}
              </span>
              <Sparkline points={history[s.symbol] || []} up={s.up} height={24} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}