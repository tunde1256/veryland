const express = require("express");
const { listProperty, getAllProperties, getPropertyDetails, deleteProperty,searchProperties,getRandomProperties } = require("../controller/propertyController");
const upload = require("../middlewares/upload");

const router = express.Router();

router.post("/:sellerId",
    upload.fields([
        { name: 'images', maxCount: 5 },    // Handle image files under 'images'
        { name: 'documents', maxCount: 5 }  // Handle document files under 'documents'
      ]),
    listProperty
  );
  
  router.get("/", getAllProperties);
router.get("/:id", getPropertyDetails);
router.delete("/:id", deleteProperty);
router.get("/property/search", searchProperties);
router.get("/random/random", getRandomProperties);


module.exports = router;
