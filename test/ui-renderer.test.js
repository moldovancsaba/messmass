import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it } from 'mocha';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.resolve(__dirname, '../src/index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

describe("UI Renderer (Smoke Test)", () => {
  it("should contain an output container", () => {
    assert.ok(document.querySelector("#output"));
  });

  it("should contain an input field", () => {
    assert.ok(document.querySelector("#input"));
  });

  it("should contain a prompt", () => {
    assert.ok(document.querySelector("#prompt"));
  });

  it("should contain mode toggle", () => {
    assert.ok(document.querySelector("#toggleMode"));
  });

  it("should contain auto toggle", () => {
    assert.ok(document.querySelector("#toggleAuto"));
  });

  it("should contain new session button", () => {
    assert.ok(document.querySelector("#newSessionBtn"));
  });

  it("should contain run button", () => {
    assert.ok(document.querySelector("#runBtn"));
  });

  it("should load the renderer.js script", () => {
    const scripts = Array.from(document.querySelectorAll("script"));
    const found = scripts.some(script => script.src.includes("renderer.js"));
    assert.ok(found);
  });
});