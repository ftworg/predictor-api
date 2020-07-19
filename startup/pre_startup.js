const startupScript = async () => {
    global.ASSETS = {};
    const datastoreUtils = require('../cloud/datastoreUtils');
    const bucketUtils = require('../cloud/bucketUtils');
    const MM = await datastoreUtils.getModelMetadata('Tosai');
    await datastoreUtils.getCachedAssets('001');
    await bucketUtils.downloadAndExtractModels(MM.BucketName);
    // const { runPrediction } = require('../predictor/predictor');
    // const { getAllInputs } = require('../predictor/utils');
    const load_model = require('../predictor/predictor').check_for_models;
    await load_model();
    // const allInputs = getAllInputs();
    // const inputObj = {
    //     "criteria": 2, 
    //     "branch": allInputs.branches,
    //     "category": allInputs.category,
    //     "years": [
    //       {
    //         "year": 2020,
    //         "months": allInputs.months
    //       }
    //     ]
    // };
    // console.log(inputObj);
    // console.log(inputObj.years[0].months);
    // await runPrediction(inputObj);
}

module.exports = startupScript;