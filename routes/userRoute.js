import express from "express";
import {
  getUserById,
  deleteUserById,
  signIn,
  signUp, resetPass,changePass
} from "../controllers/userController.js";
import { checkAccessToken, checkAdminAccessToken } from "../middleware/authToken.js";
import { checkSignUp, checkSignIn, checkEmail } from '../middleware/checkRequest.js'


const router = express.Router();


router.get('/:id', getUserById);

router.post('/signUp', checkSignUp, signUp);
router.post('/signIn', checkSignIn, signIn);
router.post('/resetPass',checkAccessToken, checkEmail, resetPass);
router.post('/changePass',checkAccessToken, checkSignIn, changePass);

router.delete('/:id',checkAdminAccessToken, deleteUserById);


export default router 