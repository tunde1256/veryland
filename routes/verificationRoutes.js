const express = require("express");
const router = express.Router();
const { 
  requestVerification, 
  approveVerification, 
  rejectVerification, // Fixing missing rejectVerification import
  listVerificationRequests, 
  listVerifiedProperties, 
  listRejectedProperties 
} = require("../controller/verificationController");

const { authenticate, authorizeAdmin } = require("../middlewares/authMiddleware");

router.post("/request/:propertyId", authenticate, requestVerification);

router.put("/approve/:propertyId", authenticate, authorizeAdmin, approveVerification);

router.put("/:propertyId/reject", authenticate, authorizeAdmin, rejectVerification); // Fixing middleware to use authenticate and authorizeAdmin

router.get("/requests", authenticate, authorizeAdmin, listVerificationRequests);

router.get("/verified", authenticate, authorizeAdmin, listVerifiedProperties);

router.get("/rejected", authenticate, authorizeAdmin, listRejectedProperties);

module.exports = router;
