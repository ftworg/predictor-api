const express = require("express");
const router = express.Router();
const fs = require("fs");
const auth = require("../middlewares/auth");
router.get("/", auth, async (req, res) => {
  if(global.ASSETS===undefined){
    await global.DB.getCachedAssets(req.tenant);
  }
  var jsonObj = global.ASSETS['branches'];
  const branches = Object.keys(jsonObj).map((value, index) => {
    return { key: index + 1, name: value };
  });
  res.send(branches);
});

module.exports = router;
