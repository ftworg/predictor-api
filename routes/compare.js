const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const auth = require("../middlewares/auth");
const path = require("path");
const Joi = require("@hapi/joi");
const compareUtils = require("../compare/compareUtils");

router.post("/fly/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.message);

  let input = req.body;
  try {
    let result = await compareUtils.getComparison(input);
    res.send(result);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

const storage = multer.diskStorage({
  destination: "/tmp/",
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("file");

function checkFileType(file, cb) {
  const filetypes = /csv|octet-stream/;

  const extName = filetypes.test(path.extname(file.originalname).toLowerCase());
  console.log(file);

  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extName) {
    return cb(null, true);
  } else {
    cb("Error: Only csv Files");
  }
}

router.post("/custom/", auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error");
    } else {
      let csv_data = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          console.log(row);
          csv_data.push(row);
        })
        .on("end", async () => {
          console.log("CSV file successfully processed");
          fs.unlinkSync(req.file.path);
          try {
            let result = await compareUtils.compareWithUploaded(csv_data);
            res.send(result);
          } catch (e) {
            res.status(400).send(e.message);
          }
        });
    }
  });
});

function validate(req) {
  const schema = Joi.object({
    criteria: Joi.number().integer().min(0).max(2),
    category: Joi.array().items(
      Joi.object({
        super: Joi.string(),
        sub: Joi.array().items(Joi.string()),
      })
    ),
    branch: Joi.array().items(Joi.number().integer().min(0).max(9)),
    years: Joi.array().items(
      Joi.object({
        year: Joi.number().integer().min(2019).max(2020),
        months: Joi.array().items(
          Joi.object({
            month: Joi.number().integer().min(1).max(12),
            dates: Joi.array().items(Joi.number().integer().min(1).max(31)),
          })
        ),
      })
    ),
  });
  return schema.validate(req);
}

module.exports = router;
