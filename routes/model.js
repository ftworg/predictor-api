const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

router.get("/", auth, async (req, res) => {
  let modelinfo = await global.DB.getGenericObject('ModelMetadata',{});
  // console.log(modelinfo);
  if (modelinfo["date"] instanceof String){
    modelinfo["date"] = JSON.parse(modelinfo["date"]);
  }
  let stamp = Math.floor(modelinfo["time"]);
  let time = new Date(stamp * 1000);
  res.send({
    "time": time,
    "lastEntryDate": modelinfo["date"],
    "version": modelinfo["ver"]
  });
});

module.exports = router;
