// debugEnv.cjs — place this in your server folder and run with: node debugEnv.cjs
require('dotenv').config();

const cs = process.env.AZURE_ACS_CONNECTION_STRING;
console.log('CWD:', process.cwd());
console.log('AZURE_ACS_CONNECTION_STRING present:', !!cs);

if (cs) {
  // Mask the middle part so the secret is not printed in full
  const masked = cs.length > 40 ? cs.slice(0, 30) + '...' + cs.slice(-10) : cs;
  console.log('Sample (masked):', masked);
  console.log('Contains "endpoint=":', /endpoint=/i.test(cs));
  console.log('Contains "accesskey=" or "access_key=":', /accesskey=/i.test(cs) || /access_key=/i.test(cs));
  console.log('Length:', cs.length);
} else {
  console.log('No AZURE_ACS_CONNECTION_STRING found in process.env. Check server/.env file and that you started node from the server folder.');
}
