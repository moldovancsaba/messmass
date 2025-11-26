// jest.setup.js
// Add custom jest matchers from jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.DB_NAME = 'messmass_test'
