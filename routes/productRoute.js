import express from "express";
import { createProduct, updateAuctionEnded, getProductById, getBidsById, updateAuctionStarted, getProducts, getCurrentPriceById, getProductsByOwner, deleteProduct, editProduct } from "../controllers/productController.js";
import { checkAccessToken, checkAdminAccessToken } from "../middleware/authToken.js";
import { checkProduct } from "../middleware/checkRequest.js";

import upload from "../utils/uploadImg.js";

const router = express.Router();

router.get('/:id', getProductById);
router.get('/price/:id', getCurrentPriceById);
router.get('/bids/:id', getBidsById);

router.get('/all/:quantity', getProducts);
router.get('/owner/:id', checkAccessToken, getProductsByOwner);

router.post('/delete/:id', checkAccessToken, deleteProduct);
router.patch('/edit', checkAccessToken, checkProduct, upload.array('images', 10), editProduct);
router.get('/edit/auctionStarted/:id', checkAccessToken, updateAuctionStarted)
router.get('/edit/auctionEnded/:id', checkAccessToken, updateAuctionEnded)


router.post('/create', checkAccessToken, checkProduct, upload.array('images', 10), createProduct);

export default router 
