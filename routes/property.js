const express = require("express");
const { listProperty, getAllProperties, getPropertyDetails, deleteProperty,searchProperties } = require("../controller/propertyController");
const upload = require("../middlewares/upload");

const router = express.Router();

router.post("/", upload.array('images', 5), listProperty);
router.get("/", getAllProperties);
router.get("/:id", getPropertyDetails);
router.delete("/:id", deleteProperty);
router.get("/property/search", searchProperties);


module.exports = router;
