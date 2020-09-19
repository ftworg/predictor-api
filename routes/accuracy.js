const express = require("express");
const router = express.Router();
const Joi = require("@hapi/joi");
const auth = require("../middlewares/auth");

router.get("/", auth, async (req, res) => {
  if(global.ASSETS===undefined){
    await global.DB.getCachedAssets(req.tenant);
  }
  const accuracy = global.ASSETS['accuracy'];
  res.send(accuracy);
});

module.exports = router;
