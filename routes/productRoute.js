import express from "express";
import {
    createProduct, updateAuctionEnded, getProductsByEmail,
    getProductById, getBidsById, updateAuctionStarted,
    getProducts, getCurrentPriceById, deleteProduct, updateShipping, editProduct, getProductsByStatus, getAllProducts, search, hideProduct, getHideProductsByOwner
} from "../controllers/productController.js";
import { checkAccessToken, checkAccessTokenAndVerifyAccount } from "../middleware/authToken.js";
import { checkProduct } from "../middleware/checkRequest.js";

import upload from "../utils/uploadImg.js";

const router = express.Router();

// router.get('/quatityProduct', getQuatityProductByMonth);
router.get('/price/:id', getCurrentPriceById);
router.get('/bids/:id', getBidsById);
router.get('/all/', getAllProducts);
router.get('/page/:page', getProducts);
router.get('/edit/auctionStarted/:id', updateAuctionStarted)
router.get('/getProductsByEmail/:email', getProductsByEmail);
router.get('/getHideProductsByOwner/:id',checkAccessToken, getHideProductsByOwner);

router.get('/:id', getProductById);


// router.post('/share', shareProductOnFacebook);
router.post('/delete/:id', checkAccessToken, deleteProduct);
router.post('/edit/auctionEnded/:id', checkAccessToken, updateAuctionEnded)
router.post('/status', getProductsByStatus);
router.post('/create', checkAccessTokenAndVerifyAccount, checkProduct, upload.array('images', 10), createProduct);
router.post('/search', checkAccessToken, search)
router.post('/hideProduct/:id', checkAccessTokenAndVerifyAccount, hideProduct);

router.patch('/edit/shipping/:id', checkAccessTokenAndVerifyAccount, updateShipping)
router.patch('/edit', checkAccessTokenAndVerifyAccount, checkProduct, upload.array('images', 10), editProduct);




export default router 
