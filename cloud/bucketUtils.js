const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const fs = require('fs');
const extract = require('extract-zip');

const downloadAssetsFromBucket = async (bucketName) =>{
    const srcDirName = 'assets/'
    const filenames = [
        'accuracy.json',
        'branches.json',
        'cat2item.json',
        'holidays.json',
        'item2cat.json',
        'items.json',
        'models.json',
        'norm.json',
        'prices.json',
        'rev_items.json',
        'id2cat.json',
        'cat2id.json'
    ];
    let destDirname = '/tmp/'+bucketName;
    let exists = fs.existsSync(destDirname)
    if(!exists){
        fs.mkdirSync(destDirname);
    }
    destDirname = destDirname +'/assets/';
    exists = fs.existsSync(destDirname)
    if(!exists){
        fs.mkdirSync(destDirname);
    }
    filenames.forEach(async (fn)=>{
        const options = {
            destination: destDirname+fn,
        };
    
        // Downloads the file
        await storage.bucket(bucketName).file(srcDirName+fn).download(options);
        console.log("Asset Downloaded");
    });
}

const downloadAndExtractModels = async (bucketName) => {
    const srcDirName = 'models.zip'
    let rootDirName = '/tmp/'+bucketName;
    let exists = fs.existsSync(rootDirName)
    if(!exists){
        fs.mkdirSync(rootDirName);
    }
    let destDirname = rootDirName +'/models/';
    exists = fs.existsSync(destDirname)
    if(!exists){
        fs.mkdirSync(destDirname);
    }
    const options = {
        destination: destDirname+srcDirName,
    };

    // Downloads the file
    console.log("Downloading...");
    await storage.bucket(bucketName).file(srcDirName).download(options);
    console.log("Extracting...");
    try {
        await extract(destDirname+srcDirName, { dir: rootDirName });
        console.log('Extraction complete');
    } catch (err) {
        // handle any errors
    }
    fs.unlinkSync(destDirname+srcDirName);
}

module.exports = {
    downloadAssetsFromBucket,
    downloadAndExtractModels
}