const _ = require("lodash");

module.exports = function(err, req, res, next) {
  console.log(err.message, _.pick(err, ["stack"]));
  res.status(500).send("Server Error.");
};
