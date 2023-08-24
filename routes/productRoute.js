import express from "express";
import { createProduct, getProductById, getProducts, getProductsByOwner, deleteProduct,editProduct } from "../controllers/productController.js";
import { checkProduct } from "../middleware/checkRequest.js";
import upload from "../utils/uploadImg.js";

const router = express.Router();

router.get('/:id', getProductById);
router.get('/all/:quantity', getProducts);
router.get('/owner/:id', getProductsByOwner);

router.post('/delete/:id', deleteProduct);
router.patch('/edit', checkProduct, upload.array('images', 10), editProduct);

router.post('/create', checkProduct, upload.array('images', 10), createProduct);

export default router 
