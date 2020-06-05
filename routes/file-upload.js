const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const auth = require("../middlewares/auth");
if (!fs.existsSync('/tmp/upload.json')) {
  let dt = new Date(Date.now());
  dt.setDate(dt.getDate()-10);
  fs.writeFileSync(
    "/tmp/upload.json",
    JSON.stringify({
      last_upload: moment(dt).toObject(),
    })
  );
}

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

router.get("/", (req, res) => {
  const uploadString = fs.readFileSync("/tmp/upload.json", "utf-8");
  const uploadObj = JSON.parse(uploadString);

  const nextUpload = moment(
    new Date(
      uploadObj.last_upload.years,
      uploadObj.last_upload.months,
      uploadObj.last_upload.date
    )
  )
    .add(1, "week")
    .toObject();

  const currentDate = moment().toObject();

  let allowUpload = false;

  if (
    nextUpload.years <= currentDate.years &&
    nextUpload.months <= currentDate.months &&
    nextUpload.date <= currentDate.date
  )
    allowUpload = true;

  res.send({
    allowUpload: allowUpload,
    nextUpload: `${nextUpload.date}/${nextUpload.months}/${nextUpload.years}`,
  });
});

router.post("/", (req, res) => {
  console.log(req);
  upload(req, res, (err) => {
    if (err) {
      res.status(500).send("Server Error");
    } else {
      // fs.unlinkSync(req.file.path);
      fs.writeFileSync(
        "/tmp/upload.json",
        JSON.stringify({
          last_upload: moment(Date.now()).toObject(),
        })
      );
      res.send("Upload Success");
    }
  });
});

module.exports = router;
