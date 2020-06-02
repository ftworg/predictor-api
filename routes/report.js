const express = require("express");
const router = express.Router();
const createCsvWriter = require("csv-writer").createArrayCsvWriter;
const path = require("path");
const auth = require("../middlewares/auth");
const fs = require('fs');

router.post("/", auth, async (req, res) => {
  let fields = [];
  let keys = Object.keys(req.body[0]);
  keys.forEach((key) => {
    fields.push(key);
  });
  let csv = [];
  req.body.forEach((obj) => {
    let temp = [];
    fields.forEach((field) => {
      temp.push(obj[field]);
    });
    csv.push(temp);
  });
  const csvWriter = createCsvWriter({
    header: fields,
    path: "./reports/report.csv",
  });
  if (!fs.existsSync('./reports')){
      fs.mkdirSync('./reports');
  }
  await csvWriter.writeRecords(csv);
  res.sendFile(path.resolve("./reports/report.csv"));
});

module.exports = router;
