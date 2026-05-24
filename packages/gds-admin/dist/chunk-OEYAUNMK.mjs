// src/AppShell.tsx
import { AppShell as MantineAppShell, Burger, Group, Stack, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ThemeToggle } from "@gds/core";
import { jsx, jsxs } from "react/jsx-runtime";
function AppShell({ logoText = "GDS", navLinks, headerActions, mobileNavigation, children }) {
  const [opened, { toggle }] = useDisclosure();
  return /* @__PURE__ */ jsxs(
    MantineAppShell,
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
        /* @__PURE__ */ jsx(MantineAppShell.Header, { children: /* @__PURE__ */ jsxs(Group, { h: "100%", px: "md", justify: "space-between", children: [
          /* @__PURE__ */ jsxs(Group, { children: [
            /* @__PURE__ */ jsx(Burger, { opened, onClick: toggle, hiddenFrom: "sm", size: "sm" }),
            /* @__PURE__ */ jsx(Title, { order: 3, children: logoText })
          ] }),
          /* @__PURE__ */ jsxs(Group, { children: [
            headerActions,
            /* @__PURE__ */ jsx(ThemeToggle, {})
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(MantineAppShell.Navbar, { p: "md", children: /* @__PURE__ */ jsx(Stack, { gap: "xs", children: navLinks }) }),
        mobileNavigation ? /* @__PURE__ */ jsx(MantineAppShell.Footer, { children: /* @__PURE__ */ jsx(Group, { h: "100%", px: "md", justify: "space-around", wrap: "nowrap", children: mobileNavigation }) }) : null,
        /* @__PURE__ */ jsx(MantineAppShell.Main, { children })
      ]
    }
  );
}

// src/DataTable.tsx
import { Table, Paper, LoadingOverlay } from "@mantine/core";
import { useGdsTranslation } from "@gds/theme";
import { StateBlock } from "@gds/core";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function DataTable({ data, columns, loading = false, getRowKey }) {
  const { t } = useGdsTranslation();
  if (!data.length && !loading) {
    return /* @__PURE__ */ jsx2(Paper, { p: "xl", withBorder: true, children: /* @__PURE__ */ jsx2(
      StateBlock,
      {
        variant: "empty",
        title: t("gds.state.emptyDataTitle", "No data available"),
        description: t("gds.state.emptyData", "No data available."),
        compact: true
      }
    ) });
  }
  return /* @__PURE__ */ jsxs2(Paper, { withBorder: true, pos: "relative", style: { overflow: "hidden" }, children: [
    /* @__PURE__ */ jsx2(LoadingOverlay, { visible: loading, zIndex: 1e3, overlayProps: { radius: "sm", blur: 2 } }),
    /* @__PURE__ */ jsxs2(Table, { striped: true, highlightOnHover: true, children: [
      /* @__PURE__ */ jsx2(Table.Thead, { children: /* @__PURE__ */ jsx2(Table.Tr, { children: columns.map((col) => /* @__PURE__ */ jsx2(Table.Th, { children: col.label }, col.key)) }) }),
      /* @__PURE__ */ jsx2(Table.Tbody, { children: data.map((item, rowIndex) => /* @__PURE__ */ jsx2(Table.Tr, { children: columns.map((col) => /* @__PURE__ */ jsx2(Table.Td, { children: col.render ? col.render(item) : item[col.key] }, col.key)) }, getRowKey ? getRowKey(item, rowIndex) : rowIndex)) })
    ] })
  ] });
}

// src/SemanticNavLink.tsx
import { forwardRef } from "react";
import { NavLink, createPolymorphicComponent } from "@mantine/core";
import { useGdsTranslation as useGdsTranslation2 } from "@gds/theme";
import { GdsVocabulary } from "@gds/core";
import { jsx as jsx3 } from "react/jsx-runtime";
var _SemanticNavLink = forwardRef(
  ({ action, ...props }, ref) => {
    const { t } = useGdsTranslation2();
    const config = GdsVocabulary[action];
    const Icon = config.icon;
    return /* @__PURE__ */ jsx3(
      NavLink,
      {
        ref,
        label: t(config.id, config.defaultMessage),
        leftSection: /* @__PURE__ */ jsx3(Icon, { size: "1rem", stroke: 1.5 }),
        ...props
      }
    );
  }
);
var SemanticNavLink = createPolymorphicComponent(_SemanticNavLink);

// src/ResponsiveDataView.tsx
import React from "react";
import { SimpleGrid, Stack as Stack2 } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { StateBlock as StateBlock2 } from "@gds/core";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
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
  const isMobile = useMediaQuery("(max-width: 48em)");
  return /* @__PURE__ */ jsxs3(Stack2, { gap: "md", children: [
    toolbar,
    error ? /* @__PURE__ */ jsx4(StateBlock2, { variant: "error", title: "Unable to load data", description: error, compact: true }) : null,
    !error && !loading && data.length === 0 ? /* @__PURE__ */ jsx4(StateBlock2, { variant: "empty", title: emptyTitle, description: emptyDescription, compact: true }) : null,
    !error && isMobile && data.length > 0 ? /* @__PURE__ */ jsx4(SimpleGrid, { cols: { base: 1, sm: 2 }, spacing: "md", children: data.map((item, index) => /* @__PURE__ */ jsx4(React.Fragment, { children: renderCard(item, index) }, getRowKey ? getRowKey(item, index) : index)) }) : null,
    !error && !isMobile ? /* @__PURE__ */ jsx4(DataTable, { data, columns, loading, getRowKey }) : null
  ] });
}

// src/EditorScaffold.tsx
import { Grid, Stack as Stack3 } from "@mantine/core";
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function EditorScaffold({ header, form, preview, settings }) {
  return /* @__PURE__ */ jsxs4(Stack3, { gap: "lg", children: [
    header,
    /* @__PURE__ */ jsxs4(Grid, { gutter: "lg", align: "start", children: [
      /* @__PURE__ */ jsx5(Grid.Col, { span: { base: 12, md: preview ? 7 : 8 }, children: form }),
      preview || settings ? /* @__PURE__ */ jsx5(Grid.Col, { span: { base: 12, md: preview ? 5 : 4 }, children: /* @__PURE__ */ jsxs4(Stack3, { gap: "lg", children: [
        preview,
        settings
      ] }) }) : null
    ] })
  ] });
}

export {
  AppShell,
  DataTable,
  SemanticNavLink,
  ResponsiveDataView,
  EditorScaffold
};
