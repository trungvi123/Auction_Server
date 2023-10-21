import express from "express";
import {
    createProduct, updateAuctionEnded,
    getProductById, getBidsById, updateAuctionStarted, getPrepareToStart,
    getProducts, getCurrentPriceById, deleteProduct, updateShipping, editProduct, getProductsByStatus, getAllProducts, search
} from "../controllers/productController.js";
import { checkAccessToken } from "../middleware/authToken.js";
import { checkProduct } from "../middleware/checkRequest.js";

import upload from "../utils/uploadImg.js";

const router = express.Router();

// router.get('/quatityProduct', getQuatityProductByMonth);
router.get('/prepareToStart', getPrepareToStart);
router.get('/price/:id', getCurrentPriceById);
router.get('/bids/:id', getBidsById);
router.get('/all/', getAllProducts);
router.get('/page/:page', getProducts);
router.get('/edit/auctionStarted/:id', updateAuctionStarted)
router.get('/:id', getProductById);

router.post('/delete/:id', checkAccessToken, deleteProduct);
router.post('/edit/auctionEnded/:id', updateAuctionEnded)
router.post('/status', getProductsByStatus);
router.post('/create', checkAccessToken, checkProduct, upload.array('images', 10), createProduct);
router.post('/search', checkAccessToken, search)

router.patch('/edit/shipping/:id', checkAccessToken, updateShipping)
router.patch('/edit', checkAccessToken, checkProduct, upload.array('images', 10), editProduct);




export default router 
