var tf = require("@tensorflow/tfjs-node");
var itemsObj = require("./assets/rev_items.json");
var normObj = require('./assets/norm.json');
var pricesObj = require('./assets/prices.json');
var modelObj = require('./assets/models.json');
var item2Key = require('./assets/items.json');
var holObj = require('./assets/holidays.json');
var cat2items = require('./assets/cat2item.json');
var items2cat = require('./assets/item2cat.json');
var branchesObj = require('./assets/branches.json');
const { isPublicHoliday, isWeekend, months, range } = require("./utils");
const fs = require('fs');
var utils = require("./utils");
var gcpUtils = require("./gcpUtils");

let id2branch = {};
Object.keys(branchesObj).forEach((branch) => {
  id2branch[branchesObj[branch]] = branch;
});

let check_for_models = async () => {
  if (!global.models) {
    global.MODEL_CONFIG = modelObj;
    models=[];
    for(let i=modelObj["START"];i<modelObj["END"];i++){
      let t =  Date.now();
      model = await tf.loadLayersModel(
        "file://predictor/models/model_"+String(i+1)+"/model.json"
      );
      models.push(model);
    }
    global.models = models;
    //console.log("Models loaded! ")
  }
}

var feedToModel = async (input,inp_sequence,prod_ind) => {
  ////console.log("new prediction");
  //console.log(input,inp_sequence,prod_ind)
  await check_for_models();
  global.PREDICTIONS = global.PREDICTIONS + 1;
  let seq_inp_tensor = tf.tensor([inp_sequence]);
  seq_inp_tensor = tf.expandDims(seq_inp_tensor,axis=-1);
  var context_tensors = [];
  for(let i=3;i<input.length;i++){
    context_tensors.push(tf.tensor([input[i]]))
  }
  var output = await global.models[prod_ind].predict([seq_inp_tensor,
    context_tensors[0],
    context_tensors[1],
    context_tensors[2],
    context_tensors[3]]);
  var quantity = output.dataSync();
  return Math.floor(quantity[0]*100);
}

var predict_values = async function(raw_inputs,gcpOutput,updateNewBool){
  let records = gcpOutput[0];
  let requestLevelCache = gcpOutput[1].records;
  let outputobjs={};
  let inputMaps = {};
  for(let record_ind=0;record_ind<records.length;record_ind++){
    let record = records[record_ind];
    let product = record.product;
    let prod_ind = record.index;
    //console.log(product);
    for(let inp_obj_ind=0;inp_obj_ind<record.objs.length;inp_obj_ind++){
      let inputObj = record.objs[inp_obj_ind];
      //console.log(inputObj);
      let joined_input = inputObj.input.join('-');
      if(inputObj.output===undefined){
        if(inputObj.seq_inp===undefined){
          let prev_inpObj = record.objs[inp_obj_ind-1];
          let new_seq_inp = prev_inpObj.seq_inp.slice(1,prev_inpObj.seq_inp.length)
          new_seq_inp.push(prev_inpObj.output);
          inputObj["seq_inp"]=new_seq_inp;
        }
        inputObj["output"]= await feedToModel(inputObj.input,inputObj.seq_inp,prod_ind);
        // console.log(inputObj);
      }
      //console.log(inputObj);
      if(inputObj.output!==undefined && inputObj.actual){
        if(outputobjs[joined_input]!==undefined){
          outputobjs[joined_input][product]=inputObj.output;
        }
        else{
          outputobjs[joined_input]={};
          outputobjs[joined_input][product]=inputObj.output
        }
      }
      // console.log("Sales cache");
      // console.log(Object.keys(requestLevelSalesCache));
      // console.log("Sequence cache");
      // console.log(Object.keys(requestLevelSequenceCache));
      //Create new sales cache entry
      if(requestLevelCache[joined_input]===undefined || requestLevelCache[joined_input][product]===undefined){
        if(inputMaps[joined_input]===undefined){
          inputMaps[joined_input]={};
        }
        inputMaps[joined_input][product]={
          "input": inputObj.seq_inp,
          "output": inputObj.output
        };
      }
    }
  }
  // console.log(inputMaps);
  if(updateNewBool){
    console.log("Updating");
    await gcpUtils.updateProductEntries(inputMaps);
  }
  //Arrange for aggregation
  let outs=[]
  for(let i=0;i<raw_inputs.length;i++){
    let out = outputobjs[raw_inputs[i].join('-')]
    outs.push(out);
  }
  return outs;
}

var composeInputs = async function(input) {
  for (let i = 0; i < input.years.length; i++) {
    const year = input.years[i];

    if (year.months.length === 0) {
      for (let y = 1; y <= 12; y++) {
        year.months.push({
          month: y,
          dates: range(1, months[y].days + 1, 1)
        });
      }
    }

    for (let m = 0; m < year.months.length; m++) {
      const month = year.months[m];
      if (month.dates.length === 0) {
        month.dates = range(1, months[month.month].days + 1, 1);
      }
    }
  }

  let inputs = [];

  for (var br = 0; br < input.branch.length; br++) {
    const branch = input.branch[0];
    for (let yr = 0; yr < input.years.length; yr++) {
      const year = input.years[yr];
      for (var i = 0; i < year.months.length; i++) {
        const month = year.months[i];
        for (var j = 0; j < month.dates.length; j++) {
          const date = month.dates[j];
          for (var tod = 1; tod < 4; tod++) {
            let isPHoliday = isPublicHoliday(year.year,month.month,date);
            let isWeekEnd = isWeekend(date, month.month-1, year.year);
            inputs.push([
              year.year,
              month.month,
              date,
              tod,
              branch,
              isWeekEnd,
              isPHoliday
            ]);
          }
        }
      }
    }
  }
  return inputs;
};

var transformTOD = (input) => {
  let curr_key;
  let date = input.slice(0,3).join('-');
  if(input[3]===0){
    curr_key = date+"\n[00:00 - 06:00]"
  }
  else if(input[3]===1){
    curr_key = date+"\n[06:00 - 12:00]"
  }
  else if(input[3]===2){
    curr_key = date+"\n[12:00 - 18:00]"
  }
  else if(input[3]===3){
    curr_key = date+"\n[18:00 - 24:00]"
  }
  return curr_key;
}

var agrregateOutput = function(inputs,outputs,criteria) {
  let finalOutput = {};
  let inp_ind = 3;
  if(criteria==1){
    inp_ind = 2;
  }
  if(criteria==2){
    inp_ind = 4;
  }
  let finOut_keys;
  let curr_key;
  for(let i=0;i<inputs.length;i++){
    curr_key = inputs[i].slice(0,inp_ind).join('-');
    if(finalOutput[curr_key]!==undefined){
      finOut_keys=Object.keys(finalOutput[curr_key]);
      for(let j=0;j<finOut_keys.length;j++){
        finalOutput[curr_key][finOut_keys[j]]+=outputs[i][finOut_keys[j]];
      }
    }
    else{
      if(inp_ind===4){
        curr_key = transformTOD(inputs[i]);
      }
      finalOutput[curr_key]=outputs[i];
    }
  }
  let finalOut_keys = Object.keys(finalOutput);
  if(finalOut_keys.length>1){
    let sum = {};
    for(let i=0;i<finalOut_keys.length;i++){
      let currRes = finalOutput[finalOut_keys[i]];
      let currKeys = Object.keys(currRes);
      //console.log(currKeys.length);
      for(let j=0;j<currKeys.length;j++){
        if(sum[currKeys[j]]!==undefined){
          sum[currKeys[j]]+=finalOutput[finalOut_keys[i]][currKeys[j]];
        }
        else{
          sum[currKeys[j]]=finalOutput[finalOut_keys[i]][currKeys[j]];
        }
      }
    }
    finalOutput["total"]=sum;
  }
  return finalOutput;
}

var addSpecialDays = (inputs, new_Out) => {
  new_Out["holidays"]=[];
  new_Out["weekdays"]={}
  for(let i=0;i<inputs.length;i++){
    let currdate = inputs[i].slice(0,3);
    let inp_keys = Object.keys(new_Out.weekdays);
    if(inp_keys.indexOf(currdate.join('-'))<0){
      if(inputs[i][5]==5 || inputs[i][5]==6){
        new_Out.weekdays[currdate.join('-')] = inputs[i][5];
      }
    }
    if(new_Out["holidays"].indexOf(currdate.join('-'))<0){
      let day_list = holObj[String(inputs[i][1])];
      for(let j=0;j<day_list.length;j++){
        if(inputs[i][2]==Number(day_list[j])){
          new_Out.holidays.push(currdate.join('-'));
        }
      }
    }
  }
  return new_Out;
}

var packageIO = function(inputs,outputs) {
  let new_Out = [];
  let rev = JSON.parse(JSON.stringify(outputs.revenue));
  let quan = JSON.parse(JSON.stringify(outputs.quantity));
  let dates = Object.keys(quan);
  let items = Object.keys(quan[dates[0]]);
  for(let j=0;j<items.length;j++){
    let new_item={}
    new_item["key"] = item2Key[items[j]];
    new_item["name"] = items[j];
    new_item["super_category"] = items2cat[items[j]].super;
    new_item["sub_category"] = items2cat[items[j]].sub;
    new_item["predicion"] = {};
    for(let date_ind=0;date_ind<dates.length;date_ind++){
      new_item.predicion[dates[date_ind]]={
        "quantity": quan[dates[date_ind]][items[j]],
        "revenue": rev[dates[date_ind]][items[j]]
      }
    }
    new_Out.push(new_item);
  }
  return new_Out; 
}

var getProductSet = (catObj) => {
  let products=[]
  for(let i=0;i<catObj.length;i++){
    let sup = catObj[i]["super"];
    let subs = catObj[i]["sub"];
    for(let j=0;j<subs.length;j++){
      for(let k=0;k<cat2items[sup][subs[j]].length;k++){
        products.push(cat2items[sup][subs[j]][k]);
      }
    }
  }
  let inds = [];
  for(let i=0;i<products.length;i++){
    if(item2Key[products[i]]){
      inds.push(item2Key[products[i]]);
    }
  }
  //console.log(inds);
  return inds;
}

var initializeCounts = () => {
  global.PREDICTIONS = 0;
  global.READS = 0;
  global.WRITES = 0;
}

var addCounts = (obj) => {
  obj["predictions"] = global.PREDICTIONS;
  obj["reads"] = global.READS;
  obj["writes"] = global.WRITES;
  return obj;
}

var addInsights = (inputs,obj) => {
  obj.insights = [];
  inputs.forEach((input)=>{
    obj.insights.push({
      "key": inputs.indexOf(input),
      "year": input[0],
      "month": input[1],
      "date": input[2],
      "tod": input[3],
      "branch": input[4],
      "weekday": input[5],
      "isPublicHoliday": input[6]
    });
  });
  return obj;
}

var runPrediction = async function(inputJson) {
  initializeCounts();
  let branches = inputJson.branch;
  let products = getProductSet(inputJson.category);
  let result;
  let outputs;
  let outputResObject = {
    "branches": []
  };
  let inputs;
  for(let branch=0;branch<branches.length;branch++){
    inputJson.branch = [branches[branch]];
    inputs = await composeInputs(inputJson);
    //Getting existing records
    let gcpOutput = await gcpUtils.fetchExistingRecords(inputs,products);
    // console.log(gcpOutput);
    result = await predict_values(inputs,gcpOutput,true);
    result = agrregateOutput(inputs,result,inputJson.criteria);
    outputs = addRevenue(result, inputs);
    // console.log(outputs);
    let finalOut = packageIO(inputs,outputs);
    let branchOutput = {
      "branch": id2branch[branches[branch]],
      "data": finalOut
    }
    outputResObject["branches"].push(branchOutput);
  }
  outputResObject = addInsights(inputs,outputResObject);
  outputResObject = addCounts(outputResObject);
  return outputResObject;
};

const addRevenue = function(outputs) {
  let outputObj = {};
  outputObj["quantity"] = JSON.parse(JSON.stringify(outputs));
  let rev={};
  let out_keys= Object.keys(outputs);
  let products = Object.keys(outputs[out_keys[0]]);
  for(let i=0;i<out_keys.length;i++){
    rev[out_keys[i]]=outputs[out_keys[i]];
  }
  for(let i=0;i<out_keys.length;i++){
    for(let j=0;j<products.length;j++){
      rev[out_keys[i]][products[j]] = rev[out_keys[i]][products[j]] * pricesObj[products[j]];
    }
  }
  outputObj["revenue"] = rev;
  return outputObj;
};


module.exports = {
  runPrediction,
  predict_values,
  composeInputs,
  agrregateOutput,
  addRevenue,
  addSpecialDays,
  addCounts,
  initializeCounts,
  getProductSet
};
