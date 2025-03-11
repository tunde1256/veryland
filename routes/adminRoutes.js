const express = require('express');
const { createLawyerRequest, approveOrRejectLawyer,approveLawyer,downloadDocument } = require('../controller/admincontroller');
const { isAdmin } = require('../middlewares/roleMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

 router.post('/create-lawyer-request', isAdmin, createLawyerRequest);  
 router.post('/approve-reject-lawyer', isAdmin, approveOrRejectLawyer);  
//  router.post('/approved',authMiddleware, approveLawyer); 
router.get('/download-document/:propertyId/:documentIndex', isAdmin, downloadDocument)
module.exports = router;
