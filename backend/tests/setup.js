const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Allow extra time for first-run MongoDB binary download
jest.setTimeout(120000);

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clean all collections between tests — equivalent to delete-today-meals but for all data
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
