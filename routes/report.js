const express = require("express");
const router = express.Router();
const createCsvWriter = require("csv-writer").createArrayCsvWriter;
const path = require("path");
const auth = require("../middlewares/auth");

router.post("/", auth, async (req, res) => {
  let fields = [];
  let keys = Object.keys(req.body[0]);
  keys.forEach((key) => {
    fields.push(key);
  });
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
  await csvWriter.writeRecords(csv);
  res.sendFile(path.resolve("./reports/report.csv"));
});

module.exports = router;
