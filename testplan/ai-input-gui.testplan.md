# <0001f9df> Test Plan – AI Input GUI Integration

## Description
Tests the user interface flow that allows pasting AI-generated shell instructions into a textarea, and generating `.ai-plan.json` via the "💡 Generate Plan" button.

---

## ✅ Positive Scenarios

- [ ] Textarea is visible on app load
- [ ] User pastes valid AI response (with ```bash block) → clicks 💡 → `.ai-plan.json` is created
- [ ] Confirmation message appears: "✅ Plan generated. Reload to run."

---

## ❌ Negative Scenarios

- [ ] Empty textarea → clicking 💡 does not crash
- [ ] Malformed response (no code block) → empty `.ai-plan.json` (or not created)
- [ ] Input with shell comments → comments are ignored, commands parsed

---

## 🧾 UI Elements

- `#aiInput`: `<textarea>` to paste response
- `#planBtn`: "💡 Generate Plan from AI" button
- Alert: "✅ Plan generated. Reload to run."

---

## 🧪 Associated Files

- `src/index.html`
- `src/renderer.js`
- `src/AutoAIPlanner.js`
