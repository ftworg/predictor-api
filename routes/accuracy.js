const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const Joi = require("@hapi/joi");
const auth = require("../middlewares/auth");
// const accuracy = require("/tmp/tenant-001/assets/accuracy.json");
const accuracy = global.ASSETS['001']['accuracy'];
const items2cat = global.ASSETS['001']['item2cat'];

router.get("/", auth, async (req, res) => {
  // let result = {};
  // if (!result) {
  //   return res.status(500).send("Unable to process. Kindly verify the inputs.");
  // }
  // let acc_keys = Object.keys(accuracy);
  // let non_zeros = [];
  // let zeros = [];
  // let acc = [];
  // let resultAccuracy = [];
  // let percs = [];
  // let sum_reducer = (acc,val) => acc+val;
  // for (let i = 0; i < acc_keys.length; i++) {
  //   if(accuracy[acc_keys[i]]["non_zeros"]!=0){
  //     non_zeros.push(accuracy[acc_keys[i]]["non_zeros"]*accuracy[acc_keys[i]]["nz_perc"]);
  //     zeros.push(accuracy[acc_keys[i]]["zeros"]*accuracy[acc_keys[i]]["nz_perc"]);
  //     acc.push(accuracy[acc_keys[i]]["accuracy"]*accuracy[acc_keys[i]]["nz_perc"]);
  //     percs.push(accuracy[acc_keys[i]]["nz_perc"]);
  //   }

  //   resultAccuracy.push({
  //     non_zeros: accuracy[acc_keys[i]]["non_zeros"].toFixed(2),
  //     zeros: accuracy[acc_keys[i]]["zeros"].toFixed(2),
  //     accuracy: accuracy[acc_keys[i]]["accuracy"].toFixed(2),
  //     nz_perc: accuracy[acc_keys[i]]["nz_perc"].toFixed(2),
  //     name: acc_keys[i],
  //     super_category: items2cat[acc_keys[i]].super,
  //     sub_category: items2cat[acc_keys[i]].sub,
  //     key: i,
  //     diff: accuracy[acc_keys[i]]["diff"]
  //   });
  // }
  // console.log(resultAccuracy.length);
  // console.log(non_zeros.length);
  // result["non_zeros"] = non_zeros.reduce(sum_reducer)/percs.reduce(sum_reducer);
  // result["zeros"] = zeros.reduce(sum_reducer)/percs.reduce(sum_reducer);
  // result["accuracy"] = acc.reduce(sum_reducer)/percs.reduce(sum_reducer);
  // result["items"] = resultAccuracy;
  res.send(accuracy);
});

module.exports = router;
