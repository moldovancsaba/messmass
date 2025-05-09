# <0001f9dd> Test Plan – Terminal UI with AI Prompt Integration

## Description
Tests the core user interface that mimics a traditional terminal, including prompt display, command input, output flow, and AI-triggered plan generation.

---

## ✅ Positive Scenarios

- [ ] The terminal loads with greeting and prompt
- [ ] User types valid shell command → output shown in next line
- [ ] User types `ai: ...` prefixed text → AI response shown as `# AI: ...`
- [ ] AI response triggers `.ai-plan.json` generation
- [ ] All outputs scroll correctly as new lines are added

---

## ❌ Negative Scenarios

- [ ] Empty input → nothing happens
- [ ] Invalid shell command → error shown as `❌ ...`
- [ ] Malformed AI input → no crash, AI handled gracefully

---

## 🧾 UI Elements

- `#terminal` → displays prompt + output log
- `#cmdInput` → single-line shell-style input

---

## 🧪 Associated Modules

- `src/index.html`
- `src/renderer.js`
- `src/AutoAIPlanner.js`
- `src/execCommand.js`
