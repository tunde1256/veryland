const express = require("express");
const router = express.Router();
const { requestVerification, approveVerification } = require("../controller/verificationController");
const { authenticate, authorizeAdmin } = require("../middlewares/authMiddleware");

router.post("/request/:propertyId", authenticate, requestVerification); 
router.put("/approve/:propertyId", authenticate, authorizeAdmin, approveVerification); 

module.exports = router;
