import express from 'express';
import { getAllAircraftData } from "../controllers/aircraftController.js";

const router = express.Router();

router.get('/aircraft/all',getAllAircraftData);

export default router;