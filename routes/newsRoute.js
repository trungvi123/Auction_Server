import express from "express";
import { createNews, hideNews, showNews,getNewsByEmail, getHideNews, editNews, getNews, getMyNews, getRefuseNews, getNewsById, reApprove, deleteNews } from "../controllers/newsController.js";
import { checkAccessTokenAndVerifyAccount } from "../middleware/authToken.js";
import { NewsUpload } from "../utils/uploadImg.js";

const router = express.Router();

router.get('/getNews', getNews)
router.get('/getNewsById/:id', getNewsById)
router.get('/getNewsByEmail/:email', getNewsByEmail)

router.get('/getMyNews', checkAccessTokenAndVerifyAccount, getMyNews)
router.get('/getHideNews', checkAccessTokenAndVerifyAccount, getHideNews)

router.get('/getRefuseNews', checkAccessTokenAndVerifyAccount, getRefuseNews)



router.post('/', checkAccessTokenAndVerifyAccount, NewsUpload.single('img'), createNews)
router.post('/editNews', checkAccessTokenAndVerifyAccount, NewsUpload.single('img'), editNews)
router.post('/hideNews',checkAccessTokenAndVerifyAccount, hideNews)
router.post('/showNews',checkAccessTokenAndVerifyAccount, showNews)
router.post('/reApprove',checkAccessTokenAndVerifyAccount, reApprove)
router.delete('/deleteNews/:id', checkAccessTokenAndVerifyAccount, deleteNews);



export default router 