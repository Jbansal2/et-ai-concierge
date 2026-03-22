import { useState, useEffect, useRef } from "react"
import axios from "axios"

const QUICK_REPLIES = {
  user_type: ["Investor", "Student", "Entrepreneur", "Professional"],
  experience: ["Beginner", "Intermediate", "Expert"],
  horizon: ["Short-term (< 1 year)", "Medium (1-5 years)", "Long-term (5+ years)"],
  language: ["English", "Hindi"],
  goals: ["Wealth Building", "Retirement", "Child Education", "Home Buying"],
}

function detectQuickReplies(text) {
  const t = text.toLowerCase()
  if (t.includes("what do you do") || (t.includes("investor") && t.includes("student"))) return QUICK_REPLIES.user_type
  if (t.includes("experience") || t.includes("beginner") || t.includes("intermediate")) return QUICK_REPLIES.experience
  if (t.includes("horizon") || t.includes("short-term") || t.includes("long-term")) return QUICK_REPLIES.horizon
  if (t.includes("language") || t.includes("english") || t.includes("hindi")) return QUICK_REPLIES.language
  if (t.includes("goal") || t.includes("retirement") || t.includes("wealth")) return QUICK_REPLIES.goals
  return []
}

function TypewriterText({ text, onDone, speed = 18 }) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)
  const i = useRef(0)

  useEffect(() => {
    i.current = 0
    setDisplayed("")
    setDone(false)
    const interval = setInterval(() => {
      if (i.current < text.length) {
        setDisplayed(text.slice(0, i.current + 1))
        i.current++
      } else {
        clearInterval(interval)
        setDone(true)
        onDone?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text])

  return (
    <span className="whitespace-pre-line">
      {displayed}
      {!done && (
        <span className="inline-block w-px h-4 bg-gray-800 ml-0.5 align-middle"
          style={{ animation: "cursorBlink 0.7s infinite" }} />
      )}
    </span>
  )
}

function MessageBubble({ msg, isLatest, onTypeDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  if (msg.role === "user") {
    return (
      <div className="mb-5" style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "all 0.3s ease"
      }}>
        <div className="inline-block bg-gray-100 text-gray-900 text-[15px] px-5 py-2.5 rounded-[20px_20px_4px_20px]"
          style={{ animation: "bubblePop 0.25s ease" }}>
          {msg.text}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "all 0.3s ease"
    }}>
      <div className="text-[16px] leading-relaxed text-gray-900">
        {isLatest ? (
          <TypewriterText text={msg.text} onDone={onTypeDone} />
        ) : (
          <span className="whitespace-pre-line">{msg.text}</span>
        )}
      </div>
    </div>
  )
}

export default function Chat({ sessionId, onProfileComplete }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [quickReplies, setQuickReplies] = useState([])
  const [typingDone, setTypingDone] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (sessionId) {
      setMessages([{
        role: "assistant",
        text: "Welcome to ET Saathi. I'll help you discover everything ET can do for you. Let's start with a quick profile.\n\nWhat do you do?"
      }])
      setTypingDone(false)
    }
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, quickReplies, loading])

  const handleTypeDone = () => {
    setTypingDone(true)
    if (messages.length === 1) setQuickReplies(QUICK_REPLIES.user_type)
  }

  const sendMessage = async (text) => {
    if (!text.trim() || !sessionId || loading || !typingDone) return
    setQuickReplies([])
    setTypingDone(false)
    setMessages(prev => [...prev, { role: "user", text }])
    setInput("")
    setLoading(true)

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/chat/", {
        session_id: sessionId,
        message: text
      })
      const data = res.data
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }])

      if (data.stage === "done" && data.profile) {
        setQuickReplies([])
        const scoreRes = await axios.get(
          `http://127.0.0.1:8000/api/chat/health-score/${sessionId}`
        )
        setTimeout(() => {
          onProfileComplete({
            profile: data.profile,
            recommendations: data.recommendations,
            sessionId,
            healthScore: scoreRes.data
          })
        }, 1200)
      } else {
        const qr = detectQuickReplies(data.reply)
        if (qr.length > 0) {
          setTimeout(() => setQuickReplies(qr), data.reply.length * 18 + 200)
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Something went wrong. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert("Use Chrome for voice input."); return }
    const r = new SR()
    r.lang = "hi-IN"
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = (e) => setInput(e.results[0][0].transcript)
    r.start()
  }

  return (
    <div className="bg-white min-h-screen flex flex-col max-w-2xl mx-auto px-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bubblePop { 0%{transform:scale(0.92);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
        @keyframes quickFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
      `}</style>

      {/* Logo */}
      <div className="flex items-center gap-2.5 pt-8 pb-7">
        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
          ✦
        </div>
        <span className="text-xl font-semibold text-gray-900">ET Saathi</span>
      </div>

      {/* Messages */}
      <div className="flex-1 pb-36">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            isLatest={i === messages.length - 1 && msg.role === "assistant"}
            onTypeDone={i === messages.length - 1 ? handleTypeDone : undefined}
          />
        ))}

        {/* Typing dots */}
        {loading && (
          <div className="flex gap-1.5 items-center mb-5">
            {[0, 150, 300].map((d, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-300"
                style={{ animation: `typingBounce 1.2s infinite ${d}ms` }} />
            ))}
          </div>
        )}

        {/* Quick replies */}
        {quickReplies.length > 0 && !loading && typingDone && (
          <div className="flex flex-wrap gap-2 mb-5">
            {quickReplies.map((qr, i) => (
              <button key={i} onClick={() => sendMessage(qr)}
                className="bg-white border border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900 rounded-full px-4 py-2 text-sm cursor-pointer transition-all"
                style={{
                  animation: `quickFadeIn 0.3s ease ${i * 0.06}s both`,
                  fontFamily: "'DM Sans', sans-serif"
                }}>
                {qr}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Fixed Input */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 pb-7 pt-4"
        style={{ background: "linear-gradient(to top, #fff 70%, transparent)" }}>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">

          {/* Voice button */}
          <button onClick={startVoice}
            className={`shrink-0 text-base border-0 bg-transparent cursor-pointer p-0 transition-colors ${listening ? "text-red-500" : "text-gray-300 hover:text-gray-500"}`}>
            {listening ? "⏹" : "🎤"}
          </button>

          {/* Input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask ET Saathi anything..."
            className="flex-1 border-0 outline-none text-[15px] text-gray-900 placeholder-gray-300 bg-transparent"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className={`shrink-0 text-lg border-0 bg-transparent p-0 transition-colors ${input.trim() ? "text-gray-900 cursor-pointer hover:text-red-500" : "text-gray-200 cursor-not-allowed"}`}>
            ➤
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] text-gray-300 mt-2">
          Press Enter or click ➤ to send
        </p>
      </div>
    </div>
  )
}