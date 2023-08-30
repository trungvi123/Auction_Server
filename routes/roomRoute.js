import express from "express";
import { getRoomByIdProd,joinRoom } from "../controllers/roomController.js";

const router = express.Router();



router.get('/:id', getRoomByIdProd) //id product

router.post('/join', joinRoom);



export default router 