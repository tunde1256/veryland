const express = require('express');
const { createLawyerRequest, approveOrRejectLawyer, approveLawyer, downloadDocument, adminResgister, adminlogin } = require('../controller/admincontroller');
const { isAdmin } = require('../middlewares/roleMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');
const adminController = require('../controller/admincontroller');
const router = express.Router();


 router.post('/create-lawyer-request', isAdmin, createLawyerRequest);  
 router.post('/approve-reject-lawyer', isAdmin, approveOrRejectLawyer);  

//  router.post('/approved',authMiddleware, approveLawyer); 
router.get('/download-document/:propertyId/:documentIndex', isAdmin, downloadDocument)
 router.post("/register",isAdmin, adminController.adminRegister); 
 router.post('/admin-login', adminlogin);

module.exports = router;
