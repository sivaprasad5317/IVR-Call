// server/minimal-insert.cjs
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { CosmosClient } = require('@azure/cosmos');

(async () => {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  if (!endpoint || !key) {
    console.error('Missing COSMOS_ENDPOINT or COSMOS_KEY in server/.env');
    process.exit(1);
  }

  const client = new CosmosClient({ endpoint, key });

  try {
    console.log('Connecting to', endpoint);
    const dbId = process.env.COSMOS_DATABASE || 'ivrdb';
    const containerId = process.env.COSMOS_CONTAINER || 'contacts';

    const { database } = await client.databases.createIfNotExists({ id: dbId });
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { kind: 'Hash', paths: ['/id'] },
    });

    const testItem = { id: 'test-' + Date.now(), name: 'EMULATOR_TEST', phone: '000' };
    const { resource: created } = await container.items.create(testItem, { partitionKey: testItem.id });
    console.log('Created item id:', created.id);
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    console.error(err);
    process.exit(2);
  }
})();
