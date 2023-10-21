import express from "express";
import { createFreeProduct, getProductById, signUpToReceive,getAllFreeProducts, confirmSharingProduct, getParticipationList, getProductsByStatus, editFreeProduct } from '../controllers/freeProductController.js'
import { checkAccessToken } from "../middleware/authToken.js";
import { checkFreeProduct } from "../middleware/checkRequest.js";
import upload from "../utils/uploadImg.js";

const router = express.Router();
router.get('/getParticipationList/:id', checkAccessToken, getParticipationList);

router.get('/all/:limit?', getAllFreeProducts);

router.get('/:id', getProductById);


router.patch('/edit', checkAccessToken, checkFreeProduct, upload.array('images', 10), editFreeProduct);

router.post('/create', checkAccessToken, checkFreeProduct, upload.array('images', 10), createFreeProduct);
router.post('/signUpToReceive/:id', checkAccessToken, signUpToReceive);
router.post('/status', getProductsByStatus);
router.post('/confirmSharingProduct', confirmSharingProduct);

export default router 