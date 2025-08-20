import express from 'express';
import { getCurrentWeatherData } from "../controllers/currentWeather.js";

const router = express.Router();

router.get('/weather/current',getCurrentWeatherData);

export default router;