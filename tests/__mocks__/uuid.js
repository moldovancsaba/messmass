// tests/__mocks__/uuid.js
// WHAT: CommonJS stand-in for the real uuid package in tests.
// WHY: uuid ships an ESM-only build under Jest's "node" resolution condition
//     (dist-node/index.js, `export ... from`), which Jest's CJS test runtime
//     cannot parse — any test whose import chain reaches lib/slugUtils.ts
//     fails with "Unexpected token 'export'" regardless of
//     transformIgnorePatterns, since next/jest's own transform config takes
//     precedence over a project override here. Real randomness isn't needed
//     in tests; only a valid v4-shaped string is.
function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = { v4 };
