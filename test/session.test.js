const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { saveSession, loadSession, listSessions } = require("../src/session/sessionManager");

describe("Session Management", () => {
  const testSessionId = "testsession";
  const sessionsDir = path.join(__dirname, "../sessions");
  const testFile = path.join(sessionsDir, `session_${testSessionId}.json`);

  const data = {
    terminal: ["echo test"],
    result: ["test"]
  };

  it("should save and load a session", () => {
    saveSession(testSessionId, data);
    const loaded = loadSession(testSessionId);
    expect(loaded).to.deep.equal(data);
  });

  it("should list saved sessions", () => {
    const files = listSessions();
    expect(files).to.include(`session_${testSessionId}.json`);
  });

  after(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });
});