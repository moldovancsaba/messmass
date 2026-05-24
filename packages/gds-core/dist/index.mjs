import {
  ConfirmDialog,
  SemanticButton,
  ThemeToggle,
  UploadDropzone
} from "./chunk-LPAPO4EL.mjs";
import {
  AccessSummary,
  ArticleShell,
  AuthShell,
  DataToolbar,
  EmptyState,
  GdsIcons,
  GdsVocabulary,
  MediaCard,
  MetricCard,
  ProductCard,
  ProgressCard,
  PublicShell,
  StateBlock,
  StatusBadge,
  ar,
  de,
  en,
  fr,
  he,
  hu,
  it,
  ru
} from "./chunk-LYIFRKLS.mjs";

// src/FormField.tsx
import { Box, Stack, Text } from "@mantine/core";
import { jsx, jsxs } from "react/jsx-runtime";
function FormField({ label, description, error, children }) {
  return /* @__PURE__ */ jsx(Box, { component: "label", children: /* @__PURE__ */ jsxs(Stack, { gap: 4, children: [
    /* @__PURE__ */ jsx(Text, { size: "xs", fw: 600, c: "dimmed", children: label }),
    description ? /* @__PURE__ */ jsx(Text, { size: "xs", c: "dimmed", children: description }) : null,
    children,
    error ? /* @__PURE__ */ jsx(Text, { size: "xs", c: "red.7", children: error }) : null
  ] }) });
}
export {
  AccessSummary,
  ArticleShell,
  AuthShell,
  ConfirmDialog,
  DataToolbar,
  EmptyState,
  FormField,
  GdsIcons,
  GdsVocabulary,
  MediaCard,
  MetricCard,
  ProductCard,
  ProgressCard,
  PublicShell,
  SemanticButton,
  StateBlock,
  StatusBadge,
  ThemeToggle,
  UploadDropzone,
  ar,
  de,
  en,
  fr,
  he,
  hu,
  it,
  ru
};
