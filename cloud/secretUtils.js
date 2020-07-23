const name = 'projects/salesprediction/secrets/Firebase_Auth_JSON/versions/latest';

// Imports the Secret Manager library
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

// Instantiates a client
const client = new SecretManagerServiceClient();

async function accessSecret() {
    const [version] = await client.accessSecretVersion({
      name: name,
    });
  
    // Extract the payload as a string.
    const payload = JSON.parse(version.payload.data.toString());
  
    // WARNING: Do not print the secret in a production environment - this
    // snippet is showing how to access the secret material.
    // console.info(payload);
    return payload;
  }
  
module.exports = {
    accessSecret
}