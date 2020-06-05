const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const Joi = require("@hapi/joi");
const auth = require("../middlewares/auth");
const accuracy = require("../predictor/assets/accuracy.json");
const average = require("array-average");
const items2cat = require('../predictor/assets/item2cat.json');
const modelinfo = require('../predictor/assets/models.json');

router.get("/", async (req, res) => {
  let stamp = Math.floor(modelinfo["time"]);
  let time = new Date(stamp*1000);
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