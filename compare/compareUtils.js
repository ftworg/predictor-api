var item2Key = require('../predictor/assets/items.json');
var items2cat = require('../predictor/assets/item2cat.json');
var gcpUtils = require("../predictor/gcpUtils");
var predictor = require("../predictor/predictor.js");
var branchObj = require("../predictor/assets/branches.json");

let getActuals = (objs) => {
    let out ={};
    objs.forEach((obj) => {
        let prod = obj.product;
        let iobjs = obj.objs;
        iobjs.forEach((iobj) => {
            if(iobj.output===undefined){
                throw new Error("Given date does not have valid sales data");
            }
            let joined_input = iobj.input.join('-');
            if(out[joined_input]===undefined){
                out[joined_input] = {};
            }
            out[joined_input][prod] = iobj.output;
        });
    });
    let out_keys = Object.keys(out);
    let fin=[]
    out_keys.forEach((key) => {
        fin.push(out[key]);
    });
    return fin;
}

let cleanActuals = (objs) => {
    let cleaned_inp = [];
    objs.forEach((obj) => {
        let prod_level = [];
        let new_prod = JSON.parse(JSON.stringify(obj));
        for(let i=0;i<obj.objs.length;i++){
            let iobj = JSON.parse(JSON.stringify(obj.objs[i]));
            if(i!==0){
                delete iobj.seq_inp;
            }
            delete iobj.output;
            prod_level.push(iobj);
        }
        new_prod.objs = prod_level;
        cleaned_inp.push(new_prod);
    });
    return cleaned_inp;
}

let packageIO = (inputs,outputs,actuals) => {
    let new_Out = [];
    let rev = JSON.parse(JSON.stringify(outputs.revenue));
    let quan = JSON.parse(JSON.stringify(outputs.quantity));
    let act_rev = JSON.parse(JSON.stringify(actuals.revenue));
    let act_quan = JSON.parse(JSON.stringify(actuals.quantity));
    let dates = Object.keys(quan);
    let items = Object.keys(quan[dates[0]]);
    for(let j=0;j<items.length;j++){
        let new_item={}
        new_item["key"] = item2Key[items[j]];
        new_item["name"] = items[j];
        new_item["super_category"] = items2cat[items[j]].super;
        new_item["sub_category"] = items2cat[items[j]].sub;
        new_item["quantity"] = 0;
        new_item["revenue"] = 0;
        new_item["actual_quantity"] = 0;
        new_item["actual_revenue"] = 0;
        for(let date_ind=0;date_ind<dates.length;date_ind++){
            new_item["quantity"] += quan[dates[date_ind]][items[j]],
            new_item["revenue"] += rev[dates[date_ind]][items[j]],
            new_item["actual_quantity"] += act_quan[dates[date_ind]][items[j]],
            new_item["actual_revenue"] += act_rev[dates[date_ind]][items[j]]
        }
        new_item["quantity_accuracy"] = (new_item["quantity"]/new_item["actual_quantity"])*100;
        new_item["quantity_error"] = Math.abs(new_item["quantity"]-new_item["actual_quantity"]);
        new_item["revenue_accuracy"] = (new_item["revenue"]/new_item["actual_revenue"])*100;
        new_item["revenue_error"] = Math.abs(new_item["revenue"]-new_item["actual_revenue"]);
        new_Out.push(new_item);
    }
    return new_Out; 
}

let parseFileData = (data) => {
    let aggregatedActuals = {};
    let branches = [];
    let products = [];
    let months = {};
    let criteria;
    let keys = Object.keys(data[0]);
    for(let ind=0;ind<keys.length;ind++){
        let key = keys[ind];
        if(key.split('-').length>1){
            if(key.split(':').length>1){
                criteria = 2;
            }
            else if(key.split('-').length===2){
                criteria = 1;
            }
            else{
                criteria = 0;
            }
            break;
        }
    }
    keys.forEach((key)=>{
        if(key.split('-').length>1){
            if(months[key.split('-')[1]]===undefined){
                months[key.split('-')[1]]=[];
            }
            if(key.split('-').length>2){
                months[key.split('-')[1]].push(key.split('-')[2]);
            }
        }
    });
    data.forEach((obj)=>{
        let brind = branchObj[obj.branch];
        if(branches.indexOf(brind)<0){
            branches.push(brind);
        }
        let prind = Number(obj.key);
        if(products.indexOf(prind)<0){
            products.push(prind);
        }
        let objKeys = Object.keys(obj);
        objKeys.forEach((key)=>{
            if(key.split('-').length>1){
                if(aggregatedActuals[key]===undefined){
                    aggregatedActuals[key]={};
                }
                aggregatedActuals[key][obj.name] = Number(obj[key]);
            }
        });
    });
    let inputJson = {
        "criteria": criteria,
        "branch": branches,
        "products": products,
        "years":[
            {
                "year": 2020,
                "months": []
            }
        ]
    };
    let mts = Object.keys(months);
    mts.forEach((mt)=>{
        inputJson.years[0].months.push({
            "month": mt,
            "dates": months[mt]
        });
    });
    return [aggregatedActuals,inputJson];
}

let compareWithUploaded = async (data) => {
    [aggregatedActuals,inputJson] = parseFileData(data);
    console.log(aggregatedActuals);
    console.log(inputJson);
    console.log(inputJson.years[0].months[0]);
}

let getComparison = async (inputJson) => {
    predictor.initializeCounts();
    let branches = inputJson.branch;
    let products = predictor.getProductSet(inputJson.category);
    let result;
    let outputs;
    let outputResObject = {};
    let inputs;
    for(let branch=0;branch<branches.length;branch++){
        inputJson.branch = [branches[branch]];
        inputs = await predictor.composeInputs(inputJson);
        //Getting existing records
        let gcpOutput = await gcpUtils.fetchExistingRecords(inputs,products);
        // console.log(gcpOutput);
        let actuals = getActuals(gcpOutput[0]);
        let inputsForPrediction = cleanActuals(gcpOutput[0]);
        gcpOutput[0] = inputsForPrediction;
        result = await predictor.predict_values(inputs,gcpOutput,false);
        result = predictor.agrregateOutput(inputs,result,inputJson.criteria);
        actuals = predictor.agrregateOutput(inputs,actuals,inputJson.criteria);
        outputs = predictor.addRevenue(result, inputs);
        act_outs = predictor.addRevenue(actuals, inputs);
        let finalOut = packageIO(inputs,outputs,act_outs);
        outputResObject[branches[branch]] = finalOut;
    }
    outputResObject = predictor.addSpecialDays(inputs,outputResObject);
    outputResObject = predictor.addCounts(outputResObject);
    return outputResObject;
}


module.exports = {
    getComparison,
    compareWithUploaded
};