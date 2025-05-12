const fs = require("fs");
const path = require("path");

const SESSIONS_DIR = path.join(__dirname, "../../sessions");

function saveSession(sessionId, data) {
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  const filePath = path.join(SESSIONS_DIR, `session_${sessionId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function loadSession(sessionId) {
  const filePath = path.join(SESSIONS_DIR, `session_${sessionId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function listSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) return [];
  return fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith(".json"));
}

module.exports = { saveSession, loadSession, listSessions };