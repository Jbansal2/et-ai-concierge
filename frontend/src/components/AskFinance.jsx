import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import axios from "axios"

const SUGGESTED = [
  "Should I invest in SIP?",
  "How to save tax?",
  "Best MF for beginners?",
  "How much emergency fund do I need?",
]

function playSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.frequency.setValueAtTime(880, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1)
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.3)
  } catch {}
}

export default function AskFinance({ sessionId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unread, setUnread] = useState(0)
  const [typedDone, setTypedDone] = useState({})
  const messagesRef = useRef(null)

  const FLOAT_Z_INDEX = 9999

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (open) setUnread(0) }, [open])

  const scrollToBottom = (behavior = "smooth") => {
    const el = messagesRef.current
    if (!el) return
    requestAnimationFrame(() => requestAnimationFrame(() =>
      el.scrollTo({ top: el.scrollHeight, behavior })
    ))
  }

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToBottom("smooth")))
  }, [open, messages, loading])

  const TypewriterText = useMemo(() => {
    return function TW({ text, done, onDone, onProgress }) {
      const [len, setLen] = useState(done ? String(text ?? "").length : 0)
      const full = String(text ?? "")
      useEffect(() => {
        if (done) { setLen(full.length); return }
        let cancelled = false
        const id = window.setInterval(() => {
          if (cancelled) return
          setLen(p => Math.min(full.length, p + 2))
        }, 18)
        return () => { cancelled = true; window.clearInterval(id) }
      }, [done, full])
      useEffect(() => {
        if (done) return
        if (len >= full.length) onDone?.()
        else onProgress?.()
      }, [done, len, full.length])
      return <span style={{ whiteSpace: "pre-wrap" }}>{full.slice(0, len)}</span>
    }
  }, [])

  const ask = async (question) => {
    if (!question.trim() || loading) return
    setMessages(prev => [...prev, { role: "user", text: question }])
    setInput("")
    setLoading(true)
    try {
      // Finance answer + RAG search parallel mein
      const [answerRes, ragRes] = await Promise.all([
        axios.post(`http://127.0.0.1:8000/api/chat/ask/${sessionId}`, { question }),
        axios.get(`http://127.0.0.1:8000/api/chat/search/${sessionId}?q=${encodeURIComponent(question)}`)
          .catch(() => ({ data: { results: [] } }))
      ])

      const articles = (ragRes.data.results || []).slice(0, 2)

      setMessages(prev => [...prev, {
        role: "assistant",
        text: answerRes.data.answer,
        articles
      }])
      playSound()
      if (!open) setUnread(p => p + 1)
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Something went wrong. Please try again.",
        articles: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const ui = (
    <>
      <style>{`
        @keyframes popUp { from{opacity:0;transform:scale(0.92) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce2 { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        @keyframes badgePop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .et-scroll { scrollbar-width:none; -ms-overflow-style:none; }
        .et-scroll::-webkit-scrollbar { display:none; }
        .suggest-btn:hover { border-color:#e53e3e !important; color:#e53e3e !important; }
      `}</style>

      {/* Floating button */}
      {!open && (
        <div onClick={() => setOpen(true)} style={{
          position: "fixed", bottom: "28px", right: "28px",
          width: "52px", height: "52px",
          background: "linear-gradient(135deg, #e53e3e, #c53030)",
          borderRadius: "50%", display: "flex",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: FLOAT_Z_INDEX,
          boxShadow: "0 4px 20px rgba(229,62,62,0.4)",
          color: "#fff", fontSize: "22px", transition: "transform 0.2s"
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          ✦
          {unread > 0 && (
            <div style={{
              position: "absolute", top: "-4px", right: "-4px",
              width: "20px", height: "20px", borderRadius: "50%",
              background: "#10b981", color: "#fff",
              fontSize: "10px", fontWeight: "700",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "badgePop 0.3s ease"
            }}>{unread}</div>
          )}
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "370px", height: "540px",
          background: "#fff", borderRadius: "20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column",
          fontFamily: "'DM Sans', sans-serif",
          zIndex: FLOAT_Z_INDEX, animation: "popUp 0.25s ease"
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 18px", borderBottom: "1px solid #f0f0f0",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "34px", height: "34px",
                background: "linear-gradient(135deg, #e53e3e, #c53030)",
                borderRadius: "9px", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: "700", fontSize: "14px"
              }}>✦</div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#111" }}>
                  ET Saathi Assistant
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#10b981",
                    animation: "livePulse 2s infinite"
                  }} />
                  <span style={{ fontSize: "11px", color: "#10b981" }}>Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "none", background: "#f5f5f5",
              cursor: "pointer", fontSize: "14px", color: "#666",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>✕</button>
          </div>

          {/* Messages */}
          <div ref={messagesRef} className="et-scroll" style={{
            flex: 1, overflowY: "auto", padding: "16px",
            display: "flex", flexDirection: "column", gap: "12px"
          }}>

            {/* Welcome state */}
            {messages.length === 0 && (
              <div style={{ animation: "fadeUp 0.3s ease" }}>
                <div style={{ fontSize: "15px", lineHeight: "1.6", color: "#111", marginBottom: "16px" }}>
                  Hi! Ask me anything about your finances. 💡
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {SUGGESTED.map((q, i) => (
                    <button key={i} onClick={() => ask(q)} className="suggest-btn" style={{
                      background: "#fff", border: "1.5px solid #e2e2e2",
                      borderRadius: "22px", padding: "8px 16px",
                      fontSize: "13px", color: "#111", cursor: "pointer",
                      textAlign: "left", fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s",
                      animation: `fadeUp 0.3s ease ${i * 0.07}s both`
                    }}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                animation: "fadeUp 0.25s ease"
              }}>
                {msg.role === "user" ? (
                  <div style={{
                    background: "linear-gradient(135deg, #e53e3e, #c53030)",
                    color: "#fff", padding: "9px 16px",
                    borderRadius: "18px 18px 4px 18px",
                    fontSize: "13px", lineHeight: "1.5", maxWidth: "80%"
                  }}>{msg.text}</div>
                ) : (
                  <div style={{
                    background: "#f7f7f7", color: "#111",
                    padding: "10px 14px",
                    borderRadius: "18px 18px 18px 4px",
                    fontSize: "13px", lineHeight: "1.6", maxWidth: "85%"
                  }}>
                    <TypewriterText
                      text={msg.text}
                      done={!!typedDone[i]}
                      onDone={() => setTypedDone(p => ({ ...p, [i]: true }))}
                      onProgress={() => scrollToBottom("auto")}
                    />

                    {/* RAG Articles */}
                    {msg.articles?.length > 0 && typedDone[i] && (
                      <div style={{
                        marginTop: "10px", paddingTop: "10px",
                        borderTop: "1px solid #efefef",
                        animation: "fadeUp 0.3s ease"
                      }}>
                        <div style={{
                          fontSize: "10px", fontWeight: "700",
                          color: "#aaa", letterSpacing: "0.06em",
                          marginBottom: "6px"
                        }}>RELATED FROM ET</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {msg.articles.map((a, j) => (
                            <a key={j} href={a.url} target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex", alignItems: "flex-start",
                                gap: "6px", textDecoration: "none",
                                padding: "6px 8px",
                                background: "#fff",
                                borderRadius: "8px",
                                border: "1px solid #f0f0f0",
                                transition: "border-color 0.15s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = "#fecaca"}
                              onMouseLeave={e => e.currentTarget.style.borderColor = "#f0f0f0"}
                            >
                              <div style={{
                                width: "5px", height: "5px",
                                borderRadius: "50%", background: "#e53e3e",
                                flexShrink: 0, marginTop: "4px"
                              }} />
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: "11px", fontWeight: "500",
                                  color: "#111", lineHeight: "1.4",
                                  marginBottom: "2px"
                                }}>{a.title}</div>
                                <div style={{
                                  fontSize: "10px",
                                  background: "#fff5f5", color: "#e53e3e",
                                  display: "inline-block",
                                  padding: "1px 6px", borderRadius: "20px",
                                  fontWeight: "500", textTransform: "capitalize"
                                }}>{a.category}</div>
                              </div>
                              <span style={{ fontSize: "11px", color: "#e53e3e", flexShrink: 0 }}>→</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Typing dots */}
            {loading && (
              <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
                {[0, 150, 300].map((d, i) => (
                  <div key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#ccc", animation: `bounce2 1.2s infinite ${d}ms`
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #f0f0f0" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "#f7f7f7", borderRadius: "12px", padding: "8px 14px"
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && ask(input)}
                placeholder="Ask anything..."
                style={{
                  flex: 1, border: "none", outline: "none",
                  background: "transparent", fontSize: "13px",
                  color: "#111", fontFamily: "'DM Sans', sans-serif"
                }}
              />
              <button onClick={() => ask(input)}
                disabled={loading || !input.trim()}
                style={{
                  background: "none", border: "none",
                  color: input.trim() ? "#e53e3e" : "#ccc",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  fontSize: "18px", padding: "0", flexShrink: 0
                }}>➤</button>
            </div>
            <div style={{
              textAlign: "center", fontSize: "10px",
              color: "#ccc", marginTop: "6px"
            }}>Powered by ET Saathi AI</div>
          </div>
        </div>
      )}
    </>
  )

  if (!mounted) return null
  return createPortal(ui, document.body)
}