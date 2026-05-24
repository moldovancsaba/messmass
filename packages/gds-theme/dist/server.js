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
  extendGdsTheme: () => extendGdsTheme,
  gdsTheme: () => gdsTheme
});
module.exports = __toCommonJS(server_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  extendGdsTheme,
  gdsTheme
});
