const { mod } = require("@tensorflow/tfjs");

const getLiveInventory = async () => {
    let period = await global.DB.getGenericObject('LiveInventory');
    period = JSON.parse(period["Data"]);
    return period;
}

const updateLiveInventory = async (data) => {
    // let inventory = await getLiveInventory(tenant);
    // Object.keys(data).forEach((branch)=>{
    //     Object.keys(data[branch]).forEach((item)=>{
    //         inventory[branch][item] = data[branch][item];
    //     });
    // });
    await global.DB.updateGenericObject('LiveInventory',{},{
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