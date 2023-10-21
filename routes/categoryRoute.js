import express from "express";
import { create ,getCategoryById,getAllCategory} from "../controllers/categoryController.js";

const router = express.Router();


router.get('/', getAllCategory);
router.get('/:id', getCategoryById);

router.post('/create', create);

export default router 
