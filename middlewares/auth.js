const { verifyUser } = require("../auth/auth");
const key = 'n3wS3cr3tK3yF0rC0nt3xt';
const encryptor = require('simple-encryptor')(key);
const datastoreUtils = require("../cloud/datastoreUtils");
const { DB } = require("../cloud/datastoreUtils");
module.exports = async function (req, res, next) {
  global.ASSETS = undefined;
  global.model = undefined;
  global.InactivePeriod = undefined;
  global.tenant = undefined;
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");
  const context = req.header("x-ftw-context");
  const tenantObj = encryptor.decrypt(context);
  const tenant = tenantObj["tenant_id"];
  try {
    const { success, data } = await verifyUser(token,tenant);
    if (success) {
      req.user = data;
      req.tenant = tenantObj["internal_id"];
      global.DB = new DB(req.tenant);
      await global.DB.getCachedAssets(req.tenant);
      global.tenant = req.tenant;
      next();
    } else {
      res.status(401).send("Access denied.");
    }
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};
