const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();
const utils = require('./utils');
const itemObj = require('./assets/rev_items.json');

const TOOMANYREADS = 120;

let updateOrCreateSalesRecord = async (input,obj) => {
    global.SALES_WRITES = global.SALES_WRITES + 1;
    global.SALES_READS = global.SALES_READS + 1;
    const query = datastore.createQuery('SalesRecord').filter('Input',input);  
    const [records] = await datastore.runQuery(query);
    //console.log(records);
    let items = records[0] && records[0].Items ? records[0].Items : undefined;
    if(items===undefined){
        //console.log("New record");
        const key = datastore.key('SalesRecord');
        const data = {
            'Input': input,
            'Items': JSON.stringify(obj)
        }
        const entity = {
            key: key,
            data: data,
            excludeLargeProperties: true
        };
          
        await datastore.upsert(entity);
    }
    else{
        //console.log("Existing");
        items = JSON.parse(items);
        let obj_keys = Object.keys(obj);
        for(let obj_key_ind=0;obj_key_ind<obj_keys.length;obj_key_ind++){
            if(items[obj_keys[obj_key_ind]]===undefined){
                items[obj_keys[obj_key_ind]]=obj[obj_keys[obj_key_ind]]
            }
        }
        items = JSON.stringify(items);
        const taskKey = records[0][datastore.KEY];
        entity = {
            key: taskKey,
            data: {
                'Input': input,
                'Items': items
            },
            excludeLargeProperties: true
        };
        await datastore.update(entity);
    }
}

let updateOrCreateSequenceRecord = async (input,obj) => {
    global.SEQUENCE_READS = global.SEQUENCE_READS + 1;
    global.SEQUENCE_WRITES = global.SEQUENCE_WRITES + 1;
    const query = datastore.createQuery('SequenceInput').filter('Input',input);  
    const [records] = await datastore.runQuery(query);
    //console.log(records);
    let items = records[0] && records[0].Data ? records[0].Data : undefined;
    if(items===undefined){
        //console.log("New record");
        const key = datastore.key('SequenceInput');
        let payload = {
            'Input': input,
            'Data': JSON.stringify(obj)
        }
        const entity = {
            key: key,
            data: payload,
            excludeLargeProperties: true
        };
          
        await datastore.upsert(entity);
    }
    else{
        //console.log("Existing");
        data = JSON.parse(items);
        let obj_keys = Object.keys(obj);
        for(let obj_key_ind=0;obj_key_ind<obj_keys.length;obj_key_ind++){
            if(data[obj_keys[obj_key_ind]]===undefined){
                data[obj_keys[obj_key_ind]]=obj[obj_keys[obj_key_ind]]
            }
        }
        data = JSON.stringify(data);
        const taskKey = records[0][datastore.KEY];
        entity = {
            key: taskKey,
            data: {
                'Input': input,
                'Data': data
            },
            excludeLargeProperties: true
        };
        await datastore.update(entity);
    }
}

let getSalesRecord = async (input) => {
    global.SALES_READS = global.SALES_READS + 1;
    const query = datastore.createQuery('SalesRecord').filter('Input',input);  
    const [records] = await datastore.runQuery(query);
    let res = records[0] && records[0].Items ? records[0].Items : undefined;
    try{
        return JSON.parse(res);
    }catch(e){
        return undefined;
    }
    // records.forEach(record => {
    //   const recordKey = record[datastore.KEY];
    //   //console.log(recordKey.id, record);
    // });
}

let getSequenceInputs = async (input) => {
    global.SEQUENCE_READS = global.SEQUENCE_READS + 1;
    const query = datastore.createQuery('SequenceInput').filter('Input',input);  
    const [records] = await datastore.runQuery(query);
    let res = records[0] && records[0].Data ? records[0].Data : undefined;
    try{
        return JSON.parse(res);
    }catch(e){
        return undefined;
    }
    // records.forEach(record => {
    //   const recordKey = record[datastore.KEY];
    //   //console.log(recordKey.id, record);
    // });
}

let getPreviousInput = (input) => {
    var d = new Date(input[0],input[1]-1,input[2]);
    var tod = input[3];
    if(tod==1){
        d.setDate(d.getDate()-1);
        tod=4;
    }
    var n = [d.getFullYear(),d.getMonth()+1,d.getDate(),tod-1,input[4]];
    n.push(utils.isWeekend(n[2],n[1]-1,n[0]));
    n.push(utils.isPublicHoliday(n[0],n[1],n[2]));
    return n;
}

let getCachedSalesRecord = async (cache,input) => {
    let records = cache.records;
    let visited = cache.visited;
    if(visited[input]===undefined){
        //console.log("Sales Record Read");
        visited[input] = true;
        records[input] = await getSalesRecord(input);
    }
    return records[input];
}

let updateNewObjects = async (obj,kind) => {
    //console.log("update new object");
    let keys = Object.keys(obj);
    if(kind==='SalesRecord'){
        for(let key_ind=0;key_ind<keys.length;key_ind++){
            let inp = keys[key_ind];
            await updateOrCreateSalesRecord(inp,obj[inp]);
        }
    }
    else if(kind==='SequenceInput'){
        for(let key_ind=0;key_ind<keys.length;key_ind++){
            let inp = keys[key_ind];
            await updateOrCreateSequenceRecord(inp,obj[inp]);
        }
    }
    else{
        throw new Error("Invalid Update Object");
    }
}

let getCachedSequenceInput = async (cache,input) => {
    let records = cache.records;
    let visited = cache.visited;
    if(visited[input]===undefined){
        //console.log("Sequence Record Read");
        visited[input] = true;
        records[input] = await getSequenceInputs(input);
    }
    return records[input];
}

let fetchExistingRecords = async (inputs,products) => {
    for(let pr_i=0;pr_i<inputs.length;pr_i++){
        if(inputs[pr_i][0]<2020){
            throw new Error("Inputs not in desired range");
        }
    }
    let recordObjects = [];
    let requestLevelSalesCache = {
        visited: {},
        records: {}
    };
    let requestLevelSequenceCache = {
        visited: {},
        records: {}
    };
    for(let product_index=0;product_index<products.length;product_index++){
        let prod = products[product_index];
        let product = itemObj[String(prod)];
        let inputObjs=[];
        //console.log(product);
        // //console.log(Object.keys(requestLevelSalesCache.records).length);
        // //console.log(Object.keys(requestLevelSequenceCache.records).length);
        let curr_inp = inputs[0].join('-');
        //console.log(curr_inp);
        let curr_out = await getCachedSalesRecord(requestLevelSalesCache,curr_inp);
        // //console.log(curr_out[product]);
        if(curr_out && curr_out[product]!==undefined){
            //console.log("got record");
            let seq_inp = await getCachedSequenceInput(requestLevelSequenceCache,curr_inp);
            seq_inp = seq_inp!==undefined && seq_inp[product]!==undefined ? seq_inp[product] : undefined;
            //console.log(seq_inp);
            let inputObj = {
                "input": inputs[0],
                "seq_inp": seq_inp,
                "output": curr_out[product],
                "actual": true
            }
            inputObjs.push(inputObj);
        }
        else{
            let missing_inp = inputs[0];
            let prev_inp = getPreviousInput(inputs[0]);
            let joined_prev_inp  = prev_inp.join('-');
            let curr_out = await getCachedSalesRecord(requestLevelSalesCache,joined_prev_inp);
            let toBeinputs=[]
            //console.log("loop over to earliest");
            let tooManyreads = TOOMANYREADS;
            let reads=0;
            let prod_quan = curr_out ? curr_out[product] : undefined;
            while(prod_quan===undefined){
                if(reads==tooManyreads){
                    throw new Error("Too many GCP reads");
                }
                //console.log(prev_inp);
                toBeinputs.push(prev_inp);
                prev_inp = getPreviousInput(prev_inp);
                joined_prev_inp  = prev_inp.join('-');
                //console.log(joined_prev_inp);
                curr_out = await getCachedSalesRecord(requestLevelSalesCache,joined_prev_inp);
                prod_quan = curr_out ? curr_out[product] : undefined;
                // //console.log(curr_out);
                reads+=1;
            }
            //console.log(joined_prev_inp);
            let first_seq_inp = await getCachedSequenceInput(requestLevelSequenceCache,joined_prev_inp);
            first_seq_inp = first_seq_inp[product];
            let tbi = toBeinputs.length===0 ? missing_inp : toBeinputs[toBeinputs.length-1];
            //console.log(toBeinputs.length);
            //console.log(tbi);
            let act_bool = toBeinputs.length===0 ? true : false;
            let seq_inp = first_seq_inp.slice(1,first_seq_inp.length);
            seq_inp.push(curr_out[product]);
            let inputObj = {
                "input": tbi,
                "seq_inp": seq_inp,
                "actual": act_bool
            }
            inputObjs.push(inputObj);
            for(let prevInp=toBeinputs.length-2;prevInp>=0;prevInp--){
                inputObj = {
                    "input": toBeinputs[prevInp],
                    "actual": false
                }
                inputObjs.push(inputObj);
            }
            if(toBeinputs.length>0){
                //console.log(toBeinputs.length);
                //console.log("first input added");
                inputObj = {
                    "input": inputs[0],
                    "actual": true
                }
                inputObjs.push(inputObj); 
            }             
        }
        // From the second input onwards look for sales record and pass if none
        for(let i=1;i<inputs.length;i++){
            let curr_inp = inputs[i].join('-');
            //console.log(curr_inp);
            let curr_out = await getCachedSalesRecord(requestLevelSalesCache,curr_inp);
            // //console.log(curr_out[product]);
            if(curr_out && curr_out[product]!==undefined){
                //console.log("got record");
                let seq_inp = await getCachedSequenceInput(requestLevelSequenceCache,curr_inp);
                seq_inp = seq_inp!==undefined && seq_inp[product]!==undefined ? seq_inp[product] : undefined;
                //console.log(seq_inp);
                inputObj = {
                    "input": inputs[i],
                    "seq_inp": seq_inp,
                    "output": curr_out[product],
                    "actual": true
                }
                inputObjs.push(inputObj);
            }
            else{
                inputObj = {
                    "input": inputs[i],
                    "actual": true
                }
                inputObjs.push(inputObj); 
            }
        }
        //console.log(inputObjs);
        let recordobject = {
            "product": product,
            "index": prod,
            "objs": inputObjs
        }
        // //console.log(recordobject);
        // //console.log(inputObjs);
        recordObjects.push(recordobject);
    }
    // //console.log(recordObjects);
    return [recordObjects,requestLevelSalesCache,requestLevelSequenceCache];
}

module.exports = {
    fetchExistingRecords,
    updateNewObjects
}

// getSequenceInputs('2020-1-22-3-2-2-0').then().catch()