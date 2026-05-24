"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server.ts
var server_exports = {};
__export(server_exports, {
  FormSection: () => FormSection,
  InfoCard: () => InfoCard,
  PageHeader: () => PageHeader,
  StatsStrip: () => StatsStrip,
  WorkspaceHeader: () => WorkspaceHeader
});
module.exports = __toCommonJS(server_exports);

// src/FormSection.tsx
var import_core = require("@mantine/core");
var import_jsx_runtime = require("react/jsx-runtime");
function FormSection({ title, description, children, withDivider = true }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_core.Box, { mb: "xl", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_core.Box, { mb: "md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Title, { order: 4, children: title }),
      description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Text, { c: "dimmed", size: "sm", children: description })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Stack, { gap: "md", children }),
    withDivider && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Divider, { my: "xl" })
  ] });
}

// src/StatsStrip.tsx
var import_core2 = require("@mantine/core");
var import_jsx_runtime2 = require("react/jsx-runtime");
function StatsStrip({ stats }) {
  const items = stats.map((stat, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core2.Paper, { p: "lg", withBorder: true, radius: "md", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_core2.Group, { justify: "space-between", align: "flex-end", gap: "xs", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_core2.Box, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core2.Text, { c: "dimmed", tt: "uppercase", fw: 700, size: "xs", children: stat.label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core2.Text, { fw: 700, size: "xl", mt: "sm", children: stat.value })
    ] }),
    stat.diff !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_core2.Text, { c: stat.diff > 0 ? "teal" : "red", size: "sm", fw: 600, children: [
      stat.diff > 0 ? "+" : "",
      stat.diff,
      "%"
    ] })
  ] }) }, index));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core2.SimpleGrid, { cols: { base: 1, sm: 2, md: 3 }, spacing: "md", children: items });
}

// src/InfoCard.tsx
var import_core3 = require("@mantine/core");
var import_jsx_runtime3 = require("react/jsx-runtime");
function InfoCard({ title, value, description, icon, color = "blue" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core3.Card, { p: "xl", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_core3.Group, { justify: "space-between", align: "flex-start", wrap: "nowrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_core3.Box, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core3.Text, { tt: "uppercase", fw: 700, c: "dimmed", size: "xs", children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core3.Text, { fw: 700, size: "xl", mt: "sm", children: value }),
      description && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core3.Text, { c: "dimmed", size: "sm", mt: "xs", children: description })
    ] }),
    icon && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core3.ThemeIcon, { size: "xl", radius: "md", variant: "light", color, children: icon })
  ] }) });
}

// src/PageHeader.tsx
var import_core4 = require("@mantine/core");
var import_jsx_runtime4 = require("react/jsx-runtime");
function PageHeader({ title, description, eyebrow, breadcrumbs, primaryAction, secondaryActions }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core4.Stack, { gap: "sm", mb: "xl", children: [
    breadcrumbs?.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core4.Breadcrumbs, { children: breadcrumbs }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core4.Group, { justify: "space-between", align: "flex-start", gap: "md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core4.Box, { children: [
        eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core4.Text, { c: "dimmed", size: "sm", fw: 700, tt: "uppercase", mb: 4, children: eyebrow }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core4.Title, { order: 1, children: title }),
        description && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core4.Text, { c: "dimmed", mt: "xs", size: "lg", children: description })
      ] }),
      (secondaryActions || primaryAction) && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core4.Group, { children: [
        secondaryActions,
        primaryAction
      ] })
    ] })
  ] });
}

// src/WorkspaceHeader.tsx
var import_core5 = require("@mantine/core");
var import_jsx_runtime5 = require("react/jsx-runtime");
function WorkspaceHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_core5.Stack, { gap: "sm", mb: "xl", children: [
    breadcrumbs?.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_core5.Breadcrumbs, { children: breadcrumbs }) : null,
    eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_core5.Text, { size: "sm", fw: 700, c: "dimmed", tt: "uppercase", children: eyebrow }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_core5.Group, { justify: "space-between", align: "flex-start", gap: "md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_core5.Stack, { gap: 6, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_core5.Title, { order: 1, children: title }),
        description ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_core5.Text, { c: "dimmed", maw: 640, children: description }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_core5.Group, { gap: "sm", children: [
        secondaryActions,
        primaryAction
      ] })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FormSection,
  InfoCard,
  PageHeader,
  StatsStrip,
  WorkspaceHeader
});
