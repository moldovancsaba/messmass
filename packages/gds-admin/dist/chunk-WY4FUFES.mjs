// src/FormSection.tsx
import { Box, Title, Text, Stack, Divider } from "@mantine/core";
import { jsx, jsxs } from "react/jsx-runtime";
function FormSection({ title, description, children, withDivider = true }) {
  return /* @__PURE__ */ jsxs(Box, { mb: "xl", children: [
    /* @__PURE__ */ jsxs(Box, { mb: "md", children: [
      /* @__PURE__ */ jsx(Title, { order: 4, children: title }),
      description && /* @__PURE__ */ jsx(Text, { c: "dimmed", size: "sm", children: description })
    ] }),
    /* @__PURE__ */ jsx(Stack, { gap: "md", children }),
    withDivider && /* @__PURE__ */ jsx(Divider, { my: "xl" })
  ] });
}

// src/StatsStrip.tsx
import { SimpleGrid, Paper, Text as Text2, Group, Box as Box2 } from "@mantine/core";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function StatsStrip({ stats }) {
  const items = stats.map((stat, index) => /* @__PURE__ */ jsx2(Paper, { p: "lg", withBorder: true, radius: "md", children: /* @__PURE__ */ jsxs2(Group, { justify: "space-between", align: "flex-end", gap: "xs", children: [
    /* @__PURE__ */ jsxs2(Box2, { children: [
      /* @__PURE__ */ jsx2(Text2, { c: "dimmed", tt: "uppercase", fw: 700, size: "xs", children: stat.label }),
      /* @__PURE__ */ jsx2(Text2, { fw: 700, size: "xl", mt: "sm", children: stat.value })
    ] }),
    stat.diff !== void 0 && /* @__PURE__ */ jsxs2(Text2, { c: stat.diff > 0 ? "teal" : "red", size: "sm", fw: 600, children: [
      stat.diff > 0 ? "+" : "",
      stat.diff,
      "%"
    ] })
  ] }) }, index));
  return /* @__PURE__ */ jsx2(SimpleGrid, { cols: { base: 1, sm: 2, md: 3 }, spacing: "md", children: items });
}

// src/InfoCard.tsx
import { Card, Text as Text3, Group as Group2, ThemeIcon, Box as Box3 } from "@mantine/core";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function InfoCard({ title, value, description, icon, color = "blue" }) {
  return /* @__PURE__ */ jsx3(Card, { p: "xl", children: /* @__PURE__ */ jsxs3(Group2, { justify: "space-between", align: "flex-start", wrap: "nowrap", children: [
    /* @__PURE__ */ jsxs3(Box3, { children: [
      /* @__PURE__ */ jsx3(Text3, { tt: "uppercase", fw: 700, c: "dimmed", size: "xs", children: title }),
      /* @__PURE__ */ jsx3(Text3, { fw: 700, size: "xl", mt: "sm", children: value }),
      description && /* @__PURE__ */ jsx3(Text3, { c: "dimmed", size: "sm", mt: "xs", children: description })
    ] }),
    icon && /* @__PURE__ */ jsx3(ThemeIcon, { size: "xl", radius: "md", variant: "light", color, children: icon })
  ] }) });
}

// src/PageHeader.tsx
import { Breadcrumbs, Group as Group3, Title as Title2, Text as Text4, Box as Box4, Stack as Stack2 } from "@mantine/core";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function PageHeader({ title, description, eyebrow, breadcrumbs, primaryAction, secondaryActions }) {
  return /* @__PURE__ */ jsxs4(Stack2, { gap: "sm", mb: "xl", children: [
    breadcrumbs?.length ? /* @__PURE__ */ jsx4(Breadcrumbs, { children: breadcrumbs }) : null,
    /* @__PURE__ */ jsxs4(Group3, { justify: "space-between", align: "flex-start", gap: "md", children: [
      /* @__PURE__ */ jsxs4(Box4, { children: [
        eyebrow ? /* @__PURE__ */ jsx4(Text4, { c: "dimmed", size: "sm", fw: 700, tt: "uppercase", mb: 4, children: eyebrow }) : null,
        /* @__PURE__ */ jsx4(Title2, { order: 1, children: title }),
        description && /* @__PURE__ */ jsx4(Text4, { c: "dimmed", mt: "xs", size: "lg", children: description })
      ] }),
      (secondaryActions || primaryAction) && /* @__PURE__ */ jsxs4(Group3, { children: [
        secondaryActions,
        primaryAction
      ] })
    ] })
  ] });
}

// src/WorkspaceHeader.tsx
import { Breadcrumbs as Breadcrumbs2, Group as Group4, Stack as Stack3, Text as Text5, Title as Title3 } from "@mantine/core";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function WorkspaceHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions
}) {
  return /* @__PURE__ */ jsxs5(Stack3, { gap: "sm", mb: "xl", children: [
    breadcrumbs?.length ? /* @__PURE__ */ jsx5(Breadcrumbs2, { children: breadcrumbs }) : null,
    eyebrow ? /* @__PURE__ */ jsx5(Text5, { size: "sm", fw: 700, c: "dimmed", tt: "uppercase", children: eyebrow }) : null,
    /* @__PURE__ */ jsxs5(Group4, { justify: "space-between", align: "flex-start", gap: "md", children: [
      /* @__PURE__ */ jsxs5(Stack3, { gap: 6, children: [
        /* @__PURE__ */ jsx5(Title3, { order: 1, children: title }),
        description ? /* @__PURE__ */ jsx5(Text5, { c: "dimmed", maw: 640, children: description }) : null
      ] }),
      /* @__PURE__ */ jsxs5(Group4, { gap: "sm", children: [
        secondaryActions,
        primaryAction
      ] })
    ] })
  ] });
}

export {
  FormSection,
  StatsStrip,
  InfoCard,
  PageHeader,
  WorkspaceHeader
};
