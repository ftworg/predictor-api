var tf = require("@tensorflow/tfjs-node");
var itemsObj = require("./items.json")
var redisUtils = require("./redisUtils")


var predict_revenue = async function(input){
    if(!global.revenue_model){
        global.revenue_model = await tf.loadLayersModel("file://revenue/model.json")
    }
    var input_tensor = tf.tensor([input]);
    var output = global.revenue_model.predict(input_tensor)
    return output.dataSync()[0]
}

var predict_quantity = async function(input){
    if(!global.quantity_model){
        global.quantity_model = await tf.loadLayersModel("file://quantity/model.json")
    }
    var input_tensor = tf.tensor([input]);
    var output = global.quantity_model.predict(input_tensor);
    var quantity =  output.dataSync();
    var out = [];
    for (let index = 0; index < quantity.length; index++) {
        if(quantity[index]>0){
            out.push(Math.floor(quantity[index])); 
        } 
        else{
            out.push(0);
        }      
    }
    var obj = {};
    for(var i=0;i<out.length;i++){
        obj[itemsObj[i]]=out[i]
    }
    return obj;
}

var composeInputs = function(inputJson){
    dates = inputJson.dates;
    months = inputJson.months;
    years = inputJson.years;
    branch = inputJson.branch;
    inputs = []
    if(dates.length===0){
        if(months.length===0){
            for(var i=1;i<13;i++){
                months.push(i);
            }
        }
        for(var i=1;i<31;i++){
            dates.push(i);
        }
    }
    for(var br=0;br<branch.length;br++){
        for(var i=0;i<months.length;i++){
            for(var j=0;j<dates.length;j++){
                for(var tod=1;tod<4;tod++){
                    inputs.push([years[0], months[i], dates[j], tod, branch[br], 0, 0])
                }
            }
        }
    }
    return inputs;
}

var agrregateOutput = function(outputs){
    keys = {}
    for(var i=0;i<outputs.length;i++){
        obj = outputs[i];
        objKeys = Object.keys(obj);
        for(var k=0;k<objKeys.length;k++){
            var currentKey = objKeys[k];
            var globalKeys = Object.keys(keys);
            if(globalKeys.indexOf(currentKey)<0){
                keys[currentKey]=obj[currentKey];
            }
            else{
                keys[currentKey] = keys[currentKey]+obj[currentKey];
            }
        }
    }
    return keys;
}

var runPrediction = async function(inputJson){
    inputs = composeInputs(inputJson);
    var model = inputJson.model;
    outputs = []
    for(var i=0;i<inputs.length;i++){
        var inputStr = inputs[i].join("-");
        var result = await redisUtils.getCachedResult(inputStr,model);
        if(result){
            outputs.push(result);
        }
        else{
            var out;
            if(model===0){
                global.PR = Date.now();
                result = await predict_revenue(inputs[i]);
                global.PR = Date.now() - global.PR; 
                out = {
                    "revenue": result
                };
            }
            else{
                global.PR = Date.now();
                result = await predict_quantity(inputs[i]);
                global.PR = Date.now() - global.PR; 
                out = result;
            }
            redisUtils.saveResult(inputStr,out,model)
            outputs.push(out);
        }
    }
    return agrregateOutput(outputs);
}

global.TIME = Date.now();
runPrediction({
    dates: [],
    months: [1],
    years: [2019],
    branch: [1],
    model: 1    //0 for revenue, 1 for quantity
}).then(function(e){
    console.log(e);
    console.log(global.PR);
    console.log(Date.now()-global.TIME);
});

// predict_quantity([2019,1,29,1,9,0,0]).then(function(e){
//     console.log(e);
// })
// predict_revenue([2019,12,25,3,8,0,0]).then(function(e){
//     console.log(e);
// })