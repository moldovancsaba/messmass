import { expect } from "chai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadSession, saveSession, listSessions } from "../src/session/sessionManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Session Management", () => {
  const sessionId = "test-session";
  const sessionData = { prompt: "hello", response: "world" };
  const sessionsDir = path.join(__dirname, "../sessions");

  before(() => {
    if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);
  });

  after(() => {
    const sessionPath = path.join(sessionsDir, `${sessionId}.json`);
    if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
  });

  it("should save and load a session", () => {
    saveSession(sessionId, sessionData);
    const loaded = loadSession(sessionId);
    expect(loaded).to.deep.equal(sessionData);
  });

  it("should list saved sessions", () => {
    const list = listSessions();
    expect(list).to.include(sessionId);
  });
});