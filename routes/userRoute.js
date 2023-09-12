import express from "express";
import {
  getUserById,
  deleteUserById,
  signIn,getRefuseProducts,
  signUp, resetPass, changePass, getBidsProducts,getQuatityUsersByMonth, deleteProductHistory, getWinProducts, getProductsByOwner, getPurchasedProducts
} from "../controllers/userController.js";
import { checkAccessToken, checkAdminAccessToken } from "../middleware/authToken.js";
import { checkSignUp, checkSignIn, checkEmail } from '../middleware/checkRequest.js'


const router = express.Router();

router.get('/quatityUsers', getQuatityUsersByMonth);

router.get('/purchasedProducts/:id', checkAccessToken, getPurchasedProducts);
router.get('/bidsProducts/:id', checkAccessToken, getBidsProducts);
router.get('/refuseProducts/:id', checkAccessToken, getRefuseProducts);

router.get('/winProducts/:id', checkAccessToken, getWinProducts);
router.get('/owner/:id', checkAccessToken, getProductsByOwner);
router.get('/:id', getUserById);


router.post('/signUp', checkSignUp, signUp);
router.post('/signIn', checkSignIn, signIn);
router.post('/resetPass', checkAccessToken, checkEmail, resetPass);
router.post('/changePass', checkAccessToken, checkSignIn, changePass);

router.post('/deleteProductHistory/:id', checkAccessToken, deleteProductHistory);

router.delete('/:id', checkAdminAccessToken, deleteUserById);


export default router 