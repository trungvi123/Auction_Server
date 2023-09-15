import express from "express";
import {createFreeProduct} from '../controllers/freeProductController.js'
import { checkAccessToken } from "../middleware/authToken.js";
import { checkProduct } from "../middleware/checkRequest.js";
import upload from "../utils/uploadImg.js";

const router = express.Router();

router.post('/create', checkAccessToken, checkProduct, upload.array('images', 10), createFreeProduct);

export default router 