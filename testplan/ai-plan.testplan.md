# 🧠 Test Plan – .ai-plan.json

## Description
Defines how the application loads and executes a list of shell commands from `.ai-plan.json` using `AutoAIController`.

---

## ✅ Positive Scenarios

- [ ] If `.ai-plan.json` exists and contains valid commands, Auto AI executes them in order.
- [ ] Supports mixed format: strings and objects with `{ command, critical }`.
- [ ] Commands are logged correctly in `executionLog.json`.

---

## ❌ Negative Scenarios

- [ ] Missing `.ai-plan.json` → controller loads an empty list (no error thrown).
- [ ] Invalid JSON format → controller logs an error and aborts.
- [ ] Non-array structure → treated as empty command list, log reflects this.

---

## 📄 File Structure

- **Path**: `/Users/moldovan/Projects/messmass/.ai-plan.json`
- **Expected Format**: JSON array of strings or `{ command: string, critical: bool }`

---

## 🧪 Associated Module

- `src/AutoAIController.js`
