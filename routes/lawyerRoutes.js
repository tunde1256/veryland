const express = require('express');
const { loginLawyer, downloadDocument, giveConsent,getPendingVerificationRequests,registerLawyer } = require('../controller/lawyercontroller');
const { isLawyer } = require('../middlewares/roleMiddleware');
const router = express.Router();

// Lawyer routes
router.post('/login', loginLawyer);
router.post('/register', registerLawyer);
router.get('/properties/pending-verifications', isLawyer, getPendingVerificationRequests);
router.get('/download-document/:propertyId/:documentIndex', isLawyer, downloadDocument);  // Lawyer downloads document
router.post('/give-consent/:propertyId', isLawyer, giveConsent);  // Lawyer gives consent to land verification

module.exports = router;
