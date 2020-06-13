const express = require("express");
const app = express();
const admin = require("firebase-admin");

require("express-async-errors");
require("./startup/auth")(admin);
require("./startup/routes")(app);

// app.use(express.static("/tmp/"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
