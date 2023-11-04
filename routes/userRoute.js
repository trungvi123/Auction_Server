import express from "express";
import { getTemplateActive } from "../controllers/adminController.js";
import {
  getUserById, createRate, replyComment, addFollow, unFollow,createOTP,verifyAccount,
  signIn, getRefuseProducts, getUserByEmail, addFollowProduct, unFollowProduct,
  signUp, resetPass, changePass, getBidsProducts, getRefuseFreeProducts, getNotifications, updateNotifications, updateProfile,
  deleteProductHistory, getWinProducts, getProductsByOwner, getPurchasedProducts, getParticipateReceiving
  , getFreeProductsByOwner, getReceivedProducts, createReport, handleFinishTransaction, deleteNotification
} from "../controllers/userController.js";
import { checkAccessToken } from "../middleware/authToken.js";
import { checkSignUp, checkSignIn, checkEmail } from '../middleware/checkRequest.js'
import upload, { RateUpload } from "../utils/uploadImg.js";


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
router.post('/resetPass', checkAccessToken, checkEmail, resetPass);
router.post('/changePass', checkAccessToken, checkSignIn, changePass);
router.post('/createReport', checkAccessToken, createReport);
router.post('/addFollow', checkAccessToken, addFollow);
router.post('/addFollowProduct', checkAccessToken, addFollowProduct);
router.post('/unFollowProduct', checkAccessToken, unFollowProduct);
router.post('/createOTP', checkAccessToken, createOTP);
router.post('/verifyAccount', checkAccessToken, verifyAccount);





router.post('/unFollow', checkAccessToken, unFollow);

router.post('/deleteProductHistory/:id', checkAccessToken, deleteProductHistory);
router.post('/handleFinishTransaction/:id', checkAccessToken, handleFinishTransaction);
router.post('/deleteNotification/:id', checkAccessToken, deleteNotification);

router.post('/createRate', checkAccessToken, RateUpload.array('images', 4), createRate);
router.post('/replyComment/:rateId', checkAccessToken, replyComment);



router.patch('/updateProfile', checkAccessToken, updateProfile);
router.patch('/updateNotifications/:userId', checkAccessToken, updateNotifications);




export default router 