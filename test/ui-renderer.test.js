const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

describe("UI Renderer (Smoke Test)", () => {
  const htmlPath = path.join(__dirname, "../src/index.html");
  let html;

  before(() => {
    html = fs.readFileSync(htmlPath, "utf-8");
  });

  it("should contain an output container", () => {
    expect(html).to.include('id="output"');
  });

  it("should contain an input field", () => {
    expect(html).to.include('id="cmd"');
  });

  it("should contain a prompt", () => {
    expect(html).to.include('id="prompt"');
  });

  it("should contain mode toggle", () => {
    expect(html).to.include('id="modeToggle"');
  });

  it("should contain auto toggle", () => {
    expect(html).to.include('id="autoToggle"');
  });

  it("should contain new session button", () => {
    expect(html).to.include('id="newSession"');
  });

  it("should contain run button", () => {
    expect(html).to.include('id="runButton"');
  });

  it("should load the renderer.js script", () => {
    expect(html).to.include('<script src="./renderer.js"></script>');
  });
});