import express from "express";
import { getRoomByIdProd,joinRoom } from "../controllers/roomController.js";
import { checkAccessTokenAndVerifyAccount } from "../middleware/authToken.js";

const router = express.Router();



router.get('/:id', getRoomByIdProd) //id product

router.post('/join',checkAccessTokenAndVerifyAccount, joinRoom);



export default router 