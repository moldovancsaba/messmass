// jest.setup.js
// Add custom jest matchers from jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.DB_NAME = 'messmass_test'

// WHAT: No test opens a real MongoDB connection.
// WHY: lib/mongodb.ts runs `getClientPromise()` when it is imported, and lib/db.ts imports
//     it, so any suite that reaches getDb() transitively (nine did) started a real
//     connect() to the dummy URI above, waited out the 15 s server-selection timeout, and
//     left a live timer behind: "A worker process has failed to exit gracefully", and with
//     `jest --runInBand` an unhandled MongoServerSelectionError after the run, exit code 1.
//     Three suites already mocked it one by one; this does it for all of them. A suite that
//     needs specific behaviour still calls jest.mock('@/lib/mongodb', ...) itself and wins.
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }),
}))

if (!(global.document && global.document.body)) {
  global.document = {
    createElement: () => ({}),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  }
}
