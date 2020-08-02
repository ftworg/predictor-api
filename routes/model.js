const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const auth = require("../middlewares/auth");
// const modelinfo = global.ASSETS['001']['models'];
const datastoreUtils = require("../cloud/datastoreUtils");

router.get("/", auth, async (req, res) => {
  let modelinfo = await datastoreUtils.getGenericObject('tenant001','ModelMetadata',{
    "Tenant": 'tenant001'
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
