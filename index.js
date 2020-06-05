const express = require("express");
const app = express();

require("express-async-errors");
require("./startup/routes")(app);
require("./startup/config")();

// app.use(express.static("/tmp/"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
