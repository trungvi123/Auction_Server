import express from "express";
import {
    approveProduct, refuseProduct, createProduct, updateAuctionEnded,
    getQuatityProductByMonth, getProductById, getBidsById, updateAuctionStarted,
    getProducts, getCurrentPriceById, deleteProduct, editProduct,getProductsByStatus,approveAgainProduct,getAllProducts
} from "../controllers/productController.js";
import { checkAccessToken, checkAdminAccessToken } from "../middleware/authToken.js";
import { checkProduct } from "../middleware/checkRequest.js";

import upload from "../utils/uploadImg.js";

const router = express.Router();

router.get('/quatityProduct', getQuatityProductByMonth);
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


router.patch('/edit', checkAccessToken, checkProduct, upload.array('images', 10), editProduct);
router.patch('/edit/approveProduct/:id', approveProduct) // doi lai thanh adminToken khi test xong
router.patch('/edit/refuseProduct/:id', checkAccessToken, refuseProduct) // doi lai thanh adminToken khi test xong
router.patch('/edit/approveAgainProduct/:id', checkAccessToken, approveAgainProduct) // doi lai thanh adminToken khi test xong



export default router 
