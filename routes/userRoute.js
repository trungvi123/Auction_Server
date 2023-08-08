import express from "express";
import {
  getUserById,
  deleteUserById,
  signIn,
  signUp,
} from "../controllers/userController.js";
import {checkSignUp,checkSignIn} from '../middleware/checkRequest.js'


const router = express.Router();

router.post('/signUp',checkSignUp,signUp);
router.post('/signIn',checkSignIn,signIn);


router.get('/:id',getUserById);
router.delete('/:id',deleteUserById);


export default router 