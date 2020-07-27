const firebase = require("firebase");
const secretUtils = require("./secretUtils");

const gcpLogin = async (obj) => {
    if(global.FIREBASE===undefined){
        const secret = await secretUtils.accessSecret();
        firebase.initializeApp(secret);
        global.FIREBASE=true;
    }
    await firebase.auth().signInWithEmailAndPassword(obj.email, obj.password);
    var user = firebase.auth().currentUser;
    console.log(user);
    if (user) {
    // User is signed in.
        return user.getIdToken();
    } else {
    // No user is signed in.
        throw new Error("Log in failed");
    }
}

module.exports = {
    gcpLogin
}