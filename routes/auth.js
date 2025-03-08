const express = require("express");
const { register, login, loginAdmin } = require("../controller/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin", loginAdmin);

module.exports = router;
