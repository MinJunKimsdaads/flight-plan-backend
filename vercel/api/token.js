import { handleCors } from "../services/corsConfig";
import { getAccessToken } from "../services/services.js";


export default async function handler(req, res) {
    if (!handleCors(req, res)) return; // CORS 처리 후 요청 차단 시 종료
    const token = await getAccessToken();

    if(token){
        res.json(token);
    }
}