const express = require("express");
const router = express.Router();
const fs = require("fs");
const auth = require("../middlewares/auth");
var jsonObj = global.ASSETS['001']['branches'];

const branches = Object.keys(jsonObj).map((value, index) => {
  return { key: index + 1, name: value };
});

router.get("/", auth, (req, res) => {
  res.send(branches);
});

module.exports = router;
