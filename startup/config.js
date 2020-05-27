const config = require("config");

module.exports = function () {
  if (!config.get("jwtPrivateKey")) {
    console.log("FATAL ERROR: JWT Private Key not set. Exiting application");
    process.exit(1);
  }
};
