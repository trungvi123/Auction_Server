import express from "express";
import { createFreeProduct,getFreeProducts, getProductById, getFreeProductsByEmail, signUpToReceive, getAllFreeProducts, confirmSharingProduct, getParticipationList, getProductsByStatus, editFreeProduct, getHideProductsByOwner } from '../controllers/freeProductController.js'
import { checkAccessToken,checkAccessTokenAndVerifyAccount } from "../middleware/authToken.js";
import { checkFreeProduct } from "../middleware/checkRequest.js";
import upload from "../utils/uploadImg.js";

const router = express.Router();
router.get('/getParticipationList/:id', checkAccessToken, getParticipationList);
router.get('/getFreeProductsByEmail/:email', getFreeProductsByEmail);
router.get('/all/:limit?', getAllFreeProducts);
router.get('/getFreeProducts/:limit?', getFreeProducts);
router.get('/getHideProductsByOwner/:id',checkAccessToken, getHideProductsByOwner);


router.get('/:id', getProductById);


router.patch('/edit', checkAccessTokenAndVerifyAccount, checkFreeProduct, upload.array('images', 10), editFreeProduct);

router.post('/create', checkAccessTokenAndVerifyAccount, checkFreeProduct, upload.array('images', 10), createFreeProduct);
router.post('/signUpToReceive/:id', checkAccessTokenAndVerifyAccount, signUpToReceive);
router.post('/status', getProductsByStatus);
router.post('/confirmSharingProduct', checkAccessTokenAndVerifyAccount,confirmSharingProduct);

export default router 