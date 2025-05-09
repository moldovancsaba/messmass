# 🤖 Test Plan – Auto AI Mode Execution Logic

## Description
Defines how the AI behaves in "Auto AI" mode: when it should run commands, handle sequences, errors, and determine when all tasks are complete.

---

## ✅ Expected Behavior

- [ ] When "Auto AI" is ON and the response contains one or more shell commands, each command is executed in order.
- [ ] AI waits for each command to complete before proceeding to the next.
- [ ] Execution results are logged per step, available in the UI.

---

## ❌ Failure Handling

- [ ] If a command fails, execution halts unless explicitly marked as "non-critical".
- [ ] Errors are shown to the user in real time.
- [ ] AI cannot proceed unless previous command is successful or skipped.

---

## 🔁 Completion Criteria

- [ ] When all executable blocks are processed, Auto AI mode stops
- [ ] AI gives summary if execution results are mixed (success/failures)
- [ ] The user can manually stop Auto AI at any point

---

## 🧪 Associated Modules

- `src/execCommand.js`
- Planned: `AutoAIController.js`
- Planned: `executionLog.json` or memory

