const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

router.get("/", auth, async (req, res) => {
  let modelinfo = await global.DB.getGenericObject('ModelMetadata',
  {
    "Tenant": req.tenant
  });
  let stamp = Math.floor(modelinfo["time"]);
  let time = new Date(stamp * 1000);
  res.send({
    "time": time,
    "lastEntryDate": JSON.parse(modelinfo["date"]),
    "version": modelinfo["ver"]
  });
});

module.exports = router;
