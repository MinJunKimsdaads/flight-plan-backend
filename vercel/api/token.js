import { handleCors } from "../services/corsConfig.js";
import { getAccessToken } from "../services/services.js";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

export default async function handler(req, res) {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    } else {
        return res.status(403).json({ message: "CORS 정책에 의해 차단된 요청입니다." });
    }
    const token = await getAccessToken();
    
    if(token){
        res.json(token);
    }
}