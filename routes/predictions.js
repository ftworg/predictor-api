const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const Joi = require("@hapi/joi");
const auth = require("../middlewares/auth");
const { runPrediction } = require("../predictor/predictor");
const storageUtils = require("../cloud/bucketUtils");
const fs = require("fs");

const getDashboardCache = async (tenant,body) => {
  const year = body.years[0].year;
  const month = body.years[0].months[0].month;
  const date = body.years[0].months[0].dates[0];
  const cache = await storageUtils.downloadGenericFile(tenant+'-store','cache','Cache-'+year+'-'+month+'-'+date+'.json');
  if(cache["notFound"]===true){
    return {
      "notCached": true
    }
  }
  else{
    let jsonData = require('/tmp/'+tenant+'-store/cache/Cache-'+year+'-'+month+'-'+date+'.json');
    return jsonData;
  }
}

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.message);

  let input = req.body;
  input.model = 1;
  try{
    let result;
    let notCached = false;
    const yrlength = req.body.years.length;
    const mlength = req.body.years[0].months.length;
    const dlength = req.body.years[0].months[0].dates.length;
    if(yrlength===1 && mlength===1 && dlength===1){
      console.log("Getting cached");
      result = await getDashboardCache(req.tenant,input);
      if(result["notCached"]===true){
        notCached=true;
      }
    }
    if((yrlength!==1 || mlength!==1 || dlength!==1) ||  notCached===true){
      console.log("Not cached")
      result = await runPrediction(req.tenant,input);
    }
    if(notCached===true){
      console.log("Updating Cache")
      const year = req.body.years[0].year;
      const month = req.body.years[0].months[0].month;
      const date = req.body.years[0].months[0].dates[0];
      fs.writeFile("/tmp/"+req.tenant+"-store/"+'cache/Cache-'+year+'-'+month+'-'+date+'.json', JSON.stringify(result), (err) => {
        if (err) throw err;
        console.log('Data written to file');
      });
      await storageUtils.uploadGenericFile(req.tenant+'-store','cache/Cache-'+year+'-'+month+'-'+date+'.json');
    }
    res.send(result);
  }catch(e){
    console.log(e);
    res.status(400).send(e.message);
  }
});

function validate(req) {
  const schema = Joi.object({
    criteria: Joi.number().integer().min(0).max(2),
    category: Joi.array().items(
      Joi.object({
        super: Joi.string(),
        sub: Joi.array().items(Joi.string()),
      })
    ),
    branch: Joi.array().items(Joi.number().integer().min(0).max(9)),
    years: Joi.array().items(
      Joi.object({
        year: Joi.number().integer().min(2019).max(2020),
        months: Joi.array().items(
          Joi.object({
            month: Joi.number().integer().min(1).max(12),
            dates: Joi.array().items(Joi.number().integer().min(1).max(31)),
          })
        ),
      })
    ),
  });

  return schema.validate(req);
}

module.exports = router;
