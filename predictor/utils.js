const fs = require('fs');
const { all } = require('@tensorflow/tfjs');

const getAllInputs = () => {
  let branchObj = global.ASSETS['branches'];
  let cat = global.ASSETS['cat2item'];
  let today = new Date(Date.now());
  let mon = {};
  let branches = Object.values(branchObj);
  let super_cats = Object.keys(cat);
  let sup2sub = {};
  super_cats.forEach((super_cat)=>{
    let sub_cats = Object.keys(cat[super_cat]);
    sup2sub[super_cat]=sub_cats;
  });
  for(let i=0;i<2;i++){
    let nextDay = getNextDay(today);
    today = nextDay;
    let month = nextDay.getMonth()+1;
    if(mon[month]===undefined){
      mon[month] = [nextDay.getDate()];
    }
    else{
      mon[month].push(nextDay.getDate());
    }
  }
  let all_inputs={
    "category": [],
    "months": [],
    branches
  };

  Object.keys(mon).forEach((m)=>{
    all_inputs.months.push({
      "month": m,
      "dates": mon[m]
    });
  });

  Object.keys(sup2sub).forEach((sup)=>{
    all_inputs.category.push({
      "super": sup,
      "sub": sup2sub[sup]
    });
  });
  
  return all_inputs;
}

const getNextDay = (today) => {
  let nextDay = today;
  nextDay.setDate(nextDay.getDate()+1);
  return nextDay;
}

const isWeekend = (date, month, year) => {
  let d = new Date(year,month,date);
  let wd =  d.getDay();
  if(wd==0){
    wd=6
  }
  else{
    wd=wd-1;
  }
  return wd;
};

const get_seq_inputs = (win_size,input) => {
  seqs=[]
  for(let i=0;i<input.length;i++){
    seqs.push([0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
  }
  return seqs;
  // TO DO: GCP Integration
}

const isPublicHoliday = (tenant,year,month,date) => {
  let ph = global.ASSETS['holidays'];
  let dates = ph[month];
  for(let i=0;i<dates.length;i++){
    if(date==dates[i]){
      return 1;
    }
  }
  return 0;
};

function range(start, stop, step) {
  if (typeof stop == "undefined") {
    // one param defined
    stop = start;
    start = 0;
  }

  if (typeof step == "undefined") {
    step = 1;
  }

  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return [];
  }

  var result = [];
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }

  return result;
}

const dice_outputs = (outputs) => {
  let fin_outs=[];
  for(let i=0;i<outputs[0].length;i++){
    let temp=[];
    for(let j=0;j<outputs.length;j++){
      temp.push(outputs[j][i]);
    }
    fin_outs.push(temp);
  }
  return fin_outs;
}

const months = {
  1: {
    month: "January",
    days: 31
  },
  2: {
    month: "February",
    days: 28
  },
  3: {
    month: "March",
    days: 31
  },
  4: {
    month: "April",
    days: 30
  },
  5: {
    month: "May",
    days: 31
  },
  6: {
    month: "June",
    days: 30
  },
  7: {
    month: "July",
    days: 31
  },
  8: {
    month: "August",
    days: 31
  },
  9: {
    month: "September",
    days: 30
  },
  10: {
    month: "October",
    days: 31
  },
  11: {
    month: "November",
    days: 30
  },
  12: {
    month: "December",
    days: 31
  }
};

let get_context_input = (inputs) => {
  fin=[]
  for(let i=3;i<inputs[0].length;i++){
    temp=[]
    for(let j=0;j<inputs.length;j++){
      temp.push([inputs[j][i]]);
    }
    fin.push(temp);
  }
  return fin;
}

module.exports = {
  isPublicHoliday,
  isWeekend,
  months,
  range,
  get_seq_inputs,
  dice_outputs,
  get_context_input,
  getAllInputs
};
