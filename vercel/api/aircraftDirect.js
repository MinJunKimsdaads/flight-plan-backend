import { getAccessToken } from "../services/services.js";

let cache = {
  data: null,
  timestamp: 0, 
}

const AIRCRAFT_ALL_URL = 'https://opensky-network.org/api/states/all';
const CACHE_TTL = 60 * 5000; // 5분 캐시

const getOpenSkyApi = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30초
  const token = await getAccessToken();
  const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};
  const response = await fetch(AIRCRAFT_ALL_URL, {
      method: 'GET',
      headers,
      signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data =  await response.json();
  return data;
}

export default async function handler(req, res) {
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
        throw error;
    }
}