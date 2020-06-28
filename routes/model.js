const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const auth = require("../middlewares/auth");
const modelinfo = require("../predictor/assets/models.json");

router.get("/", auth, async (req, res) => {
  let stamp = Math.floor(modelinfo["time"]);
  let time = new Date(stamp * 1000);
  //   res.send({
  //       "date": time.getDate(),
  //       "month": time.getMonth(),
  //       "year": time.getFullYear(),
  //       "hours": time.getHours(),
  //       "minutes": time.getMinutes(),
  //       "seconds": time.getSeconds()
  //   });
  res.send(time);
});

module.exports = router;
