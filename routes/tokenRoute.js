import express from "express";
import { refreshTokenMethod } from "../controllers/tokenController.js";

const router = express.Router();

router.post('/refresh', refreshTokenMethod);

export default router 
