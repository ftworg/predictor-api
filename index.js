const express = require("express");
const app = express();

app.get("/greet", (req, res) => {
  res.send("Hello to Predictor API");
});

require("express-async-errors");
require("./startup/routes")(app);
require("./startup/config")();

app.use(express.static("reports"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
