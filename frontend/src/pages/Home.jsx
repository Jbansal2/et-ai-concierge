import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Chat from "../components/Chat"
import TransitionLoader from "../components/TransitionLoader"
import axios from "axios"
import MarketTicker from "../components/MarketTicker"


export default function Home() {
  const [sessionId, setSessionId] = useState(null)
  const [showLoader, setShowLoader] = useState(false)
  const [pendingData, setPendingData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.post("http://127.0.0.1:8000/api/chat/new")
      .then(res => {
        setSessionId(res.data.session_id)
        if (res.data.returning_user) {
          setPendingData({
            profile: res.data.profile,
            recommendations: res.data.recommendations,
            sessionId: res.data.session_id
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