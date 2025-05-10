import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionsDir = path.join(__dirname, "../../sessions");

export function saveSession(sessionId, data) {
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
  const filePath = path.join(sessionsDir, `${sessionId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function loadSession(sessionId) {
  const filePath = path.join(sessionsDir, `${sessionId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

export function listSessions() {
  if (!fs.existsSync(sessionsDir)) return [];
  return fs.readdirSync(sessionsDir).filter(file => file.endsWith(".json")).map(file => file.replace(".json", ""));
}