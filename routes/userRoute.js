import express from "express";
import { getTemplateActive } from "../controllers/adminController.js";
import {
  getUserById, createRate, replyComment, addFollow, unFollow,createOTP,verifyAccount,
  signIn, getRefuseProducts, getUserByEmail, addFollowProduct, unFollowProduct,
  signUp, resetPass, changePass, getBidsProducts, getRefuseFreeProducts, getNotifications, updateNotifications, updateProfile,
  deleteProductHistory, getWinProducts, getProductsByOwner, getPurchasedProducts, getParticipateReceiving
  , getFreeProductsByOwner, getReceivedProducts, createReport, handleFinishTransaction, deleteNotification, contact
} from "../controllers/userController.js";
import { checkAccessToken ,checkAccessTokenAndVerifyAccount} from "../middleware/authToken.js";
import { checkSignUp, checkSignIn, checkEmail } from '../middleware/checkRequest.js'
import { RateUpload, UserUpload } from "../utils/uploadImg.js";


const router = express.Router();


router.get('/purchasedProducts/:id', checkAccessToken, getPurchasedProducts);
router.get('/receivedProducts/:id', checkAccessToken, getReceivedProducts);
router.get('/getParticipateReceiving/:id', checkAccessToken, getParticipateReceiving);
router.get('/bidsProducts/:id', checkAccessToken, getBidsProducts);
router.get('/refuseProducts/:id', checkAccessToken, getRefuseProducts);
router.get('/refuseFreeProducts/:id', checkAccessToken, getRefuseFreeProducts);
router.get('/winProducts/:id', checkAccessToken, getWinProducts);
router.get('/owner/freeProduct/:id', checkAccessToken, getFreeProductsByOwner);
router.get('/owner/:id', checkAccessToken, getProductsByOwner);
router.get('/notifications/:userId', checkAccessToken, getNotifications);
router.get('/getTemplateActive', getTemplateActive)
router.get('/getUserByEmail/:email', getUserByEmail)

router.get('/:id', checkAccessToken, getUserById);

router.post('/signUp', checkSignUp, signUp);
router.post('/signIn', checkSignIn, signIn);
router.post('/contact', contact);
router.post('/resetPass', checkEmail, resetPass);
router.post('/changePass', checkAccessToken, checkSignIn, changePass);
router.post('/createReport', checkAccessTokenAndVerifyAccount, createReport);
router.post('/addFollow', checkAccessTokenAndVerifyAccount, addFollow);
router.post('/addFollowProduct', checkAccessToken, addFollowProduct);
router.post('/unFollowProduct', checkAccessToken, unFollowProduct);
router.post('/createOTP', checkAccessToken, createOTP);
router.post('/verifyAccount', checkAccessToken, verifyAccount);
router.post('/unFollow', checkAccessTokenAndVerifyAccount, unFollow);
router.post('/deleteProductHistory/:id', checkAccessTokenAndVerifyAccount, deleteProductHistory);
router.post('/handleFinishTransaction/:id', checkAccessTokenAndVerifyAccount, handleFinishTransaction);
router.post('/deleteNotification/:id', checkAccessToken, deleteNotification);
router.post('/createRate', checkAccessTokenAndVerifyAccount, RateUpload.array('images', 4), createRate);
router.post('/replyComment/:rateId', checkAccessTokenAndVerifyAccount, replyComment);





router.patch('/updateProfile', checkAccessToken,UserUpload.single('avatar'), updateProfile);
router.patch('/updateNotifications/:userId', checkAccessToken, updateNotifications);




export default router 