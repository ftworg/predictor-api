const {Datastore} = require('@google-cloud/datastore');
const moment = require("moment");
const { entity } = require('@google-cloud/datastore/build/src/entity');
const datastore = new Datastore();

const TOOMANYREADS = 500;

let DB = function(tenant){
    this.client = tenant ? new Datastore({
        "namespace": tenant
    }) : new Datastore();
}

DB.prototype = {
    getGenericObject : async function (kind,options) {
        global.READS = global.READS + 1;
        let query = this.client.createQuery(kind);
        const filters = options ? Object.keys(options) : [];
        filters.forEach((fil)=>{
            query = query.filter(fil,options[fil]);
        })  
        const [records] = await this.client.runQuery(query);
        // console.log(records[0])
        let res;
        try{
            if(records.length>=0){
                res = records[0];
                return res;
            }
            else{
                return undefined;
            }
        }catch(e){
            return undefined;
        }
    },
    updateGenericObject : async function(kind,oldoptions,newoptions){
        global.READS = global.READS + 1;
        global.WRITES = global.WRITES + 1;
        let query = this.client.createQuery(kind);
        const filters = oldoptions ? Object.keys(oldoptions) : [];
        filters.forEach((fil)=>{
            query = query.filter(fil,oldoptions[fil]);
        });  
        const [records] = await this.client.runQuery(query);
        let items = records[0] ? records[0] : undefined;
        if(items===undefined){
            console.log("New record");
            const key = this.client.key(kind);
            let payload = newoptions;
            let entity = {
                key: key,
                data: payload,
                excludeLargeProperties: true
            };
            // console.log(entity);
            await this.client.upsert(entity);
        }
        else{
            // console.log("Existing");
            const taskKey = records[0][ds.KEY];
            let payload = records[0];
            const filters = Object.keys(newoptions);
            filters.forEach((fil)=>{
                payload[fil] = newoptions[fil];
            })
            let entity = {
                key: taskKey,
                data: payload,
                excludeLargeProperties: true
            };
            // console.log(entity);
            await this.client.update(entity);
        }
    },
    getPipelineStatus : async function ()  {
        global.READS = global.READS + 1;
        let res = await this.getGenericObject('PipelineStatus',{})
        try{
            return res;
        }catch(e){
            return undefined;
        }
    },
    updatePipelineStatus : async function (data) {
        global.READS = global.READS + 1;
        global.WRITES = global.WRITES + 1;
        let items = await this.getPipelineStatus();
        const taskKey = items[this.client.KEY];
        let entity = {
            key: taskKey,
            data: {
                "REPL": data.REPL,
                "Status": "Uninitialised",
                "devMode": items["devMode"],
                "startTraining": true,
                "times": String(Math.floor(Date.now()/1000))
            }
        };
        await this.client.update(entity);
    },
    getModelMetadata : async function() {
        global.READS = global.READS + 1;
        let res = await this.getGenericObject('ModelMetadata',{});
        try{
            return res;
        }catch(e){
            return undefined;
        }
    },
    getUploadData : async function()  {
        global.READS = global.READS + 1;
        let res = await this.getGenericObject('UPLOAD',{});
        try{
            return res;
        }catch(e){
            return undefined;
        }
    },
    updateUploadData : async function()  {
        global.READS = global.READS + 1;
        global.WRITES = global.WRITES + 1;
        let items = await this.getUploadData();
        let data = {
            last_upload: moment(Date.now()).toObject()
        }
        data = JSON.stringify(data);
        const taskKey = items[this.client.KEY];
        let entity = {
            key: taskKey,
            data: {
                "Data": data
            }
        };
        await this.client.update(entity);
    },
    getProductEntries : async function(input,tenant)  {
        global.READS = global.READS + 1;
        let ds = this.client;
        if(tenant==="tenant001"){
            ds = new Datastore();
        }
        const query = ds.createQuery('ProductEntries').filter('Input',input);  
        const [records] = await ds.runQuery(query);
        let res = records[0] && records[0].Items ? records[0].Items : undefined;
        try{
            return JSON.parse(res);
        }catch(e){
            return undefined;
        }
    },
    getAssetsFromGCP : async function(tenant)  {
        global.READS = global.READS + 1;
        const query = this.client.createQuery('Assets');  
        const [records] = await this.client.runQuery(query);
        let res = records[0] && records[0].Data ? records[0].Data : undefined;
        try{
            return JSON.parse(res);
        }catch(e){
            console.log(e);
            return undefined;
        }
    },
    getInactivePeriod : async function(tenant)  {
        global.READS = global.READS + 1;
        const query = this.client.createQuery('InactivePeriod');  
        const [records] = await this.client.runQuery(query);
        let res = records[0] && records[0].Data ? records[0].Data : undefined;
        try{
            return JSON.parse(res);
        }catch(e){
            console.log(e);
            return undefined;
        }
    },
    getCachedInactivePeriod : async function(tenant)  {
        if(global.InactivePeriod===undefined){
            global.InactivePeriod = await this.getInactivePeriod(tenant);
        }
        return global.InactivePeriod;
    },
    getCachedAssets : async function(tenant)  {
        if(global.ASSETS===undefined){
            global.ASSETS = await this.getAssetsFromGCP(tenant);
        }
        return global.ASSETS;
    },
    getCachedProductEntries : async function(tenant,cache,input)  {
        if(global.InactivePeriod===undefined){
            await this.getCachedInactivePeriod(tenant);
        }
        if(global.InactivePeriod["inputs"].indexOf(input)>=0){
            throw new Error("Inputs fall in Inactive Period");
        }
        if(Number.parseInt(input.split('-')[0])<2020){
            throw new Error("Inputs have dates before 01/01/2020");
        }
        let records = cache.records;
        let visited = cache.visited;
        if(visited[input]===undefined){
            visited[input] = true;
            records[input] = await this.getProductEntries(input,tenant);
        }
        return records[input];
    },
    updateOrCreateProductEntry : async function(input,obj)  {
        global.READS = global.READS + 1;
        global.WRITES = global.WRITES + 1;
        obj["predicted"] = true;
        const query = this.client.createQuery('ProductEntries').filter('Input',input);  
        const [records] = await this.client.runQuery(query);
        // console.log(records);
        let items = records[0] && records[0].Items ? records[0].Items : undefined;
        if(items===undefined){
            //console.log("New record");
            const key = this.client.key('ProductEntries');
            let payload = {
                'Input': input,
                'Items': JSON.stringify(obj)
            }
            const entity = {
                key: key,
                data: payload,
                excludeLargeProperties: true
            };
            
            await this.client.upsert(entity);
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
            data["predicted"] = true;
            data = JSON.stringify(data);
            const taskKey = records[0][this.client.KEY];
            entity = {
                key: taskKey,
                data: {
                    'Input': input,
                    'Items': data
                },
                excludeLargeProperties: true
            };
            await this.client.update(entity);
        }
    },
    updateProductEntries : async function(obj)  {
        let keys = Object.keys(obj);
        for(let key_ind=0;key_ind<keys.length;key_ind++){
            let inp = keys[key_ind];
            await this.updateOrCreateProductEntry(inp,obj[inp]);
        }
    }
}

let getPreviousInput = (tenant,input) => {
    const utils = require('../predictor/utils');
    console.log(input);
    var d = new Date(input[0],input[1]-1,input[2]);
    var tod = input[3];
    if(tod==1){
        d.setDate(d.getDate()-1);
        tod=4;
    }
    var n = [d.getFullYear(),d.getMonth()+1,d.getDate(),tod-1,input[4]];
    n.push(utils.isWeekend(tenant,n[2],n[1]-1,n[0]));
    n.push(utils.isPublicHoliday(tenant,n[0],n[1],n[2]));
    return n;
}

let fetchExistingRecords = async (tenant,inputs, products) => {
    const itemObj = global.ASSETS['rev_items'];
    for(let pr_i=0;pr_i<inputs.length;pr_i++){
        if(inputs[pr_i][0]<2020){
            throw new Error("Inputs have dates before 01/01/2020");
        }
    }
    let recordObjects = [];
    let requestLevelCache = {
        visited: {},
        records: {}
    };
    for(let product_index=0;product_index<products.length;product_index++){
        let prod = products[product_index];
        let product = itemObj[String(prod)];
        let inputObjs=[];
        // console.log(product);
        let curr_inp = inputs[0].join('-');
        let curr_out = await global.DB.getCachedProductEntries(tenant,requestLevelCache,curr_inp);
        // //console.log(curr_out[product]);
        if(curr_out && curr_out[product] && curr_out[product]["input"]!==undefined && curr_out[product]["output"]!==undefined){
            // console.log("got record");
            let inputObj = {
                "input": inputs[0],
                "seq_inp": curr_out[product]["input"],
                "output": curr_out[product]["output"],
                "actual": true
            }
            inputObjs.push(inputObj);
        }
        else{
            let missing_inp = inputs[0];
            let prev_inp = getPreviousInput(inputs[0]);
            let joined_prev_inp  = prev_inp.join('-');
            let curr_out = await global.DB.getCachedProductEntries(tenant,requestLevelCache,joined_prev_inp);
            let toBeinputs=[]
            //console.log("loop over to earliest");
            let tooManyreads = TOOMANYREADS;
            let reads=0;
            let seq_inp = curr_out && curr_out[product] && curr_out[product]["input"]!==undefined ? curr_out[product]["input"] : undefined;
            let prod_quan = curr_out && curr_out[product] && curr_out[product]["output"]!==undefined ? curr_out[product]["output"] : undefined;
            while(prod_quan===undefined || seq_inp===undefined){
                if(reads==tooManyreads){
                    throw new Error("Too many GCP reads");
                }
                // console.log(prev_inp);
                toBeinputs.push(prev_inp);
                prev_inp = getPreviousInput(prev_inp);
                joined_prev_inp  = prev_inp.join('-');
                // console.log(joined_prev_inp);
                curr_out = await global.DB.getCachedProductEntries(tenant,requestLevelCache,joined_prev_inp);
                seq_inp = curr_out && curr_out[product] && curr_out[product]["input"]!==undefined ? curr_out[product]["input"] : undefined;
                prod_quan = curr_out && curr_out[product] && curr_out[product]["output"]!==undefined ? curr_out[product]["output"] : undefined;
                // //console.log(curr_out);
                reads+=1;
            }
            first_seq_inp = seq_inp;
            let tbi = toBeinputs.length===0 ? missing_inp : toBeinputs[toBeinputs.length-1];
            //console.log(toBeinputs.length);
            //console.log(tbi);
            let act_bool = toBeinputs.length===0 ? true : false;
            seq_inp = first_seq_inp.slice(1,first_seq_inp.length);
            seq_inp.push(curr_out[product]["output"]);
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
            let curr_out = await global.DB.getCachedProductEntries(tenant,requestLevelCache,curr_inp);
            // //console.log(curr_out[product]);
            if(curr_out && curr_out[product] && curr_out[product]["input"]!==undefined && curr_out[product]["output"]!==undefined){
                //console.log("got record");
                let seq_inp = curr_out[product]["input"];
                //console.log(seq_inp);
                inputObj = {
                    "input": inputs[i],
                    "seq_inp": curr_out[product]["input"],
                    "output": curr_out[product]["output"],
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
    return [recordObjects,requestLevelCache];
}

module.exports = {
    fetchExistingRecords,
    getPreviousInput,
    DB
}