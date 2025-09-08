import { getAccessToken } from '../services/services.js';

export const getTokenForClient = async (req, res) => {
    try{
        const token = await getAccessToken();
        res.json(token);
    }catch(error){
      console.warn(error);
      throw error;
  }
}