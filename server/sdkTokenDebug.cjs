// sdkTokenDebug.cjs — run from server folder with: node sdkTokenDebug.cjs
require('dotenv').config();
const { CommunicationIdentityClient } = require('@azure/communication-identity');

(async () => {
  const cs = process.env.AZURE_ACS_CONNECTION_STRING;
  console.log('CWD:', process.cwd());
  console.log('AZURE_ACS_CONNECTION_STRING present:', !!cs);
  if (!cs) { console.error('No connection string found in process.env'); process.exit(1); }

  try {
    const client = new CommunicationIdentityClient(cs);
    console.log('Calling createUserAndToken() ...');
    const scopes = ['voip'];
    const res = await client.createUserAndToken(scopes);
    console.log('createUserAndToken raw result:', JSON.stringify(res, null, 2));
    console.log('user id:', res.user?.communicationUserId);
    console.log('token present:', !!res.token?.token);
    console.log('token object keys:', res.token ? Object.keys(res.token) : null);
    process.exit(0);
  } catch (err) {
    console.error('createUserAndToken threw error:');
    console.error(err && err.message ? err.message : err);
    if (err.response) {
      try { console.error('err.response.data:', JSON.stringify(err.response.data, null, 2)); } catch(e){}
      try { console.error('err.response.status:', err.response.status); } catch(e){}
    }
    if (err.stack) console.error(err.stack);
    process.exit(2);
  }
})();
