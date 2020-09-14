const datastoreUtils = require("../cloud/datastoreUtils");
const { mod } = require("@tensorflow/tfjs");

const getLiveInventory = async (tenant) => {
    let period = await datastoreUtils.getGenericObject({
        "tenant": tenant,
        "kind": 'LiveInventory'
    });
    period = JSON.parse(period["Data"]);
    return period;
}

const updateLiveInventory = async (tenant,data) => {
    // let inventory = await getLiveInventory(tenant);
    // Object.keys(data).forEach((branch)=>{
    //     Object.keys(data[branch]).forEach((item)=>{
    //         inventory[branch][item] = data[branch][item];
    //     });
    // });
    await datastoreUtils.updateGenericObject(tenant,'LiveInventory',{},{
        "Data": JSON.stringify(data)
    });
}

const executeOperation = async (tenant,operation,items,target) => {
    const inventory = await getLiveInventory(tenant);
    if(operation==="Add"){
        items.forEach((item)=>{
            inventory[target][item.name] = inventory[target][item.name] + item.quantity;
        });
    }
    else if(operation==="Remove"){
        items.forEach((item)=>{
            inventory[target][item.name] = inventory[target][item.name] - item.quantity;
        });
    }
    else if(operation==="Set"){
        items.forEach((item)=>{
            inventory[target][item.name] = item.quantity;
        });
    }
    else{
        throw new Error("Invalid Operation");
    }
    await updateLiveInventory(tenant,inventory);
}

module.exports = {
    getLiveInventory,
    updateLiveInventory,
    executeOperation
}