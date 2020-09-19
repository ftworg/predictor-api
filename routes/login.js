const express = require("express");
const router = express.Router();
const firebaseUtils = require("../cloud/firebaseUtils");

router.post("/", async (req, res) => {
    try{
        const obj = await firebaseUtils.gcpLogin(req.body);
        res.status(200).send(obj);
    }
    catch(e){
        console.log(e);
        res.status(500).send(e.message);
    }

});

module.exports = router;