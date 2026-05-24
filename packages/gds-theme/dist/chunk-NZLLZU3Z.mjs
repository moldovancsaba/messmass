// src/theme.ts
import { DEFAULT_THEME, createTheme, mergeMantineTheme } from "@mantine/core";
var baseTheme = mergeMantineTheme(DEFAULT_THEME, createTheme({
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
  return mergeMantineTheme(baseTheme, overrides);
}

export {
  gdsTheme,
  extendGdsTheme
};
