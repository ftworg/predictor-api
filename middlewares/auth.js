const { verifyUser } = require("../auth/auth");

module.exports = async function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const { success, data } = await verifyUser(token);
    if (success) {
      req.user = data;
      next();
    } else {
      res.status(401).send("Access denied.");
    }
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};
