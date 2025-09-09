import { handleCors } from "../services/corsConfig.js";
import { getAccessToken } from "../services/services.js";

export default async function handler(req, res) {
    if(!handleCors(req, res)) return;
    const token = await getAccessToken();
    
    if(token){
        res.json(token);
    }
}