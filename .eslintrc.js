module.exports = {
  extends: ["next"],
  plugins: ["react"],
  rules: {
    "react/forbid-dom-props": [
      "warn",
      { forbid: ["style"] }
    ]
  }
};
