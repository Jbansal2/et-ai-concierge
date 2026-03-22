import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Chat from "../components/Chat"
import TransitionLoader from "../components/TransitionLoader"
import MarketTicker from "../components/MarketTicker"
import { createSession } from "../api/etSaathiApi"


export default function Home() {
  const [sessionId, setSessionId] = useState(null)
  const [showLoader, setShowLoader] = useState(false)
  const [pendingData, setPendingData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    createSession()
      .then(data => {
        setSessionId(data.session_id)
        if (data.returning_user) {
          setPendingData({
            profile: data.profile,
            recommendations: data.recommendations,
            sessionId: data.session_id
          })
          setShowLoader(true)
        }
      })
  }, [])

  const handleProfileComplete = (data) => {
    setPendingData(data)
    setShowLoader(true)
  }

  const handleLoaderDone = () => {
    navigate("/dashboard", { state: pendingData })
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
        <MarketTicker />

      {showLoader && (
        <TransitionLoader onDone={handleLoaderDone} />
      )}
      <Chat
        sessionId={sessionId}
        onProfileComplete={handleProfileComplete}
      />
    </div>
  )
}