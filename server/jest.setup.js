const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

// Globally mock BullMQ to prevent it from creating Redis connections that keep Jest open
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
      close: jest.fn().mockResolvedValue(true),
      on: jest.fn(),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(true),
    })),
  };
});
