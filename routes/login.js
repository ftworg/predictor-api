const express = require("express");
const router = express.Router();
const firebaseUtils = require("../cloud/firebaseUtils");

router.post("/", async (req, res) => {
    try{
        const token = await firebaseUtils.gcpLogin(req.body);
        res.status(200).send({
            token
        });
    }
    catch(e){
        console.log(e);
        res.status(500).send(e.message);
    }

});

module.exports = router;