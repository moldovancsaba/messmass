// jest.setup.js
// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.DB_NAME = 'messmass_test'

if (!(global.document && global.document.body)) {
  global.document = {
    createElement: () => ({}),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  }
}
