import {
  GdsIcons,
  GdsVocabulary
} from "./chunk-LYIFRKLS.mjs";

// src/SemanticButton.tsx
import { useState, useEffect } from "react";
import { Button } from "@mantine/core";
import { useGdsTranslation } from "@gds/theme";
import { IconCheck, IconX } from "@tabler/icons-react";
import { jsx } from "react/jsx-runtime";
function SemanticButton({ action, loading, feedbackState, feedbackText, ...props }) {
  const { t } = useGdsTranslation();
  const config = GdsVocabulary[action];
  const [internalFeedback, setInternalFeedback] = useState(null);
  useEffect(() => {
    if (feedbackState) {
      setInternalFeedback(feedbackState);
      const timer = setTimeout(() => setInternalFeedback(null), 2e3);
      return () => clearTimeout(timer);
    }
  }, [feedbackState]);
  let Icon = config.icon;
  let label = t(config.id, config.defaultMessage);
  let color = props.color;
  if (internalFeedback === "success") {
    const defaultFeedback = "feedback" in config && config.feedback ? config.feedback : { icon: IconCheck, color: "teal", messageId: "gds.feedback.saved" };
    Icon = defaultFeedback.icon;
    label = feedbackText || t(defaultFeedback.messageId, "Success");
    color = defaultFeedback.color;
  } else if (internalFeedback === "error") {
    Icon = IconX;
    label = feedbackText || t("gds.feedback.error", "Something went wrong");
    color = "red";
  }
  return /* @__PURE__ */ jsx(
    Button,
    {
      leftSection: /* @__PURE__ */ jsx(Icon, { size: "1rem" }),
      loading,
      color,
      ...props,
      children: label
    }
  );
}

// src/ConfirmDialog.tsx
import { Modal, Group, Text } from "@mantine/core";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  children,
  confirmAction = "confirm",
  cancelAction = "cancel",
  isDanger = true,
  loading = false
}) {
  return /* @__PURE__ */ jsxs(Modal, { opened, onClose, title, centered: true, trapFocus: true, children: [
    /* @__PURE__ */ jsx2(Text, { size: "sm", mb: "xl", children }),
    /* @__PURE__ */ jsxs(Group, { justify: "flex-end", children: [
      /* @__PURE__ */ jsx2(SemanticButton, { action: cancelAction, variant: "default", onClick: onClose, disabled: loading }),
      /* @__PURE__ */ jsx2(SemanticButton, { action: confirmAction, color: isDanger ? "red" : "violet", onClick: onConfirm, loading })
    ] })
  ] });
}

// src/ThemeToggle.tsx
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { useGdsTranslation as useGdsTranslation2 } from "@gds/theme";
import { jsx as jsx3 } from "react/jsx-runtime";
function ThemeToggle({ size = "md" }) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const { t } = useGdsTranslation2();
  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
  };
  const isDark = computedColorScheme === "dark";
  return /* @__PURE__ */ jsx3(
    ActionIcon,
    {
      onClick: toggleColorScheme,
      variant: "default",
      size,
      "aria-label": t("gds.aria.themeToggle", "Toggle color scheme"),
      children: isDark ? /* @__PURE__ */ jsx3(GdsIcons.Sun, { size: "1.2rem" }) : /* @__PURE__ */ jsx3(GdsIcons.Moon, { size: "1.2rem" })
    }
  );
}

// src/UploadDropzone.tsx
import { useRef, useState as useState2 } from "react";
import { Box, Button as Button2, Group as Group2, Stack, Text as Text2 } from "@mantine/core";
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function UploadDropzone({
  title,
  description,
  onFilesSelected,
  accept,
  multiple = true,
  actionLabel = "Choose files"
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState2(false);
  const UploadIcon = GdsIcons.Upload;
  const forwardFiles = (files) => {
    if (!files?.length || !onFilesSelected) {
      return;
    }
    onFilesSelected(Array.from(files));
  };
  return /* @__PURE__ */ jsxs2(
    Box,
    {
      onDragOver: (event) => {
        event.preventDefault();
        setDragging(true);
      },
      onDragLeave: () => setDragging(false),
      onDrop: (event) => {
        event.preventDefault();
        setDragging(false);
        forwardFiles(event.dataTransfer.files);
      },
      p: "xl",
      style: {
        border: `1px dashed var(${dragging ? "--mantine-color-violet-6" : "--mantine-color-default-border"})`,
        borderRadius: "var(--mantine-radius-lg)",
        background: dragging ? "var(--mantine-color-violet-light)" : "transparent"
      },
      children: [
        /* @__PURE__ */ jsx4(
          "input",
          {
            ref: inputRef,
            type: "file",
            hidden: true,
            accept,
            multiple,
            onChange: (event) => forwardFiles(event.currentTarget.files)
          }
        ),
        /* @__PURE__ */ jsxs2(Stack, { align: "center", ta: "center", gap: "sm", children: [
          /* @__PURE__ */ jsx4(UploadIcon, { size: "1.5rem" }),
          /* @__PURE__ */ jsx4(Text2, { fw: 600, children: title }),
          description ? /* @__PURE__ */ jsx4(Text2, { size: "sm", c: "dimmed", children: description }) : null,
          /* @__PURE__ */ jsx4(Group2, { children: /* @__PURE__ */ jsx4(Button2, { variant: "light", onClick: () => inputRef.current?.click(), children: actionLabel }) })
        ] })
      ]
    }
  );
}

export {
  SemanticButton,
  ConfirmDialog,
  ThemeToggle,
  UploadDropzone
};
