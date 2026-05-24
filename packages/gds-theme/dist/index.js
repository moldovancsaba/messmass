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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  GdsProvider: () => GdsProvider,
  extendGdsTheme: () => extendGdsTheme,
  gdsTheme: () => gdsTheme,
  useGdsTranslation: () => useGdsTranslation
});
module.exports = __toCommonJS(index_exports);

// src/theme.ts
var import_core = require("@mantine/core");
var baseTheme = (0, import_core.mergeMantineTheme)(import_core.DEFAULT_THEME, (0, import_core.createTheme)({
  primaryColor: "violet",
  fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  fontSmoothing: true,
  defaultRadius: "md",
  black: "#111827",
  white: "#ffffff",
  headings: {
    fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
    sizes: {
      h1: { fontSize: "2.5rem", fontWeight: "800" },
      h2: { fontSize: "1.75rem", fontWeight: "700" },
      h3: { fontSize: "1.25rem", fontWeight: "600" }
    }
  },
  shadows: {
    md: "0 8px 24px rgba(15, 23, 42, 0.08)",
    lg: "0 16px 40px rgba(15, 23, 42, 0.12)"
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
        size: "sm",
        fw: 600
      },
      styles: {
        root: {
          transition: "transform 150ms ease, filter 120ms ease",
          "&:hover": {
            transform: "translateY(-1px)",
            filter: "brightness(1.05)"
          },
          "&:active": {
            transform: "translateY(0)",
            filter: "brightness(0.95)"
          }
        }
      }
    },
    Card: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
        withBorder: true
      },
      styles: {
        root: {
          backgroundColor: "var(--mantine-color-body)",
          transition: "transform 150ms ease, box-shadow 150ms ease"
        }
      }
    },
    Paper: {
      defaultProps: {
        radius: "lg",
        withBorder: true
      }
    },
    TextInput: {
      defaultProps: {
        radius: "md"
      }
    },
    Table: {
      defaultProps: {
        highlightOnHover: true,
        verticalSpacing: "md"
      }
    },
    Badge: {
      defaultProps: {
        radius: "xl"
      }
    }
  }
}));
var gdsTheme = baseTheme;
function extendGdsTheme(overrides = {}) {
  return (0, import_core.mergeMantineTheme)(baseTheme, overrides);
}

// src/GdsProvider.tsx
var import_core2 = require("@mantine/core");
var import_modals = require("@mantine/modals");
var import_notifications = require("@mantine/notifications");

// src/i18n.ts
var import_react = require("react");
var GdsI18nContext = (0, import_react.createContext)({
  locale: "en",
  messages: {}
});
function useGdsTranslation() {
  const { messages, locale } = (0, import_react.useContext)(GdsI18nContext);
  return {
    t: (id, defaultMessage) => messages[id] || defaultMessage,
    locale
  };
}

// src/GdsProvider.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function GdsProvider({ children, locale = "en", messages = {} }) {
  const isRtl = ["ar", "he"].includes(locale);
  const dir = isRtl ? "rtl" : "ltr";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core2.DirectionProvider, { initialDirection: dir, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GdsI18nContext.Provider, { value: { locale, messages }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core2.MantineProvider, { theme: gdsTheme, withCssVariables: true, withGlobalClasses: true, defaultColorScheme: "light", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_modals.ModalsProvider, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_notifications.Notifications, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core2.Box, { dir, h: "100%", children })
  ] }) }) }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GdsProvider,
  extendGdsTheme,
  gdsTheme,
  useGdsTranslation
});
