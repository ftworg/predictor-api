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

const uploadFileForTraining = async (bucketName,filename) => {
    // Uploads a local file to the bucket
    await storage.bucket(bucketName).upload(filename, {
        gzip: true,
        metadata: {
        cacheControl: 'public, max-age=31536000',
        },
        destination: 'files/trainingData.xls'
    });
}

const uploadGenericFile = async (bucketName,filename) => {
    await storage.bucket(bucketName).upload("/tmp/"+bucketName+"/"+filename, {
        gzip: true,
        metadata: {
        cacheControl: 'public, max-age=31536000',
        },
        destination: filename
    });
}

const downloadGenericFile = async (bucketName,folder,filename) => {
    global.namespace = '/tmp/'+bucketName;
    const destDir = '/tmp/'+bucketName+"/"+folder;
    const options = {
        destination: destDir+"/"+filename,
    };
    let exists = fs.existsSync(destDir)
    if(!fs.existsSync('/tmp/'+bucketName)){
        fs.mkdirSync('/tmp/'+bucketName);
    }
    if(!exists){
        fs.mkdirSync(destDir);
    }
    // Downloads the file
    let res;
    try{
        res = await storage.bucket(bucketName).file(folder+"/"+filename).download(options);
    }catch(e){
        console.log(e);
        res = {
            "notFound": true
        }
    }
    return res;
}

const downloadAndExtractModels = async (bucketName,version) => {
    const srcDirName = 'models/'+version+'/models.zip'
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
        destination: destDirname+'models.zip',
    };

    // Downloads the file
    console.log("Downloading...");
    await storage.bucket(bucketName).file(srcDirName).download(options);
    console.log("Extracting...");
    try {
        await extract(destDirname+'models.zip', { dir: rootDirName });
        console.log('Extraction complete');
    } catch (err) {
        // handle any errors
    }
    fs.unlinkSync(destDirname+'models.zip');
}

module.exports = {
    downloadAssetsFromBucket,
    downloadAndExtractModels,
    uploadFileForTraining,
    uploadGenericFile,
    downloadGenericFile
}