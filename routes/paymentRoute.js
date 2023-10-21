import express from "express";
import { createOrderByPayPalController,captureOrderByPayPalController } from "../controllers/paymentController.js";


const router = express.Router();

router.post('/paypal/orders',createOrderByPayPalController)
router.post('/paypal/orders/:orderID/capture',captureOrderByPayPalController)


export default router 