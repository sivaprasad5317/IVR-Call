// server/migrate-contacts-to-cosmos.cjs
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const fs = require('fs').promises;
const path = require('path');
const { CosmosClient } = require('@azure/cosmos');

(async () => {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  if (!endpoint || !key) throw new Error('COSMOS_ENDPOINT/COSMOS_KEY missing');

  const client = new CosmosClient({ endpoint, key });
  const dbId = process.env.COSMOS_DATABASE || 'ivrdb';
  const containerId = process.env.COSMOS_CONTAINER || 'contacts';
  const { database } = await client.databases.createIfNotExists({ id: dbId });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { kind: 'Hash', paths: ['/id'] },
  });

  const localPath = path.resolve(__dirname, 'src', 'data', 'contacts.json');
  const raw = await fs.readFile(localPath, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  const items = Array.isArray(parsed) ? parsed : Object.values(parsed);

  console.log(`Uploading ${items.length} contacts to ${dbId}/${containerId}...`);
  for (const it of items) {
    if (!it.id) it.id = (Math.random() + 1).toString(36).substring(2);
    try {
      await container.items.create(it, { partitionKey: it.id });
      console.log('Inserted:', it.id);
    } catch (e) {
      console.error('Insert failed:', e && e.message ? e.message : e);
    }
  }
  console.log('Migration complete');
})();
