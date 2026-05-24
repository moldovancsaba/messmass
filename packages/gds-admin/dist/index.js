"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AppShell: () => AppShell,
  DataTable: () => DataTable,
  EditorScaffold: () => EditorScaffold,
  FormSection: () => FormSection,
  InfoCard: () => InfoCard,
  PageHeader: () => PageHeader,
  ResponsiveDataView: () => ResponsiveDataView,
  SemanticNavLink: () => SemanticNavLink,
  StatsStrip: () => StatsStrip,
  WorkspaceHeader: () => WorkspaceHeader
});
module.exports = __toCommonJS(index_exports);

// src/AppShell.tsx
var import_core = require("@mantine/core");
var import_hooks = require("@mantine/hooks");
var import_core2 = require("@gds/core");
var import_jsx_runtime = require("react/jsx-runtime");
function AppShell({ logoText = "GDS", navLinks, headerActions, mobileNavigation, children }) {
  const [opened, { toggle }] = (0, import_hooks.useDisclosure)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_core.AppShell,
    {
      header: { height: 60 },
      footer: mobileNavigation ? { height: 68 } : void 0,
      navbar: {
        width: 250,
        breakpoint: "sm",
        collapsed: { mobile: !opened }
      },
      padding: "md",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.AppShell.Header, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_core.Group, { h: "100%", px: "md", justify: "space-between", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_core.Group, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Burger, { opened, onClick: toggle, hiddenFrom: "sm", size: "sm" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Title, { order: 3, children: logoText })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_core.Group, { children: [
            headerActions,
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core2.ThemeToggle, {})
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.AppShell.Navbar, { p: "md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Stack, { gap: "xs", children: navLinks }) }),
        mobileNavigation ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.AppShell.Footer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Group, { h: "100%", px: "md", justify: "space-around", wrap: "nowrap", children: mobileNavigation }) }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.AppShell.Main, { children })
      ]
    }
  );
}

// src/DataTable.tsx
var import_core3 = require("@mantine/core");
var import_theme = require("@gds/theme");
var import_core4 = require("@gds/core");
var import_jsx_runtime2 = require("react/jsx-runtime");
function DataTable({ data, columns, loading = false, getRowKey }) {
  const { t } = (0, import_theme.useGdsTranslation)();
  if (!data.length && !loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core3.Paper, { p: "xl", withBorder: true, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_core4.StateBlock,
      {
        variant: "empty",
        title: t("gds.state.emptyDataTitle", "No data available"),
        description: t("gds.state.emptyData", "No data available."),
        compact: true
      }
    ) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_core3.Paper, { withBorder: true, pos: "relative", style: { overflow: "hidden" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core3.LoadingOverlay, { visible: loading, zIndex: 1e3, overlayProps: { radius: "sm", blur: 2 } }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_core3.Table, { striped: true, highlightOnHover: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core3.Table.Thead, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core3.Table.Tr, { children: columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core3.Table.Th, { children: col.label }, col.key)) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core3.Table.Tbody, { children: data.map((item, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core3.Table.Tr, { children: columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core3.Table.Td, { children: col.render ? col.render(item) : item[col.key] }, col.key)) }, getRowKey ? getRowKey(item, rowIndex) : rowIndex)) })
    ] })
  ] });
}

// src/FormSection.tsx
var import_core5 = require("@mantine/core");
var import_jsx_runtime3 = require("react/jsx-runtime");
function FormSection({ title, description, children, withDivider = true }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_core5.Box, { mb: "xl", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_core5.Box, { mb: "md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core5.Title, { order: 4, children: title }),
      description && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core5.Text, { c: "dimmed", size: "sm", children: description })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core5.Stack, { gap: "md", children }),
    withDivider && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_core5.Divider, { my: "xl" })
  ] });
}

// src/StatsStrip.tsx
var import_core6 = require("@mantine/core");
var import_jsx_runtime4 = require("react/jsx-runtime");
function StatsStrip({ stats }) {
  const items = stats.map((stat, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core6.Paper, { p: "lg", withBorder: true, radius: "md", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core6.Group, { justify: "space-between", align: "flex-end", gap: "xs", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core6.Box, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core6.Text, { c: "dimmed", tt: "uppercase", fw: 700, size: "xs", children: stat.label }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core6.Text, { fw: 700, size: "xl", mt: "sm", children: stat.value })
    ] }),
    stat.diff !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core6.Text, { c: stat.diff > 0 ? "teal" : "red", size: "sm", fw: 600, children: [
      stat.diff > 0 ? "+" : "",
      stat.diff,
      "%"
    ] })
  ] }) }, index));
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core6.SimpleGrid, { cols: { base: 1, sm: 2, md: 3 }, spacing: "md", children: items });
}

// src/SemanticNavLink.tsx
var import_react = require("react");
var import_core7 = require("@mantine/core");
var import_theme2 = require("@gds/theme");
var import_core8 = require("@gds/core");
var import_jsx_runtime5 = require("react/jsx-runtime");
var _SemanticNavLink = (0, import_react.forwardRef)(
  ({ action, ...props }, ref) => {
    const { t } = (0, import_theme2.useGdsTranslation)();
    const config = import_core8.GdsVocabulary[action];
    const Icon = config.icon;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      import_core7.NavLink,
      {
        ref,
        label: t(config.id, config.defaultMessage),
        leftSection: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { size: "1rem", stroke: 1.5 }),
        ...props
      }
    );
  }
);
var SemanticNavLink = (0, import_core7.createPolymorphicComponent)(_SemanticNavLink);

// src/InfoCard.tsx
var import_core9 = require("@mantine/core");
var import_jsx_runtime6 = require("react/jsx-runtime");
function InfoCard({ title, value, description, icon, color = "blue" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core9.Card, { p: "xl", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_core9.Group, { justify: "space-between", align: "flex-start", wrap: "nowrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_core9.Box, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core9.Text, { tt: "uppercase", fw: 700, c: "dimmed", size: "xs", children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core9.Text, { fw: 700, size: "xl", mt: "sm", children: value }),
      description && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core9.Text, { c: "dimmed", size: "sm", mt: "xs", children: description })
    ] }),
    icon && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core9.ThemeIcon, { size: "xl", radius: "md", variant: "light", color, children: icon })
  ] }) });
}

// src/PageHeader.tsx
var import_core10 = require("@mantine/core");
var import_jsx_runtime7 = require("react/jsx-runtime");
function PageHeader({ title, description, eyebrow, breadcrumbs, primaryAction, secondaryActions }) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core10.Stack, { gap: "sm", mb: "xl", children: [
    breadcrumbs?.length ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core10.Breadcrumbs, { children: breadcrumbs }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core10.Group, { justify: "space-between", align: "flex-start", gap: "md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core10.Box, { children: [
        eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core10.Text, { c: "dimmed", size: "sm", fw: 700, tt: "uppercase", mb: 4, children: eyebrow }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core10.Title, { order: 1, children: title }),
        description && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core10.Text, { c: "dimmed", mt: "xs", size: "lg", children: description })
      ] }),
      (secondaryActions || primaryAction) && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core10.Group, { children: [
        secondaryActions,
        primaryAction
      ] })
    ] })
  ] });
}

// src/ResponsiveDataView.tsx
var import_react2 = __toESM(require("react"));
var import_core11 = require("@mantine/core");
var import_hooks2 = require("@mantine/hooks");
var import_core12 = require("@gds/core");
var import_jsx_runtime8 = require("react/jsx-runtime");
function ResponsiveDataView({
  data,
  columns,
  renderCard,
  loading = false,
  error,
  emptyTitle = "No results yet",
  emptyDescription = "Try changing filters or create a new record.",
  toolbar,
  getRowKey
}) {
  const isMobile = (0, import_hooks2.useMediaQuery)("(max-width: 48em)");
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_core11.Stack, { gap: "md", children: [
    toolbar,
    error ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core12.StateBlock, { variant: "error", title: "Unable to load data", description: error, compact: true }) : null,
    !error && !loading && data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core12.StateBlock, { variant: "empty", title: emptyTitle, description: emptyDescription, compact: true }) : null,
    !error && isMobile && data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core11.SimpleGrid, { cols: { base: 1, sm: 2 }, spacing: "md", children: data.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_react2.default.Fragment, { children: renderCard(item, index) }, getRowKey ? getRowKey(item, index) : index)) }) : null,
    !error && !isMobile ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(DataTable, { data, columns, loading, getRowKey }) : null
  ] });
}

// src/WorkspaceHeader.tsx
var import_core13 = require("@mantine/core");
var import_jsx_runtime9 = require("react/jsx-runtime");
function WorkspaceHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_core13.Stack, { gap: "sm", mb: "xl", children: [
    breadcrumbs?.length ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_core13.Breadcrumbs, { children: breadcrumbs }) : null,
    eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_core13.Text, { size: "sm", fw: 700, c: "dimmed", tt: "uppercase", children: eyebrow }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_core13.Group, { justify: "space-between", align: "flex-start", gap: "md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_core13.Stack, { gap: 6, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_core13.Title, { order: 1, children: title }),
        description ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_core13.Text, { c: "dimmed", maw: 640, children: description }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_core13.Group, { gap: "sm", children: [
        secondaryActions,
        primaryAction
      ] })
    ] })
  ] });
}

// src/EditorScaffold.tsx
var import_core14 = require("@mantine/core");
var import_jsx_runtime10 = require("react/jsx-runtime");
function EditorScaffold({ header, form, preview, settings }) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_core14.Stack, { gap: "lg", children: [
    header,
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_core14.Grid, { gutter: "lg", align: "start", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_core14.Grid.Col, { span: { base: 12, md: preview ? 7 : 8 }, children: form }),
      preview || settings ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_core14.Grid.Col, { span: { base: 12, md: preview ? 5 : 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_core14.Stack, { gap: "lg", children: [
        preview,
        settings
      ] }) }) : null
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AppShell,
  DataTable,
  EditorScaffold,
  FormSection,
  InfoCard,
  PageHeader,
  ResponsiveDataView,
  SemanticNavLink,
  StatsStrip,
  WorkspaceHeader
});
