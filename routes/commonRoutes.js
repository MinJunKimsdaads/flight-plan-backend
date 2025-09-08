import express from 'express';
import { getTokenForClient } from "../controllers/tokenController.js";

const router = express.Router();

router.get('/common/token',getTokenForClient);

export default router;