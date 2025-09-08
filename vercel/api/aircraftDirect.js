import { getAccessToken } from "../services/services.js";

let cache = {
  data: null,
  timestamp: 0, 
}
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
const AIRCRAFT_ALL_URL = 'https://opensky-network.org/api/states/all';
const CACHE_TTL = 60 * 5000; // 5분 캐시

const getOpenSkyApi = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30초
  const token = await getAccessToken(); // 기존 getAccessToken 함수 사용
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await fetch(AIRCRAFT_ALL_URL, {
    method: "GET",
    headers,
    signal: controller.signal,
  });
  
  clearTimeout(timeout);

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  return response.json();
}

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
        const now = Date.now();
        if (cache.data && now - cache.timestamp < CACHE_TTL) {
        console.log("캐시 사용");
        return res.json(cache.data);
        }

        console.log("OpenSky API 호출");
        const data = await getOpenSkyApi();
        cache = { data, timestamp: now };

        res.json(data);
    } catch(error){
        console.warn(error);
        if (error.name === "AbortError") {
            return res.status(504).json({ message: "OpenSky API 요청 시간 초과" });
        }
        res.status(500).json({ message: "서버 에러 발생", error: error.message });
    }
}