// import { CosmosClient } from "@azure/cosmos";

// const client = new CosmosClient({
//   endpoint: process.env.COSMOS_DB_ENDPOINT,
//   key: process.env.COSMOS_DB_KEY,
// });

// export const database = client.database(process.env.COSMOS_DB_DATABASE);
// export const container = database.container(process.env.COSMOS_DB_CONTAINER);
// server/src/config/cosmos.js
// Mock Cosmos DB container
const mockData = [];

const container = {
  items: {
    readAll: async () => ({ resources: mockData }), // no fetchAll needed
    create: async (item) => {
      mockData.push(item);
      return { resource: item };
    },
  },
};

module.exports = { container };
