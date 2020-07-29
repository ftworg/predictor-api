const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const auth = require("../middlewares/auth");
const storageUtils = require("../cloud/bucketUtils");
const datastoreUtils = require("../cloud/datastoreUtils");
const { trimStart } = require("lodash");

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
  const filetypes = /xls|ms-excel/;

  const extName = filetypes.test(path.extname(file.originalname).toLowerCase());

  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extName) {
    return cb(null, true);
  } else {
    cb("Error: Only xls Files");
  }
}

const getTrainingDetails = (pipelineStatus) => {
  //curr status, time elapsed since last update, Status wise timestamp
  // const stages = ["Uninitialised","Migration Running","Data Migrated to BQ","Training","Models Deployed"];
  const uistages = ["Started","Pipeline Initiated","Training Started","Training Completed","Models Deployed"];
  // const progress = stages.indexOf(pipelineStatus["Status"]);
  // if(progress<0){
  //   throw new Error('Status undefined');
  // }
  const obj = {};
  const times = [];
  times.push(0);
  const tstrings = pipelineStatus["times"].split(',');
  let lastUpdateBefore = Math.floor(Date.now()/1000) - Number(tstrings[tstrings.length-1]);
  let unit = "seconds";
  if(Math.floor(lastUpdateBefore/86400)>=1){
    lastUpdateBefore = Math.floor(lastUpdateBefore/86400);
    unit = "days";
  }
  else if(Math.floor(lastUpdateBefore/3600)>=1){
    lastUpdateBefore = Math.floor(lastUpdateBefore/3600);
    unit = "hours";
  }
  else if (Math.floor(lastUpdateBefore/60)>=1){
    lastUpdateBefore = Math.floor(lastUpdateBefore/60);
    unit = "minutes";
  }
  let returnStages = [];
  for(let i=0;i<uistages.length;i++){
    returnStages.push({
      stage: uistages[i],
      time: i<tstrings.length ? Number(tstrings[i]) : undefined,
      status: i<tstrings.length ? 'Complete' : 'Incomplete'
    })
  }
  obj["stages"] = returnStages;
  obj["lastUpdateBefore"] = lastUpdateBefore+' '+unit;
  obj["replaceOption"] = pipelineStatus["REPL"];
  return obj;
}

router.get("/", auth, async (req, res) => {
  let uploadObj = await datastoreUtils.getUploadData('tenant001');
  uploadObj = JSON.parse(uploadObj["Data"])
  let nextUpload = moment(
    new Date(
      uploadObj.last_upload.years,
      uploadObj.last_upload.months,
      uploadObj.last_upload.date
    )
  ).add(1, "week");

  const currentDate = moment();

  let allowUpload = false;

  if (nextUpload.isSameOrBefore(currentDate)) allowUpload = true;

  nextUpload = nextUpload.toObject();
  const pipelineStatus = await datastoreUtils.getPipelineStatus('tenant001');
  const lastTrainingDetails = getTrainingDetails(pipelineStatus);
  res.send({
    allowUpload: allowUpload,
    nextUpload: `${nextUpload.date}/${nextUpload.months + 1}/${
      nextUpload.years
    }`,
    lastTrainingDetails,
    replaceOptions: ["Discard"]
  });
});

router.post("/", auth, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error");
    } else {
      datastoreUtils.updatePipelineStatus('tenant001',{
        "REPL": "Discard"
      }).then((succ)=>{
        storageUtils.uploadFileForTraining('tenant-001',req.file.path).then((result)=>{
          fs.unlinkSync(req.file.path);
        }).catch((err)=>{
          console.log(err.message);
          throw new Error(err);
        });
      });
      datastoreUtils.updateUploadData('tenant001').then((succ)=>{
        console.log("Updated upload");
      }).catch((err)=>{
        console.log(err);
      });
      res.send("Upload Success");
    }
  });
});

module.exports = router;
