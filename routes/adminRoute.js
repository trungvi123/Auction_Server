import express from "express";
import {
  approveProduct, refuseProduct, approveAgainProduct, getProductsByStatusAD,
} from "../controllers/productController.js";
import {
  getReports, sendMailToUser, deleteReport, getAllUser, approveReport, updateBlockUserById, deleteUserById
} from "../controllers/userController.js";
import { checkAdminAccessToken } from "../middleware/authToken.js";
import { createStatistic, deleteStatistic, deleteTemplate, getAllStatistic, updateTemplate,
   activeTemplate, updateImgTemplate, getStatisticByYear, payouts, createTemplate,
    getTemplates, getNewContact, getContactReply, replyContact, handleExport,handleExportProfit, getProfitByYear } from '../controllers/adminController.js'
import { AdminUpload } from "../utils/uploadImg.js";
import { deleteNews, getNewsByStatus_admin, getReApproveNews, handleApproveNews } from "../controllers/newsController.js";

const router = express.Router();
//product
router.patch('/edit/approveProduct/:id', checkAdminAccessToken, approveProduct)
router.patch('/edit/refuseProduct/:id', checkAdminAccessToken, refuseProduct)
router.patch('/edit/approveAgainProduct/:id', checkAdminAccessToken, approveAgainProduct)

//user
router.get('/getAllUser', checkAdminAccessToken, getAllUser)
router.get('/getAllStatistic', checkAdminAccessToken, getAllStatistic)
router.get('/getStatisticByYear/:year', checkAdminAccessToken, getStatisticByYear)
router.get('/reports', checkAdminAccessToken, getReports)
router.get('/getTemplates', checkAdminAccessToken, getTemplates)
router.get('/getNewContact', checkAdminAccessToken, getNewContact)
router.get('/getContactReply', checkAdminAccessToken, getContactReply)

// new
router.get('/getReApproveNews', checkAdminAccessToken, getReApproveNews)
router.get('/getNewsByStatus_admin/:type', checkAdminAccessToken, getNewsByStatus_admin)

//export
router.get('/handleExport/:year/:type', handleExport);
router.get('/handleExportProfit/:year', handleExportProfit);

router.get('/getProfitByYear/:year',checkAdminAccessToken, getProfitByYear);


// router.get('/postDataMonth/:id', postDataMonth)
router.post('/createStatistic', checkAdminAccessToken, createStatistic)
router.post('/payouts', checkAdminAccessToken, payouts)
router.post('/updateBlockUserById/:id', checkAdminAccessToken, updateBlockUserById);
router.post('/sendMailToUser', checkAdminAccessToken, sendMailToUser)
router.post('/createTemplate', checkAdminAccessToken, createTemplate)
router.post('/updateTemplate', checkAdminAccessToken, updateTemplate)
router.post('/updateImgTemplate', checkAdminAccessToken, AdminUpload.single('image'), updateImgTemplate)
router.post('/replyContact/:id', checkAdminAccessToken, replyContact)
router.post('/handleApproveNews', checkAdminAccessToken, handleApproveNews)
router.post('/statusAd',checkAdminAccessToken, getProductsByStatusAD);

//export


router.patch('/approveReport/:id', checkAdminAccessToken, approveReport);
router.patch('/activeTemplate/:id', checkAdminAccessToken, activeTemplate);


router.delete('/deleteTemplate/:id', checkAdminAccessToken, deleteTemplate);
router.delete('/deleteReport/:id', checkAdminAccessToken, deleteReport);
router.delete('/deleteStatistic/:year', checkAdminAccessToken, deleteStatistic);
router.delete('/deleteUser/:id', checkAdminAccessToken, deleteUserById);
router.delete('/deleteNews/:id', checkAdminAccessToken, deleteNews);



export default router 
