import express from "express";
import {
  getUserById,
  deleteUserById,
  signIn,
  signUp, resetPass, changePass, getBidsProducts, deleteProductHistory, getWinProducts, getProductsByOwner, getPurchasedProducts
} from "../controllers/userController.js";
import { checkAccessToken, checkAdminAccessToken } from "../middleware/authToken.js";
import { checkSignUp, checkSignIn, checkEmail } from '../middleware/checkRequest.js'


const router = express.Router();


router.get('/:id', getUserById);
router.get('/purchasedProducts/:id', checkAccessToken, getPurchasedProducts);
router.get('/bidsProducts/:id', checkAccessToken, getBidsProducts);
router.get('/winProducts/:id', checkAccessToken, getWinProducts);
router.get('/owner/:id', checkAccessToken, getProductsByOwner);


router.post('/signUp', checkSignUp, signUp);
router.post('/signIn', checkSignIn, signIn);
router.post('/resetPass', checkAccessToken, checkEmail, resetPass);
router.post('/changePass', checkAccessToken, checkSignIn, changePass);

router.post('/deleteProductHistory/:id', checkAccessToken, deleteProductHistory);

router.delete('/:id', checkAdminAccessToken, deleteUserById);


export default router 