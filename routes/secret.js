const express = require("express");
const router = express.Router();
const secretUtils = require('../cloud/secretUtils');
const key = 's3cr3tEncrypt1onKey';
const encryptor = require('simple-encryptor')(key);

router.get("/",  async (req, res) => {
    if(req.headers.secret==='bypassKeyForSecret'){
        let secretJson = await secretUtils.accessSecret();
        // console.log(secretJson);
        let e_obj = encryptor.encrypt(secretJson);
        res.status(200).send(e_obj);
    }
    else{
        res.status(401).send('Unauthorized');
    }
});

module.exports = router;
