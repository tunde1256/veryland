const express = require('express');
const { createLawyerRequest, approveOrRejectLawyer } = require('../controllers/adminController');
const { isAdmin } = require('../middlewares/roleMiddleware');
const { approveLawyer } = require('../controller/admincontroller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

// Admin routes for managing lawyer requests
router.post('/create-lawyer-request', isAdmin, createLawyerRequest);  
router.post('/approve-reject-lawyer', isAdmin, approveOrRejectLawyer);  
router.post('/lawyer/approve', authMiddleware, approveLawyer); 
module.exports = router;
