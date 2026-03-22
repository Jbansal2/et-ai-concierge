import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "axios"
import AskFinance from "../components/AskFinance"
import HealthScore from "../components/HealthScore"
import MarketTicker from "../components/MarketTicker"
import ETScore from "../components/ETScore"
import PortfolioGaps from "../components/PortfolioGaps"
import AdBanner from "../components/AdBanner"


export default function Dashboard() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const [crossSell, setCrossSell] = useState([])
    const [news, setNews] = useState([])
    const [insight, setInsight] = useState("")
    const [missingCount, setMissingCount] = useState(0)
    const [showProfile, setShowProfile] = useState(false)
    const [insightLoading, setInsightLoading] = useState(true)

    const { profile, recommendations, sessionId, healthScore } = state || {}

    useEffect(() => {
        if (!profile) { navigate("/"); return }

        axios.get(`http://127.0.0.1:8000/api/chat/cross-sell/${sessionId}`)
            .then(res => setCrossSell(Array.isArray(res?.data?.suggestions) ? res.data.suggestions : []))
            .catch(() => { })

        axios.get(`http://127.0.0.1:8000/api/chat/news/${sessionId}`)
            .then(res => setNews(Array.isArray(res?.data?.news) ? res.data.news : []))
            .catch(() => { })

        axios.get(`http://127.0.0.1:8000/api/chat/ai-insight/${sessionId}`)
            .then(res => { setInsight(res.data.insight); setMissingCount(res.data.missing_count); setInsightLoading(false) })
            .catch(() => { setInsight("You're missing key investment opportunities tailored to your goals."); setMissingCount(3); setInsightLoading(false) })
    }, [])

    if (!profile) return null

    const gradeColor = { A: "text-emerald-500 border-emerald-500", B: "text-blue-500 border-blue-500", C: "text-amber-500 border-amber-500", D: "text-red-500 border-red-500" }[healthScore?.grade] || "text-red-500 border-red-500"

    const newsItems = news.length > 0 ? news : profile.interests?.map(i => ({
        title: `Latest ${i} news on ET`, link: `https://economictimes.indiatimes.com/topic/${i.replace(" ", "-")}`, category: i
    }))

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* Profile Modal */}
            {showProfile && (
                <div onClick={() => setShowProfile(false)} className="fixed inset-0 bg-black/10 z-50 flex justify-end pt-16 pr-6">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl border border-gray-100 p-5 w-64 h-fit shadow-2xl animate-fadeUp">

                        {/* Avatar row */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-base">
                                {profile.user_type?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <div className="font-semibold text-sm text-gray-900 capitalize">{profile.user_type}</div>
                                <div className="text-xs text-gray-400 capitalize">{profile.experience} investor</div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-2 mb-4">
                            {[
                                { label: "Language", value: profile.language, emoji: "" },
                                { label: "Goals", value: profile.goals?.join(", "), emoji: "" },
                                { label: "Interests", value: profile.interests?.join(", "), emoji: "" },
                            ].map((item, i) => (
                                <div key={i} className="px-3 py-2 bg-gray-50 rounded-lg">
                                    <div className="text-[10px] text-gray-400 mb-0.5">{item.emoji} {item.label}</div>
                                    <div className="text-xs font-medium text-gray-900 capitalize">{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Health score */}
                        {healthScore && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 mb-4">
                                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold ${gradeColor}`}>
                                    {healthScore.grade}
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-400">Financial Health</div>
                                    <div className="text-base font-bold text-gray-900">{healthScore.total_score}/100</div>
                                </div>
                            </div>
                        )}

                        <button onClick={() => { setShowProfile(false); navigate("/") }}
                            className="w-full py-2 border border-gray-200 rounded-xl text-xs text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors cursor-pointer bg-white">
                            Start Over →
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">✦</div>
                    <div>
                        <div className="font-semibold text-sm text-gray-900">ETSaathi</div>
                        <div className="text-xs text-gray-400">
                            Welcome back, <strong className="text-gray-900 capitalize">{profile.user_type}</strong> 👋
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {healthScore && (
                        <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1.5">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold ${gradeColor}`}>
                                {healthScore.grade}
                            </div>
                            <span className="text-xs text-gray-500">ET Score: <strong className="text-gray-900">{healthScore.total_score}</strong></span>
                        </div>
                    )}
                    <div onClick={() => setShowProfile(!showProfile)}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform"
                        style={{ outline: showProfile ? "2px solid #e53e3e" : "none", outlineOffset: "2px" }}>
                        {profile.user_type?.[0]?.toUpperCase() || "U"}
                    </div>
                </div>
            </div>

            {/* Market Ticker */}
            <MarketTicker />
            <div className="max-w-8xl mx-auto px-6 py-7">
                <div className="max-w-8xl w-full mx-auto bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-2xl px-8 py-10 mb-6 shadow-sm">

                    <div className="text-[11px] font-semibold text-red-500 tracking-widest mb-2">
                        AI INSIGHT
                    </div>

                    {insightLoading ? (
                        <div className="space-y-3">
                            <div className="h-4 bg-red-100 rounded animate-pulse w-4/5" />
                            <div className="h-4 bg-red-100 rounded animate-pulse w-2/3" />
                        </div>
                    ) : (
                        <div className="text-[17px] text-gray-900 leading-relaxed">
                            {insight}{" "}
                            <strong className="text-red-500">
                                {missingCount} key opportunities
                            </strong>{" "}
                            await you.
                        </div>
                    )}

                </div>
                <AdBanner sessionId={sessionId} />


                {/* Profile Tags */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {[...(profile.goals || []), ...(profile.interests || []), profile.experience]
                        .filter(Boolean).map((tag, i) => (
                            <span key={i} className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500">
                                {tag}
                            </span>
                        ))}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

                    {/* Left Column */}
                    <div className="flex flex-col gap-6">

                        {/* Recommended */}                        <div>
                            <div className="text-[11px] font-semibold text-red-500 tracking-widest mb-3">RECOMMENDED FOR YOU</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {recommendations?.map((rec, i) => {
                                    const icons = {
                                        et_markets: { emoji: "✦", bg: "bg-red-500", text: "text-blue-600" },
                                        et_prime: { emoji: "✦", bg: "bg-red-500", text: "text-amber-600" },
                                        et_wealth: { emoji: "✦", bg: "bg-red-500", text: "text-green-600" },
                                        et_startup: { emoji: "✦", bg: "bg-red-500", text: "text-purple-600" },
                                        et_masterclass: { emoji: "✦", bg: "bg-red-500", text: "text-indigo-600" },
                                        et_services: { emoji: "✦", bg: "bg-red-500", text: "text-teal-600" },
                                    }
                                    const icon = icons[rec.product_key] || { emoji: "✦", bg: "bg-gray-50", text: "text-gray-600" }

                                    return (
                                        <div key={i} className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col">

                                            {/* Top row */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`w-10 h-10 ${icon.bg} rounded-xl flex items-center justify-center text-xl`}>
                                                    {icon.emoji}
                                                </div>
                                                <span className="text-[10px] font-semibold text-red-500 tracking-widest bg-red-50 px-2 py-1 rounded-full">
                                                    EXCLUSIVE
                                                </span>
                                            </div>
                                            <div className="text-[15px] font-semibold text-gray-900 mb-2">
                                                {rec.product_name}
                                            </div>
                                            <div className="text-xs text-gray-400 leading-relaxed flex-1 mb-4">
                                                {rec.reason}
                                            </div>
                                            <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
                                                <a href={rec.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-red-500 text-sm font-semibold hover:opacity-70 transition-opacity no-underline">
                                                    Explore →
                                                </a>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Portfolio Gaps */}
                        <div>
                            <div className="text-[11px] font-semibold text-red-500 tracking-widest mb-3">PORTFOLIO GAP ANALYSIS</div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                <PortfolioGaps sessionId={sessionId} />
                            </div>
                        </div>

                        {/* News */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[11px] font-semibold text-red-500 tracking-widest">LATEST ET NEWS FOR YOU</div>
                                <a href="https://economictimes.indiatimes.com" target="_blank" rel="noopener noreferrer"
                                    className="text-[11px] text-gray-400 hover:text-red-500 transition-colors no-underline">
                                    View all →
                                </a>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                                {newsItems?.map((item, i, arr) => {
                                    const categoryColors = {
                                        stocks: "bg-blue-50 text-blue-600",
                                        "mutual funds": "bg-green-50 text-green-600",
                                        startups: "bg-purple-50 text-purple-600",
                                        economy: "bg-amber-50 text-amber-600",
                                        "real estate": "bg-teal-50 text-teal-600",
                                        crypto: "bg-orange-50 text-orange-600",
                                    }
                                    const colorClass = categoryColors[item.category?.toLowerCase()] || "bg-red-50 text-red-500"

                                    return (
                                        <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                                            className="group flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors no-underline"
                                            style={{ borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}>

                                            {/* Number */}
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-gray-50 group-hover:bg-red-50 flex items-center justify-center text-[11px] font-bold text-gray-300 group-hover:text-red-400 transition-colors mt-0.5">
                                                {i + 1}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                                                    {item.title}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${colorClass}`}>
                                                        {item.category}
                                                    </span>
                                                    {item.date && (
                                                        <span className="text-[10px] text-gray-300">{item.date}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="shrink-0 text-gray-200 group-hover:text-red-400 transition-colors text-sm mt-0.5">
                                                →
                                            </div>
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-4">

                        {/* Health Score */}
                        <div>
                            <div className="text-[11px] font-semibold text-red-500 tracking-widest mb-3">FINANCIAL HEALTH SCORE</div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                <HealthScore data={healthScore} />
                            </div>
                        </div>

                        <div style={{ animation: "fadeUp 0.4s ease 0.32s both" }}>
                            <div className="text-[11px] font-semibold text-red-500 tracking-widest mb-3">ET SCORE</div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                <ETScore sessionId={sessionId} />
                            </div>
                        </div>

                        {/* You May Also Like */}
                        {Array.isArray(crossSell) && crossSell.length > 0 && (
                            <div>
                                <div className="text-[11px] font-semibold text-red-500 tracking-widest mb-3">YOU MAY ALSO LIKE</div>
                                <div className="flex flex-col gap-2.5">
                                    {crossSell.map((item, i) => {
                                        const icons = {
                                            "ET Money": { emoji: "✦", bg: "bg-red-500", text: "text-green-600" },
                                            "ET Prime": { emoji: "✦", bg: "bg-red-500", text: "text-amber-600" },
                                            "ET Markets Pro": { emoji: "✦", bg: "bg-red-500", text: "text-blue-600" },
                                            "ET Masterclass": { emoji: "✦", bg: "bg-red-500", text: "text-purple-600" },
                                        }
                                        const icon = icons[item.name] || { emoji: "✦", bg: "bg-red-50", text: "text-red-500" }

                                        return (
                                            <div key={i} className="group bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

                                                {/* Top row */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-9 h-9 ${icon.bg} rounded-xl flex items-center justify-center text-lg shrink-0`}>
                                                        {icon.emoji}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-[13px] text-gray-900 leading-tight">{item.name}</div>
                                                        <div className={`text-[10px] font-semibold ${icon.text} mt-0.5`}>RECOMMENDED</div>
                                                    </div>
                                                </div>

                                                {/* Reason */}
                                                <div className="text-xs text-gray-400 leading-relaxed mb-3 pl-12">
                                                    {item.reason}
                                                </div>

                                                {/* CTA */}
                                                <div className="pl-12">
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${icon.text}  px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity no-underline`}>
                                                        {item.cta || "Try Now"} →
                                                    </a>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <AskFinance sessionId={sessionId} />
        </div>
    )
}