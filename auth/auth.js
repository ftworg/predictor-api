const firebase = require("firebase");

function initilalizeApp(admin) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  global.AuthAdmin = admin;
}

async function verifyUser(token,tenant) {
  try {
    firebase.auth().tenantId = tenant;
    const decodedToken = await global.AuthAdmin.auth().verifyIdToken(token);
    let uid = decodedToken.uid;
    return {
      success: true,
      data: uid,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}

module.exports = {
  initilalizeApp,
  verifyUser,
};
