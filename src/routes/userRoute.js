import express from "express";
import {
  getUserById,
  deleteUserById,
  signIn,
  signUp, resetPass,changePass
} from "../controllers/userController.js";
import { checkSignUp, checkSignIn, checkEmail } from '../middleware/checkRequest.js'


const router = express.Router();


router.get('/:id', getUserById);

router.post('/signUp', checkSignUp, signUp);
router.post('/signIn', checkSignIn, signIn);
router.post('/resetPass', checkEmail, resetPass);
router.post('/changePass', checkSignIn, changePass);

router.delete('/:id', deleteUserById);


export default router 