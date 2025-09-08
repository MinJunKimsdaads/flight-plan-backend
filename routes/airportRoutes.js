import express from 'express';
import { getAirportData } from '../controllers/airportController.js';

const router = express.Router();

router.get('/airport/single',getAirportData);

export default router;