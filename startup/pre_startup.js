const { runPrediction } = require('../predictor/predictor');
const { getAllInputs } = require('../predictor/utils');
const load_model = require('../predictor/predictor').check_for_models;
const datastoreUtils = require('../cloud/datastoreUtils');
const bucketUtils = require('../cloud/bucketUtils');

const startupScript = async () => {
    const MM = await datastoreUtils.getModelMetadata('Tosai');
    await bucketUtils.downloadAssetsFromBucket(MM.BucketName);
    await bucketUtils.downloadAndExtractModels(MM.BucketName);
    await load_model();
    const allInputs = getAllInputs();
    const inputObj = {
        "criteria": 2, 
        "branch": allInputs.branches,
        "category": allInputs.category,
        "years": [
          {
            "year": 2020,
            "months": allInputs.months
          }
        ]
    };
    console.log(inputObj);
    console.log(inputObj.years[0].months)
    // await runPrediction(inputObj);
}

module.exports = startupScript;