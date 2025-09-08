import { getAccessToken } from "../services/services.js";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
const AIRPORT_DEPARTURE_URL = 'https://opensky-network.org/api/flights/departure'

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  } else {
    return res.status(403).json({ message: "CORS 정책에 의해 차단된 요청입니다." });
  }
  // Preflight 요청 처리
  if (req.method === "OPTIONS") return res.status(200).end();
  try{
    const { airport, begin, end } = req.query;
    if (!airport || !begin || !end) {
        return res.status(400).json({ message: "airport, begin, end는 필수입니다." });
    }
    const token = await getAccessToken(); // 기존 getAccessToken 함수 사용
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${AIRPORT_DEPARTURE_URL}?airport=${encodeURIComponent(airport)}&begin=${encodeURIComponent(begin)}&end=${encodeURIComponent(end)}`, {
        method: "GET",
        headers,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return response.json();
  }catch(error){
    console.warn(error);
  }
}