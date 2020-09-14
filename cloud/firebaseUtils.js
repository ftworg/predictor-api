const firebase = require("firebase");
const secretUtils = require("./secretUtils");
const datastoreUtils = require("./datastoreUtils");
var md5 = require('md5');
const { get } = require("../routes/model");
const key = 'n3wS3cr3tK3yF0rC0nt3xt';
const encryptor = require('simple-encryptor')(key);

const getTenantFromEmail = async(email) => {
    const userObj = await datastoreUtils.getGenericObject({
        "kind": 'UserObject'
    },
    {
        "user": md5(email)
    });
    return {
        "tenant_id": userObj.tenantID,
        "internal_id": userObj.internalTenantID
    };
}

const gcpLogin = async (obj) => {
    if(global.FIREBASE===undefined){
        const secret = await secretUtils.accessSecret();
        firebase.initializeApp(secret);
        global.FIREBASE=true;
    }
    const tenant = await getTenantFromEmail(obj.email);
    firebase.auth().tenantId = tenant.tenant_id;
    await firebase.auth().signInWithEmailAndPassword(obj.email, obj.password);
    var user = firebase.auth().currentUser;
    // console.log(user);
    if (user) {
    // User is signed in.
        const user_d = await user.getIdToken();
        return {
            "token": user_d,
            "context": encryptor.encrypt(tenant)
        };
    } else {
    // No user is signed in.
        throw new Error("Log in failed");
    }
}

module.exports = {
    gcpLogin,
    getTenantFromEmail
}