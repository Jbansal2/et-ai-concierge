import axios from "axios"

const DEFAULT_BASE_URL = "http://127.0.0.1:8000"

const baseURL = (import.meta?.env?.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "")

export const apiClient = axios.create({
  baseURL,
})

export async function createSession(sessionId) {
  const res = await apiClient.post("/api/chat/new", null, {
    params: sessionId ? { session_id: sessionId } : undefined,
  })
  return res.data
}

export async function sendChatMessage({ sessionId, message }) {
  const res = await apiClient.post("/api/chat/", {
    session_id: sessionId,
    message,
  })
  return res.data
}

export async function getHealthScore(sessionId) {
  const res = await apiClient.get(`/api/chat/health-score/${sessionId}`)
  return res.data
}

export async function getCrossSell(sessionId) {
  const res = await apiClient.get(`/api/chat/cross-sell/${sessionId}`)
  return res.data
}

export async function getNews(sessionId) {
  const res = await apiClient.get(`/api/chat/news/${sessionId}`)
  return res.data
}

export async function getAIInsight(sessionId) {
  const res = await apiClient.get(`/api/chat/ai-insight/${sessionId}`)
  return res.data
}

export async function askFinance(sessionId, question) {
  const res = await apiClient.post(`/api/chat/ask/${sessionId}`, { question })
  return res.data
}

export async function searchArticles(sessionId, query, category) {
  const res = await apiClient.get(`/api/chat/search/${sessionId}`, {
    params: {
      q: query,
      ...(category ? { category } : null),
    },
  })
  return res.data
}

export async function getMarketTicker() {
  const res = await apiClient.get("/api/chat/market-ticker")
  return res.data
}

export async function getAds(sessionId) {
  const res = await apiClient.get(`/api/chat/ads/${sessionId}`)
  return res.data
}

export async function getETScore(sessionId) {
  const res = await apiClient.get(`/api/chat/et-score/${sessionId}`)
  return res.data
}

export async function getPortfolioGaps(sessionId) {
  const res = await apiClient.get(`/api/chat/portfolio-gaps/${sessionId}`)
  return res.data
}
