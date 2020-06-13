const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const Joi = require("@hapi/joi");
const auth = require("../middlewares/auth");
const accuracy = require("../predictor/assets/accuracy.json");
const average = require("array-average");
const items2cat = require("../predictor/assets/item2cat.json");

router.get("/", auth, async (req, res) => {
  let result = {};
  if (!result) {
    return res.status(500).send("Unable to process. Kindly verify the inputs.");
  }
  let acc_keys = Object.keys(accuracy);
  let non_zeros = [];
  let zeros = [];
  let acc = [];
  let resultAccuracy = [];
  for (let i = 0; i < acc_keys.length; i++) {
    non_zeros.push(accuracy[acc_keys[i]]["non_zeros"]);
    zeros.push(accuracy[acc_keys[i]]["zeros"]);
    acc.push(accuracy[acc_keys[i]]["accuracy"]);

    resultAccuracy.push({
      non_zeros: accuracy[acc_keys[i]]["non_zeros"].toFixed(2),
      zeros: accuracy[acc_keys[i]]["zeros"].toFixed(2),
      accuracy: accuracy[acc_keys[i]]["accuracy"].toFixed(2),
      nz_perc: accuracy[acc_keys[i]]["nz_perc"].toFixed(2),
      name: acc_keys[i],
      super_category: items2cat[acc_keys[i]].super,
      sub_category: items2cat[acc_keys[i]].sub,
      key: i,
    });
  }
  result["non_zeros"] = average(non_zeros);
  result["zeros"] = average(zeros);
  result["accuracy"] = average(acc);
  result["items"] = resultAccuracy;
  res.send(result);
});

module.exports = router;
