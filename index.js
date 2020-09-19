// const startupScripts = require("./startup/pre_startup");

// app.use(express.static("/tmp/"));

// startupScripts().then(()=>{
const PORT = process.env.PORT || 5000;
const express = require("express");
const app = express();
const admin = require("firebase-admin");
require("express-async-errors");
require("./startup/auth")(admin);
require("./startup/routes")(app);
app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
// }).catch((e)=>{
//     console.log(e);
//     throw new Error(e);
// });