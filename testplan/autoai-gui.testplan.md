# 🖥️ Test Plan – Auto AI GUI Autostart

## Description
Defines expected GUI behavior when `.ai-plan.json` exists on app load. The system should trigger AutoAIController automatically and display results.

---

## ✅ Expected Behavior

- [ ] If `.ai-plan.json` exists on app start, Auto AI is launched immediately.
- [ ] While processing, the GUI shows a loading state: "🤖 Auto AI is running..."
- [ ] After completion, `executionLog.json` is parsed and displayed.
- [ ] Each command is shown with:
  - [ ] ✅ or ❌ indicator
  - [ ] Command string
  - [ ] Output or error message

---

## ❌ Failure Cases

- [ ] If `.ai-plan.json` is malformed, error is shown in output div.
- [ ] If controller throws during execution, error message is logged and GUI still loads.

---

## 🔁 Reset Button Behavior

- [ ] Clears both `.ai-plan.json` and `executionLog.json`
- [ ] Reloads page with empty state

---

## 🧪 Associated Modules

- `src/renderer.js`
- `src/AutoAIController.js`
- `.ai-plan.json`
