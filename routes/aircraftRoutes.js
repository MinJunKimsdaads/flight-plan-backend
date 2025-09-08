import express from 'express';
import { getAllAircraftData, getAllAircraftDirectData, getSingleAircraftData } from "../controllers/aircraftController.js";

const router = express.Router();

router.get('/aircraft/all',getAllAircraftData);
router.get('/aircraft/direct/all',getAllAircraftDirectData);
router.get('/aircraft/single',getSingleAircraftData);

export default router;