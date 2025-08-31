import express from 'express';
import { getAllAircraftData, getAllAircraftDirectData } from "../controllers/aircraftController.js";

const router = express.Router();

router.get('/aircraft/all',getAllAircraftData);
router.get('/aircraft/direct/all',getAllAircraftDirectData);

export default router;