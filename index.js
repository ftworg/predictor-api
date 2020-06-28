const express = require("express");
const app = express();
const startupScripts = require("./startup/pre_startup");

require("express-async-errors");
require("./startup/routes")(app);
require("./startup/config")();

// app.use(express.static("/tmp/"));

const PORT = process.env.PORT || 5000;
startupScripts().then(()=>{
    app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
}).catch((e)=>{
    throw new Error(e);
});
