const express = require("express");
const { getUserProfile, updateUserProfile,deleteUser,updateUserPassword,logoutUser,getUserByEmail ,forgotPassword,resetPassword, completeResetPassword} = require("../controller/userController");
const { authenticate, authorizeAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:id", getUserProfile);
router.put("/:id", updateUserProfile);

router.delete("/:id", authenticate, authorizeAdmin,deleteUser);  
router.put("/update-password/:id", authenticate, updateUserPassword); 
router.get("/email/:email", authenticate,getUserByEmail); 
router.post("/logout", authenticate,logoutUser);
router.post('/forgot-password', forgotPassword);  
router.post('/reset-password', resetPassword);
router.post('/complete-reset', completeResetPassword);

module.exports = router;
