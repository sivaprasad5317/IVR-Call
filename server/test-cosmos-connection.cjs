// server/test-cosmos-connection.js (CommonJS)
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { CosmosClient } = require('@azure/cosmos');

(async () => {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  console.log('Endpoint:', endpoint ? 'SET' : 'MISSING');
  console.log('Key:', key ? 'SET' : 'MISSING');

  if (!endpoint || !key) return process.exit(1);

  const client = new CosmosClient({ endpoint, key });
  try {
    const dbId = process.env.COSMOS_DATABASE || 'ivrdb';
    const containerId = process.env.COSMOS_CONTAINER || 'contacts';
    const { database } = await client.databases.createIfNotExists({ id: dbId });
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { kind: 'Hash', paths: ['/id'] },
    });
    console.log('Connected. Container:', container.id);

    const { resources: items } = await container.items.query({ query: 'SELECT c.id, c.name, c.phone FROM c' }).fetchAll();
    console.log('Items count:', items.length);
    console.log(items);
    process.exit(0);
  } catch (err) {
    console.error('Cosmos test error:', err);
    process.exit(2);
  }
})();
