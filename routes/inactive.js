const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const auth = require("../middlewares/auth");
const dataStoreUtils = require("../cloud/datastoreUtils");
const datastoreUtils = require("../cloud/datastoreUtils");

const getDates = (inputs) => {
    years = {};
    inputs.forEach(element => {
        let inps = element.split('-');
        // inps = inps.map(Number);
        if(Object.keys(years).indexOf(inps[0])<0){
            years[inps[0]]={};
        }
        if(Object.keys(years[inps[0]]).indexOf(inps[1])<0){
            years[inps[0]][inps[1]]=[];
        }
        if(years[inps[0]][inps[1]].indexOf(inps[2])<0){
            years[inps[0]][inps[1]].push(inps[2]);
        }
    });
    return years;
}

router.get("/", auth, async (req, res) => {
  let period = await datastoreUtils.getCachedInactivePeriod('001');
  period = period["inputs"];
  let dates = getDates(period);
  res.send(dates);
});

module.exports = router;
