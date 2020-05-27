const express = require("express");
const router = express.Router();
const fs = require("fs");
const auth = require("../middlewares/auth");

const jsonString = fs.readFileSync("predictor/assets/branches.json", "utf-8");

const jsonObj = JSON.parse(jsonString);

const branches = Object.keys(jsonObj).map((value, index) => {
  return { key: index + 1, name: value };
});

router.get("/", auth, (req, res) => {
  res.send(branches);
});

module.exports = router;
