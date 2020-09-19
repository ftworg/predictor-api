const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const auth = require("../middlewares/auth");
const inventoryUtils = require("../inventory/inventoryUtils");

const operations = ["Add","Set","Remove","Transfer"];

router.get("/live/", auth, async (req, res) => {
    if(global.ASSETS===undefined){
        await global.DB.getCachedAssets(req.tenant);
      }
    var items2cat = global.ASSETS['item2cat'];
    var itemsObj = global.ASSETS['items'];
    let period = await inventoryUtils.getLiveInventory(req.tenant);
    let branches = Object.keys(period);
    let results = [];
    branches.forEach((branch)=>{
        let branchObj = {
            "branch": branch,
            "items" : []
        }
        let items = Object.keys(period[branch]);
        for(let i=0;i<items.length;i++){
            let curr_item = items[i];
            let curr_super = items2cat[curr_item]["super"];
            let curr_sub = items2cat[curr_item]["sub"];
            let curr_key = itemsObj[curr_item];
            let quan = period[branch][curr_item];
            branchObj["items"].push({
                "key": curr_key,
                "super_category": curr_super,
                "sub_category": curr_sub,
                "name": curr_item,
                "quantity": quan
            })
        }
        results.push(branchObj);
    })
    res.send(results);
});

router.get("/", auth, async (req, res) => {
    if(global.ASSETS===undefined){
        await global.DB.getCachedAssets(req.tenant);
      }
    var cat2items = global.ASSETS['cat2item'];
    var items2cat = global.ASSETS['item2cat'];
    var branchesObj = global.ASSETS['branches'];
    const branches = Object.keys(branchesObj);
    const categories = cat2items;
    const items = Object.keys(items2cat);
    res.send({
        operations,
        branches,
        categories,
        items
    });
});

router.post("/", auth, async (req,res) => {
    try{
        const inputJson = verifyInput(req);
        if(inputJson.operation==="Transfer"){
            await inventoryUtils.executeOperation(req.tenant,"Remove",inputJson.items,inputJson.source);
            inputJson.operation="Add";
        }
        await inventoryUtils.executeOperation(req.tenant,inputJson.operation,inputJson.items,inputJson.target);
        res.send({
            "message": "Operation successful"
        });
        
    }catch(e){
        console.log(e);
        res.status(400).send(e);
    }
});

const verifyInput = (req) => {
    const inputJson = req.body;
    if(operations.indexOf(inputJson.operation)>=0){
        if(inputJson.operation==="Transfer"){
            if(inputJson.target===undefined || inputJson.source===undefined){
                throw new Error("Invalid inputs!");
            }
        }
    }
    return inputJson;
}

module.exports = router;