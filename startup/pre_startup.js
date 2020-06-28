const { runPrediction } = require('../predictor/predictor');
const { getAllInputs } = require('../predictor/utils');
const load_model = require('../predictor/predictor').check_for_models;

const startupScript = async () => {
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