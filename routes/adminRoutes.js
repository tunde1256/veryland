const express = require('express');
const { createLawyerRequest, approveOrRejectLawyer,approveLawyer,downloadDocument, adminResgister,adminlogin } = require('../controller/admincontroller');
const { isAdmin } = require('../middlewares/roleMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

 router.post('/create-lawyer-request', isAdmin, createLawyerRequest);  
 router.post('/approve-reject-lawyer', isAdmin, approveOrRejectLawyer);  
//  router.post('/approved',authMiddleware, approveLawyer); 
router.get('/download-document/:propertyId/:documentIndex', isAdmin, downloadDocument)
router.post('/admin-register', adminResgister);
router.post('/admin-login', adminlogin);

module.exports = router;
