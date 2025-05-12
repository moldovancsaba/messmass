# <0001f9e4> Test Plan – AI Behaviour and Execution

## 🎯 Purpose
Verify AI plan generation, Auto AI execution, and mode switching correctness.

---

## ✅ Positive Scenarios
- [ ] `generatePlan()` parses text to bash list
- [ ] AI Mode ON + AutoAI ON = plan is executed automatically
- [ ] AI Mode ON + AutoAI OFF = plan is created but not executed
- [ ] HUMAN Mode = AI is ignored

---

## 🚫 Negative Scenarios
- [ ] Invalid AI input = no plan generated
- [ ] Empty plan = user feedback
- [ ] Execution errors = handled gracefully

---

## 🔁 Reproducibility
Ensure consistent `.ai-plan.json` and proper execution logs.
