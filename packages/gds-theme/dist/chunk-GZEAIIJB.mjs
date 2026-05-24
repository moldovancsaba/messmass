import {
  gdsTheme
} from "./chunk-NZLLZU3Z.mjs";

// src/i18n.ts
import { createContext, useContext } from "react";
var GdsI18nContext = createContext({
  locale: "en",
  messages: {}
});
function useGdsTranslation() {
  const { messages, locale } = useContext(GdsI18nContext);
  return {
    t: (id, defaultMessage) => messages[id] || defaultMessage,
    locale
  };
}

// src/GdsProvider.tsx
import { MantineProvider, DirectionProvider, Box } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { jsx, jsxs } from "react/jsx-runtime";
function GdsProvider({ children, locale = "en", messages = {} }) {
  const isRtl = ["ar", "he"].includes(locale);
  const dir = isRtl ? "rtl" : "ltr";
  return /* @__PURE__ */ jsx(DirectionProvider, { initialDirection: dir, children: /* @__PURE__ */ jsx(GdsI18nContext.Provider, { value: { locale, messages }, children: /* @__PURE__ */ jsx(MantineProvider, { theme: gdsTheme, withCssVariables: true, withGlobalClasses: true, defaultColorScheme: "light", children: /* @__PURE__ */ jsxs(ModalsProvider, { children: [
    /* @__PURE__ */ jsx(Notifications, {}),
    /* @__PURE__ */ jsx(Box, { dir, h: "100%", children })
  ] }) }) }) });
}

export {
  useGdsTranslation,
  GdsProvider
};
