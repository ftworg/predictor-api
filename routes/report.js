const express = require("express");
const router = express.Router();
const createCsvWriter = require("csv-writer").createArrayCsvWriter;
const path = require("path");
const auth = require("../middlewares/auth");
const fs = require('fs');
const ffmetadata = require('ffmetadata');

router.post("/", async (req, res) => {
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
    path: "/tmp/report.csv",
  });
  await csvWriter.writeRecords(csv);
  res.sendFile(path.resolve("/tmp/report.csv"));
});

module.exports = router;
