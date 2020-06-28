const morgan = require("morgan");
const express = require("express");
const error = require("../middlewares/error");
const cors = require("cors");
const predictions = require("../routes/predictions");
const accuracy = require("../routes/accuracy");
const categories = require("../routes/categories");
const branches = require("../routes/branch");
const upload = require("../routes/file-upload");
const report = require("../routes/report");
const compare = require("../routes/compare");
const modelinfo = require("../routes/model");

module.exports = function (app) {
  app.use(
    express.json({
      limit: "50mb",
    })
  );
  app.use(cors());

  if (app.get("env") === "development") {
    app.use(morgan("tiny"));
  }

  app.use("/api/branches", branches);
  app.use("/api/upload", upload);
  app.use("/api/predict", predictions);
  app.use("/api/accuracy", accuracy);
  app.use("/api/categories", categories);
  app.use("/api/report", report);
  app.use("/api/compare", compare);
  app.use("/api/model", modelinfo);
  app.use(error);
};
