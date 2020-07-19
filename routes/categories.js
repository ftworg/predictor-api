const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const auth = require("../middlewares/auth");
const categories = global.ASSETS['001']['cat2item'];

router.get("/", auth, async (req, res) => {
  let result = [];
  if (!categories) {
    return res.status(500).send("Unable to process. Kindly verify the inputs.");
  }
  Object.keys(categories).map((superCat, superIdx) => {
    const childrenCat = [];

    Object.keys(categories[superCat]).map((subCat, subIndx) => {
      childrenCat.push({
        title: subCat,
        value: `0-${superIdx}-${subIndx}`,
        key: `0-${superIdx}-${subIndx}`,
      });
    });

    result.push({
      title: superCat,
      value: `0-${superIdx}`,
      key: `0-${superIdx}`,
      children: childrenCat,
    });
  });
  res.send(result);
});

module.exports = router;
