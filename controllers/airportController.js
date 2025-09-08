import { AIRPORT_ARRIVAL_URL, AIRPORT_DEPARTURE_URL } from '../constant/constant.js';
import { getAccessToken } from '../services/services.js';

export const getAirportData = async (req, res) => {
    try{
        const { airport, begin, end } = req.query;
        if (!airport || !begin || !end) {
            return res.status(400).json({ message: "airport, begin, end는 필수입니다." });
        }
        const token = await getAccessToken();
        const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};
        const urlArrival = `${AIRPORT_ARRIVAL_URL}?airport=${encodeURIComponent(airport)}&begin=${encodeURIComponent(begin)}&end=${encodeURIComponent(end)}`;
        const urlDeparture = `${AIRPORT_DEPARTURE_URL}?airport=${encodeURIComponent(airport)}&begin=${encodeURIComponent(begin)}&end=${encodeURIComponent(end)}`;
        // 병렬 요청
        const [responseArrival, responseDeparture] = await Promise.all([
        fetch(urlArrival, { method: 'GET', headers }),
        fetch(urlDeparture, { method: 'GET', headers }),
        ]);

        if (!responseArrival.ok) {
        throw new Error(`Arrival API error! status: ${responseArrival.status}`);
        }
        if (!responseDeparture.ok) {
        throw new Error(`Departure API error! status: ${responseDeparture.status}`);
        }

        // JSON 파싱
        const [arrivalData, departureData] = await Promise.all([
        responseArrival.json(),
        responseDeparture.json(),
        ]);

        // 통합 객체 생성
        const data = {
        arrival: arrivalData,
        departure: departureData,
        };

        res.json(data);
    } catch(error){
      console.warn(error);
      throw error;
    }
}
