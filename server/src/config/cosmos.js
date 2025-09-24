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
