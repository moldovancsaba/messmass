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

// src/client.ts
var client_exports = {};
__export(client_exports, {
  AccessSummary: () => AccessSummary,
  ArticleShell: () => ArticleShell,
  AuthShell: () => AuthShell,
  ConfirmDialog: () => ConfirmDialog,
  DataToolbar: () => DataToolbar,
  EmptyState: () => EmptyState,
  GdsIcons: () => GdsIcons,
  GdsVocabulary: () => GdsVocabulary,
  MediaCard: () => MediaCard,
  MetricCard: () => MetricCard,
  ProductCard: () => ProductCard,
  ProgressCard: () => ProgressCard,
  PublicShell: () => PublicShell,
  SemanticButton: () => SemanticButton,
  StateBlock: () => StateBlock,
  StatusBadge: () => StatusBadge,
  ThemeToggle: () => ThemeToggle,
  UploadDropzone: () => UploadDropzone,
  ar: () => ar,
  de: () => de,
  en: () => en,
  fr: () => fr,
  he: () => he,
  hu: () => hu,
  it: () => it,
  ru: () => ru
});
module.exports = __toCommonJS(client_exports);

// src/StatusBadge.tsx
var import_core = require("@mantine/core");
var import_jsx_runtime = require("react/jsx-runtime");
var statusColorMap = {
  success: "green",
  warning: "yellow",
  danger: "red",
  info: "blue",
  neutral: "gray"
};
function StatusBadge({ status, children, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_core.Badge, { color: statusColorMap[status], variant: "light", ...props, children });
}

// src/EmptyState.tsx
var import_core2 = require("@mantine/core");
var import_jsx_runtime2 = require("react/jsx-runtime");
function EmptyState({ icon, title, description, action }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_core2.Stack, { align: "center", justify: "center", gap: "md", py: "xl", ta: "center", children: [
    icon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core2.Box, { c: "dimmed", children: icon }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core2.Title, { order: 3, children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core2.Text, { c: "dimmed", maw: 400, children: description }),
    action && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_core2.Box, { mt: "md", children: action })
  ] });
}

// src/ConfirmDialog.tsx
var import_core4 = require("@mantine/core");

// src/SemanticButton.tsx
var import_react = require("react");
var import_core3 = require("@mantine/core");
var import_theme = require("@gds/theme");
var import_icons_react2 = require("@tabler/icons-react");

// src/icons.ts
var import_icons_react = require("@tabler/icons-react");
var GdsIcons = {
  // Navigation
  Dashboard: import_icons_react.IconDashboard,
  Settings: import_icons_react.IconSettings,
  Users: import_icons_react.IconUsers,
  Analytics: import_icons_react.IconChartBar,
  Home: import_icons_react.IconHome,
  Inbox: import_icons_react.IconInbox,
  Calendar: import_icons_react.IconCalendar,
  Gallery: import_icons_react.IconPhoto,
  History: import_icons_react.IconHistory,
  Profile: import_icons_react.IconUser,
  // Actions
  Add: import_icons_react.IconPlus,
  Edit: import_icons_react.IconEdit,
  Delete: import_icons_react.IconTrash,
  Search: import_icons_react.IconSearch,
  Save: import_icons_react.IconDeviceFloppy,
  Play: import_icons_react.IconPlayerPlay,
  Start: import_icons_react.IconRocket,
  Send: import_icons_react.IconSend,
  Reply: import_icons_react.IconArrowBackUp,
  Forward: import_icons_react.IconArrowForwardUp,
  Attach: import_icons_react.IconPaperclip,
  Upload: import_icons_react.IconUpload,
  Download: import_icons_react.IconDownload,
  Print: import_icons_react.IconPrinter,
  Copy: import_icons_react.IconCopy,
  Duplicate: import_icons_react.IconCopyPlus,
  Check: import_icons_react.IconSquareCheck,
  Uncheck: import_icons_react.IconSquareX,
  Complete: import_icons_react.IconChecks,
  Clear: import_icons_react.IconClearAll,
  Cancel: import_icons_react.IconBan,
  Confirm: import_icons_react.IconThumbUp,
  Close: import_icons_react.IconX,
  // Preferences & System
  Language: import_icons_react.IconLanguage,
  Theme: import_icons_react.IconPalette,
  // Media
  Capture: import_icons_react.IconCamera,
  Record: import_icons_react.IconVideo,
  Flip: import_icons_react.IconCameraRotate,
  Flash: import_icons_react.IconBolt,
  // Domain specific
  Course: import_icons_react.IconBook,
  Lesson: import_icons_react.IconNotebook,
  Certificate: import_icons_react.IconCertificate,
  Student: import_icons_react.IconSchool,
  Class: import_icons_react.IconBooks,
  Grade: import_icons_react.IconAward,
  Child: import_icons_react.IconMoodKid,
  Family: import_icons_react.IconUsersGroup,
  Habit: import_icons_react.IconTarget,
  Goal: import_icons_react.IconFlag,
  Streak: import_icons_react.IconFlame,
  Reward: import_icons_react.IconGift,
  // Feedback
  Success: import_icons_react.IconCheck,
  Warning: import_icons_react.IconAlertTriangle,
  Danger: import_icons_react.IconAlertCircle,
  Info: import_icons_react.IconInfoCircle,
  // Analysis additions
  Trophy: import_icons_react.IconTrophy,
  Crown: import_icons_react.IconCrown,
  Pause: import_icons_react.IconPlayerPause,
  Message: import_icons_react.IconMessage,
  Mail: import_icons_react.IconMail,
  Refresh: import_icons_react.IconRefresh,
  TrendingUp: import_icons_react.IconTrendingUp,
  TrendingDown: import_icons_react.IconTrendingDown,
  Currency: import_icons_react.IconCurrencyDollar,
  Grid: import_icons_react.IconLayoutGrid,
  List: import_icons_react.IconList,
  Logout: import_icons_react.IconDoorExit,
  Notifications: import_icons_react.IconBell,
  Back: import_icons_react.IconArrowLeft,
  Eye: import_icons_react.IconEye,
  EyeOff: import_icons_react.IconEyeOff,
  Help: import_icons_react.IconHelpCircle,
  Filter: import_icons_react.IconFilter,
  Sort: import_icons_react.IconArrowsSort,
  // New Audit-driven additions
  Export: import_icons_react.IconFileExport,
  Import: import_icons_react.IconFileImport,
  Preview: import_icons_react.IconEye,
  Clone: import_icons_react.IconCopy,
  Restore: import_icons_react.IconTrashOff,
  Toggle: import_icons_react.IconToggleLeft,
  Submit: import_icons_react.IconCheck,
  Reset: import_icons_react.IconRefresh,
  Login: import_icons_react.IconLogin,
  Register: import_icons_react.IconUserPlus,
  Verify: import_icons_react.IconShieldCheck,
  Launch: import_icons_react.IconRocket,
  Draft: import_icons_react.IconFileText,
  Refer: import_icons_react.IconShare,
  Evidence: import_icons_react.IconPaperclip,
  // System
  ChevronDown: import_icons_react.IconChevronDown,
  ChevronUp: import_icons_react.IconChevronUp,
  Menu: import_icons_react.IconMenu2,
  Moon: import_icons_react.IconMoon,
  Sun: import_icons_react.IconSun
};

// src/vocabulary.ts
var GdsVocabulary = {
  // Base
  settings: { id: "gds.action.settings", defaultMessage: "Settings", icon: GdsIcons.Settings, feedback: { icon: GdsIcons.Settings, color: "teal", messageId: "gds.feedback.saved" } },
  analytics: { id: "gds.action.analytics", defaultMessage: "Analytics", icon: GdsIcons.Analytics, feedback: { icon: GdsIcons.Analytics, color: "teal", messageId: "gds.feedback.loaded" } },
  dashboard: { id: "gds.action.dashboard", defaultMessage: "Dashboard", icon: GdsIcons.Dashboard, feedback: { icon: GdsIcons.Dashboard, color: "teal", messageId: "gds.feedback.loaded" } },
  play: { id: "gds.action.play", defaultMessage: "Play", icon: GdsIcons.Play, feedback: { icon: GdsIcons.Play, color: "teal", messageId: "gds.feedback.started" } },
  start: { id: "gds.action.start", defaultMessage: "Start", icon: GdsIcons.Start, feedback: { icon: GdsIcons.Start, color: "teal", messageId: "gds.feedback.started" } },
  users: { id: "gds.action.users", defaultMessage: "Users", icon: GdsIcons.Users, feedback: { icon: GdsIcons.Users, color: "teal", messageId: "gds.feedback.loaded" } },
  add: { id: "gds.action.add", defaultMessage: "Add", icon: GdsIcons.Add, feedback: { icon: GdsIcons.Add, color: "teal", messageId: "gds.feedback.added" } },
  edit: { id: "gds.action.edit", defaultMessage: "Edit", icon: GdsIcons.Edit, feedback: { icon: GdsIcons.Edit, color: "teal", messageId: "gds.feedback.edited" } },
  delete: { id: "gds.action.delete", defaultMessage: "Delete", icon: GdsIcons.Delete, feedback: { icon: GdsIcons.Delete, color: "red", messageId: "gds.feedback.deleted" } },
  save: { id: "gds.action.save", defaultMessage: "Save", icon: GdsIcons.Save, feedback: { icon: GdsIcons.Save, color: "teal", messageId: "gds.feedback.saved" } },
  cancel: { id: "gds.action.cancel", defaultMessage: "Cancel", icon: GdsIcons.Cancel, feedback: { icon: GdsIcons.Cancel, color: "red", messageId: "gds.feedback.canceled" } },
  confirm: { id: "gds.action.confirm", defaultMessage: "Confirm", icon: GdsIcons.Confirm, feedback: { icon: GdsIcons.Confirm, color: "teal", messageId: "gds.feedback.confirmed" } },
  close: { id: "gds.action.close", defaultMessage: "Close", icon: GdsIcons.Close, feedback: { icon: GdsIcons.Close, color: "gray", messageId: "gds.feedback.closed" } },
  language: { id: "gds.action.language", defaultMessage: "Language", icon: GdsIcons.Language, feedback: { icon: GdsIcons.Language, color: "teal", messageId: "gds.feedback.changed" } },
  theme: { id: "gds.action.theme", defaultMessage: "Theme", icon: GdsIcons.Theme, feedback: { icon: GdsIcons.Theme, color: "teal", messageId: "gds.feedback.changed" } },
  // Navigation
  home: { id: "gds.action.home", defaultMessage: "Home", icon: GdsIcons.Home, feedback: { icon: GdsIcons.Home, color: "teal", messageId: "gds.feedback.opened" } },
  inbox: { id: "gds.action.inbox", defaultMessage: "Inbox", icon: GdsIcons.Inbox, feedback: { icon: GdsIcons.Inbox, color: "teal", messageId: "gds.feedback.opened" } },
  calendar: { id: "gds.action.calendar", defaultMessage: "Calendar", icon: GdsIcons.Calendar, feedback: { icon: GdsIcons.Calendar, color: "teal", messageId: "gds.feedback.opened" } },
  gallery: { id: "gds.action.gallery", defaultMessage: "Gallery", icon: GdsIcons.Gallery, feedback: { icon: GdsIcons.Gallery, color: "teal", messageId: "gds.feedback.opened" } },
  history: { id: "gds.action.history", defaultMessage: "History", icon: GdsIcons.History, feedback: { icon: GdsIcons.History, color: "teal", messageId: "gds.feedback.opened" } },
  profile: { id: "gds.action.profile", defaultMessage: "Profile", icon: GdsIcons.Profile, feedback: { icon: GdsIcons.Profile, color: "teal", messageId: "gds.feedback.opened" } },
  // Actions
  send: { id: "gds.action.send", defaultMessage: "Send", icon: GdsIcons.Send, feedback: { icon: GdsIcons.Send, color: "blue", messageId: "gds.feedback.sent" } },
  reply: { id: "gds.action.reply", defaultMessage: "Reply", icon: GdsIcons.Reply, feedback: { icon: GdsIcons.Reply, color: "blue", messageId: "gds.feedback.replied" } },
  forward: { id: "gds.action.forward", defaultMessage: "Forward", icon: GdsIcons.Forward, feedback: { icon: GdsIcons.Forward, color: "blue", messageId: "gds.feedback.forwarded" } },
  attach: { id: "gds.action.attach", defaultMessage: "Attach", icon: GdsIcons.Attach, feedback: { icon: GdsIcons.Attach, color: "teal", messageId: "gds.feedback.attached" } },
  upload: { id: "gds.action.upload", defaultMessage: "Upload", icon: GdsIcons.Upload, feedback: { icon: GdsIcons.Upload, color: "teal", messageId: "gds.feedback.uploaded" } },
  download: { id: "gds.action.download", defaultMessage: "Download", icon: GdsIcons.Download, feedback: { icon: GdsIcons.Download, color: "teal", messageId: "gds.feedback.downloaded" } },
  print: { id: "gds.action.print", defaultMessage: "Print", icon: GdsIcons.Print, feedback: { icon: GdsIcons.Print, color: "teal", messageId: "gds.feedback.printed" } },
  copy: { id: "gds.action.copy", defaultMessage: "Copy", icon: GdsIcons.Copy, feedback: { icon: GdsIcons.Copy, color: "teal", messageId: "gds.feedback.copied" } },
  duplicate: { id: "gds.action.duplicate", defaultMessage: "Duplicate", icon: GdsIcons.Duplicate, feedback: { icon: GdsIcons.Duplicate, color: "teal", messageId: "gds.feedback.duplicated" } },
  check: { id: "gds.action.check", defaultMessage: "Check", icon: GdsIcons.Check, feedback: { icon: GdsIcons.Check, color: "teal", messageId: "gds.feedback.checked" } },
  uncheck: { id: "gds.action.uncheck", defaultMessage: "Uncheck", icon: GdsIcons.Uncheck, feedback: { icon: GdsIcons.Uncheck, color: "red", messageId: "gds.feedback.unchecked" } },
  complete: { id: "gds.action.complete", defaultMessage: "Complete", icon: GdsIcons.Complete, feedback: { icon: GdsIcons.Complete, color: "teal", messageId: "gds.feedback.completed" } },
  clear: { id: "gds.action.clear", defaultMessage: "Clear", icon: GdsIcons.Clear, feedback: { icon: GdsIcons.Clear, color: "red", messageId: "gds.feedback.cleared" } },
  // Media (camera project)
  capture: { id: "gds.action.capture", defaultMessage: "Capture", icon: GdsIcons.Capture, feedback: { icon: GdsIcons.Capture, color: "teal", messageId: "gds.feedback.captured" } },
  record: { id: "gds.action.record", defaultMessage: "Record", icon: GdsIcons.Record, feedback: { icon: GdsIcons.Record, color: "teal", messageId: "gds.feedback.recorded" } },
  flip: { id: "gds.action.flip", defaultMessage: "Flip", icon: GdsIcons.Flip, feedback: { icon: GdsIcons.Flip, color: "teal", messageId: "gds.feedback.flipped" } },
  flash: { id: "gds.action.flash", defaultMessage: "Flash", icon: GdsIcons.Flash, feedback: { icon: GdsIcons.Flash, color: "teal", messageId: "gds.feedback.flashed" } },
  // Domain specific (amanoba, classscout, kidex, habigoal)
  course: { id: "gds.action.course", defaultMessage: "Course", icon: GdsIcons.Course, feedback: { icon: GdsIcons.Course, color: "teal", messageId: "gds.feedback.done" } },
  lesson: { id: "gds.action.lesson", defaultMessage: "Lesson", icon: GdsIcons.Lesson, feedback: { icon: GdsIcons.Lesson, color: "teal", messageId: "gds.feedback.done" } },
  certificate: { id: "gds.action.certificate", defaultMessage: "Certificate", icon: GdsIcons.Certificate, feedback: { icon: GdsIcons.Certificate, color: "teal", messageId: "gds.feedback.done" } },
  student: { id: "gds.action.student", defaultMessage: "Student", icon: GdsIcons.Student, feedback: { icon: GdsIcons.Student, color: "teal", messageId: "gds.feedback.done" } },
  class: { id: "gds.action.class", defaultMessage: "Class", icon: GdsIcons.Class, feedback: { icon: GdsIcons.Class, color: "teal", messageId: "gds.feedback.done" } },
  grade: { id: "gds.action.grade", defaultMessage: "Grade", icon: GdsIcons.Grade, feedback: { icon: GdsIcons.Grade, color: "teal", messageId: "gds.feedback.done" } },
  child: { id: "gds.action.child", defaultMessage: "Child", icon: GdsIcons.Child, feedback: { icon: GdsIcons.Child, color: "teal", messageId: "gds.feedback.done" } },
  family: { id: "gds.action.family", defaultMessage: "Family", icon: GdsIcons.Family, feedback: { icon: GdsIcons.Family, color: "teal", messageId: "gds.feedback.done" } },
  habit: { id: "gds.action.habit", defaultMessage: "Habit", icon: GdsIcons.Habit, feedback: { icon: GdsIcons.Habit, color: "teal", messageId: "gds.feedback.done" } },
  goal: { id: "gds.action.goal", defaultMessage: "Goal", icon: GdsIcons.Goal, feedback: { icon: GdsIcons.Goal, color: "teal", messageId: "gds.feedback.done" } },
  streak: { id: "gds.action.streak", defaultMessage: "Streak", icon: GdsIcons.Streak, feedback: { icon: GdsIcons.Streak, color: "teal", messageId: "gds.feedback.done" } },
  reward: { id: "gds.action.reward", defaultMessage: "Reward", icon: GdsIcons.Reward, feedback: { icon: GdsIcons.Reward, color: "yellow", messageId: "gds.feedback.rewarded" } },
  // Codebase analysis additions
  trophy: { id: "gds.action.trophy", defaultMessage: "Trophy", icon: GdsIcons.Trophy, feedback: { icon: GdsIcons.Trophy, color: "yellow", messageId: "gds.feedback.rewarded" } },
  crown: { id: "gds.action.crown", defaultMessage: "Crown", icon: GdsIcons.Crown, feedback: { icon: GdsIcons.Crown, color: "yellow", messageId: "gds.feedback.rewarded" } },
  pause: { id: "gds.action.pause", defaultMessage: "Pause", icon: GdsIcons.Pause, feedback: { icon: GdsIcons.Pause, color: "teal", messageId: "gds.feedback.paused" } },
  message: { id: "gds.action.message", defaultMessage: "Message", icon: GdsIcons.Message, feedback: { icon: GdsIcons.Message, color: "blue", messageId: "gds.feedback.sent" } },
  mail: { id: "gds.action.mail", defaultMessage: "Mail", icon: GdsIcons.Mail, feedback: { icon: GdsIcons.Mail, color: "blue", messageId: "gds.feedback.mailed" } },
  refresh: { id: "gds.action.refresh", defaultMessage: "Refresh", icon: GdsIcons.Refresh, feedback: { icon: GdsIcons.Refresh, color: "teal", messageId: "gds.feedback.refreshed" } },
  trendingUp: { id: "gds.action.trendingUp", defaultMessage: "Trending Up", icon: GdsIcons.TrendingUp, feedback: { icon: GdsIcons.TrendingUp, color: "teal", messageId: "gds.feedback.done" } },
  trendingDown: { id: "gds.action.trendingDown", defaultMessage: "Trending Down", icon: GdsIcons.TrendingDown, feedback: { icon: GdsIcons.TrendingDown, color: "teal", messageId: "gds.feedback.done" } },
  currency: { id: "gds.action.currency", defaultMessage: "Currency", icon: GdsIcons.Currency, feedback: { icon: GdsIcons.Currency, color: "teal", messageId: "gds.feedback.done" } },
  grid: { id: "gds.action.grid", defaultMessage: "Grid", icon: GdsIcons.Grid, feedback: { icon: GdsIcons.Grid, color: "teal", messageId: "gds.feedback.done" } },
  list: { id: "gds.action.list", defaultMessage: "List", icon: GdsIcons.List, feedback: { icon: GdsIcons.List, color: "teal", messageId: "gds.feedback.done" } },
  logout: { id: "gds.action.logout", defaultMessage: "Logout", icon: GdsIcons.Logout, feedback: { icon: GdsIcons.Logout, color: "teal", messageId: "gds.feedback.loggedOut" } },
  notifications: { id: "gds.action.notifications", defaultMessage: "Notifications", icon: GdsIcons.Notifications, feedback: { icon: GdsIcons.Notifications, color: "teal", messageId: "gds.feedback.done" } },
  back: { id: "gds.action.back", defaultMessage: "Back", icon: GdsIcons.Back, feedback: { icon: GdsIcons.Back, color: "teal", messageId: "gds.feedback.done" } },
  eye: { id: "gds.action.eye", defaultMessage: "View", icon: GdsIcons.Eye, feedback: { icon: GdsIcons.Eye, color: "teal", messageId: "gds.feedback.done" } },
  eyeOff: { id: "gds.action.eyeOff", defaultMessage: "Hide", icon: GdsIcons.EyeOff, feedback: { icon: GdsIcons.EyeOff, color: "teal", messageId: "gds.feedback.done" } },
  help: { id: "gds.action.help", defaultMessage: "Help", icon: GdsIcons.Help, feedback: { icon: GdsIcons.Help, color: "teal", messageId: "gds.feedback.done" } },
  filter: { id: "gds.action.filter", defaultMessage: "Filter", icon: GdsIcons.Filter, feedback: { icon: GdsIcons.Filter, color: "teal", messageId: "gds.feedback.filtered" } },
  sort: { id: "gds.action.sort", defaultMessage: "Sort", icon: GdsIcons.Sort, feedback: { icon: GdsIcons.Sort, color: "teal", messageId: "gds.feedback.sorted" } },
  // Audit-driven additions
  export: { id: "gds.action.export", defaultMessage: "Export", icon: GdsIcons.Export, feedback: { icon: GdsIcons.Export, color: "teal", messageId: "gds.feedback.exported" } },
  import: { id: "gds.action.import", defaultMessage: "Import", icon: GdsIcons.Import, feedback: { icon: GdsIcons.Import, color: "teal", messageId: "gds.feedback.imported" } },
  preview: { id: "gds.action.preview", defaultMessage: "Preview", icon: GdsIcons.Preview, feedback: { icon: GdsIcons.Preview, color: "teal", messageId: "gds.feedback.previewed" } },
  clone: { id: "gds.action.clone", defaultMessage: "Clone", icon: GdsIcons.Clone, feedback: { icon: GdsIcons.Clone, color: "teal", messageId: "gds.feedback.cloned" } },
  restore: { id: "gds.action.restore", defaultMessage: "Restore", icon: GdsIcons.Restore, feedback: { icon: GdsIcons.Restore, color: "teal", messageId: "gds.feedback.restored" } },
  toggle: { id: "gds.action.toggle", defaultMessage: "Toggle", icon: GdsIcons.Toggle, feedback: { icon: GdsIcons.Toggle, color: "teal", messageId: "gds.feedback.toggled" } },
  search: { id: "gds.action.search", defaultMessage: "Search", icon: GdsIcons.Search, feedback: { icon: GdsIcons.Search, color: "teal", messageId: "gds.feedback.searched" } },
  submit: { id: "gds.action.submit", defaultMessage: "Submit", icon: GdsIcons.Submit, feedback: { icon: GdsIcons.Submit, color: "teal", messageId: "gds.feedback.submitted" } },
  reset: { id: "gds.action.reset", defaultMessage: "Reset", icon: GdsIcons.Reset, feedback: { icon: GdsIcons.Reset, color: "red", messageId: "gds.feedback.reset" } },
  login: { id: "gds.action.login", defaultMessage: "Login", icon: GdsIcons.Login, feedback: { icon: GdsIcons.Login, color: "teal", messageId: "gds.feedback.loggedIn" } },
  register: { id: "gds.action.register", defaultMessage: "Register", icon: GdsIcons.Register, feedback: { icon: GdsIcons.Register, color: "teal", messageId: "gds.feedback.registered" } },
  verify: { id: "gds.action.verify", defaultMessage: "Verify", icon: GdsIcons.Verify, feedback: { icon: GdsIcons.Verify, color: "teal", messageId: "gds.feedback.verified" } },
  launch: { id: "gds.action.launch", defaultMessage: "Launch", icon: GdsIcons.Launch, feedback: { icon: GdsIcons.Launch, color: "purple", messageId: "gds.feedback.launched" } },
  draft: { id: "gds.action.draft", defaultMessage: "Draft", icon: GdsIcons.Draft, feedback: { icon: GdsIcons.Draft, color: "teal", messageId: "gds.feedback.drafted" } },
  refer: { id: "gds.action.refer", defaultMessage: "Refer", icon: GdsIcons.Refer, feedback: { icon: GdsIcons.Refer, color: "teal", messageId: "gds.feedback.referred" } },
  evidence: { id: "gds.action.evidence", defaultMessage: "Evidence", icon: GdsIcons.Evidence, feedback: { icon: GdsIcons.Evidence, color: "teal", messageId: "gds.feedback.added" } }
};

// src/SemanticButton.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function SemanticButton({ action, loading, feedbackState, feedbackText, ...props }) {
  const { t } = (0, import_theme.useGdsTranslation)();
  const config = GdsVocabulary[action];
  const [internalFeedback, setInternalFeedback] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
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
    const defaultFeedback = "feedback" in config && config.feedback ? config.feedback : { icon: import_icons_react2.IconCheck, color: "teal", messageId: "gds.feedback.saved" };
    Icon = defaultFeedback.icon;
    label = feedbackText || t(defaultFeedback.messageId, "Success");
    color = defaultFeedback.color;
  } else if (internalFeedback === "error") {
    Icon = import_icons_react2.IconX;
    label = feedbackText || t("gds.feedback.error", "Something went wrong");
    color = "red";
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    import_core3.Button,
    {
      leftSection: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { size: "1rem" }),
      loading,
      color,
      ...props,
      children: label
    }
  );
}

// src/ConfirmDialog.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core4.Modal, { opened, onClose, title, centered: true, trapFocus: true, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_core4.Text, { size: "sm", mb: "xl", children }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_core4.Group, { justify: "flex-end", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(SemanticButton, { action: cancelAction, variant: "default", onClick: onClose, disabled: loading }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(SemanticButton, { action: confirmAction, color: isDanger ? "red" : "violet", onClick: onConfirm, loading })
    ] })
  ] });
}

// src/ThemeToggle.tsx
var import_core5 = require("@mantine/core");
var import_theme2 = require("@gds/theme");
var import_jsx_runtime5 = require("react/jsx-runtime");
function ThemeToggle({ size = "md" }) {
  const { setColorScheme } = (0, import_core5.useMantineColorScheme)();
  const computedColorScheme = (0, import_core5.useComputedColorScheme)("light", { getInitialValueInEffect: true });
  const { t } = (0, import_theme2.useGdsTranslation)();
  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
  };
  const isDark = computedColorScheme === "dark";
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    import_core5.ActionIcon,
    {
      onClick: toggleColorScheme,
      variant: "default",
      size,
      "aria-label": t("gds.aria.themeToggle", "Toggle color scheme"),
      children: isDark ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(GdsIcons.Sun, { size: "1.2rem" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(GdsIcons.Moon, { size: "1.2rem" })
    }
  );
}

// src/MetricCard.tsx
var import_core6 = require("@mantine/core");
var import_jsx_runtime6 = require("react/jsx-runtime");
var trendColors = {
  positive: "teal",
  negative: "red",
  neutral: "gray"
};
function MetricCard({ label, value, description, trend, icon, footer }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core6.Card, { withBorder: true, radius: "lg", padding: "lg", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_core6.Stack, { gap: "md", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_core6.Group, { justify: "space-between", align: "flex-start", wrap: "nowrap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_core6.Stack, { gap: 4, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core6.Text, { size: "sm", c: "dimmed", fw: 600, children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core6.Title, { order: 3, children: value })
      ] }),
      icon ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core6.ThemeIcon, { variant: "light", size: "xl", radius: "xl", "aria-hidden": true, children: icon }) : null
    ] }),
    description || trend ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_core6.Group, { justify: "space-between", align: "center", gap: "sm", children: [
      description ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core6.Text, { size: "sm", c: "dimmed", flex: 1, children: description }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", {}),
      trend ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core6.Badge, { color: trendColors[trend.tone ?? "neutral"], variant: "light", children: trend.label }) : null
    ] }) : null,
    footer
  ] }) });
}

// src/ProgressCard.tsx
var import_core7 = require("@mantine/core");
var import_jsx_runtime7 = require("react/jsx-runtime");
function ProgressCard({
  label,
  value,
  progress,
  progressLabel,
  description,
  action
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core7.Card, { withBorder: true, radius: "lg", padding: "lg", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core7.Stack, { gap: "md", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core7.Group, { justify: "space-between", align: "flex-start", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core7.Stack, { gap: 4, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core7.Text, { size: "sm", c: "dimmed", fw: 600, children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core7.Title, { order: 3, children: value })
      ] }),
      action
    ] }),
    description ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core7.Text, { size: "sm", c: "dimmed", children: description }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core7.Stack, { gap: 6, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core7.Group, { justify: "space-between", gap: "sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core7.Text, { size: "sm", fw: 500, children: progressLabel ?? "Progress" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_core7.Text, { size: "sm", c: "dimmed", children: [
          Math.round(progress),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_core7.Progress, { value: progress, radius: "xl", size: "md" })
    ] })
  ] }) });
}

// src/ProductCard.tsx
var import_core8 = require("@mantine/core");
var import_jsx_runtime8 = require("react/jsx-runtime");
function ProductCard({
  title,
  description,
  media,
  icon,
  status,
  metadata = [],
  primaryAction,
  secondaryActions = [],
  footer
}) {
  const MoreIcon = GdsIcons.Menu;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Card, { withBorder: true, radius: "lg", padding: "lg", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_core8.Stack, { gap: "md", children: [
    media,
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_core8.Group, { justify: "space-between", align: "flex-start", wrap: "nowrap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_core8.Group, { align: "flex-start", gap: "sm", wrap: "nowrap", children: [
        icon ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.ThemeIcon, { variant: "light", size: "xl", radius: "xl", "aria-hidden": true, children: icon }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_core8.Stack, { gap: 4, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Title, { order: 4, children: title }),
          description ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Text, { size: "sm", c: "dimmed", lineClamp: 3, children: description }) : null
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_core8.Group, { gap: "xs", align: "center", wrap: "nowrap", children: [
        typeof status === "string" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Badge, { variant: "light", children: status }) : status,
        secondaryActions.length ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_core8.Menu, { position: "bottom-end", withinPortal: true, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Menu.Target, { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.ActionIcon, { variant: "subtle", "aria-label": "More actions", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(MoreIcon, { size: "1rem" }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Menu.Dropdown, { children: secondaryActions.map(
            (action) => action.href ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Menu.Item, { component: "a", href: action.href, color: action.color, children: action.label }, action.label) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Menu.Item, { onClick: action.onClick, color: action.color, children: action.label }, action.label)
          ) })
        ] }) : null
      ] })
    ] }),
    metadata.length ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Stack, { gap: 6, children: metadata.map((item) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_core8.Group, { justify: "space-between", gap: "sm", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Text, { size: "sm", c: "dimmed", children: item.label }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Text, { size: "sm", fw: 500, ta: "right", children: item.value })
    ] }, item.label)) }) : null,
    primaryAction ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_core8.Group, { justify: "space-between", children: primaryAction }) : null,
    footer
  ] }) });
}

// src/StateBlock.tsx
var import_core9 = require("@mantine/core");
var import_jsx_runtime9 = require("react/jsx-runtime");
var variantConfig = {
  loading: { color: "violet", icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_core9.Loader, { size: "sm" }) },
  empty: { color: "gray", icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GdsIcons.Inbox, { size: "1.1rem" }) },
  error: { color: "red", icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GdsIcons.Danger, { size: "1.1rem" }) },
  permission: { color: "orange", icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GdsIcons.Verify, { size: "1.1rem" }) },
  disabled: { color: "gray", icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GdsIcons.Toggle, { size: "1.1rem" }) },
  success: { color: "teal", icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GdsIcons.Success, { size: "1.1rem" }) },
  info: { color: "blue", icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GdsIcons.Info, { size: "1.1rem" }) },
  "not-enough-data": { color: "yellow", icon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GdsIcons.Analytics, { size: "1.1rem" }) }
};
function StateBlock({
  variant,
  title,
  description,
  action,
  icon,
  compact = false
}) {
  const config = variantConfig[variant];
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    import_core9.Stack,
    {
      align: compact ? "flex-start" : "center",
      justify: "center",
      gap: "md",
      py: compact ? "md" : "xl",
      ta: compact ? "left" : "center",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_core9.ThemeIcon, { variant: "light", color: config.color, size: compact ? "lg" : "xl", radius: "xl", children: icon ?? config.icon }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_core9.Stack, { gap: 6, align: compact ? "flex-start" : "center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_core9.Title, { order: compact ? 4 : 3, children: title }),
          description ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_core9.Text, { c: "dimmed", maw: compact ? void 0 : 480, children: description }) : null
        ] }),
        action
      ]
    }
  );
}

// src/DataToolbar.tsx
var import_core10 = require("@mantine/core");
var import_jsx_runtime10 = require("react/jsx-runtime");
function DataToolbar({
  searchSlot,
  filterSlot,
  sortSlot,
  resetAction,
  createAction,
  activeFilters = []
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_core10.Stack, { gap: "sm", children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_core10.Group, { justify: "space-between", align: "flex-start", gap: "sm", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_core10.Group, { flex: 1, align: "flex-start", gap: "sm", children: [
        searchSlot,
        filterSlot,
        sortSlot
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_core10.Group, { gap: "sm", children: [
        resetAction,
        createAction
      ] })
    ] }),
    activeFilters.length ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_core10.Group, { gap: "xs", children: activeFilters.map((filter) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      import_core10.Badge,
      {
        variant: "light",
        rightSection: filter.onRemove ? "\xD7" : void 0,
        style: filter.onRemove ? { cursor: "pointer" } : void 0,
        onClick: filter.onRemove,
        children: filter.label
      },
      filter.label
    )) }) : null
  ] });
}

// src/PublicShell.tsx
var import_core11 = require("@mantine/core");
var import_jsx_runtime11 = require("react/jsx-runtime");
function PublicShell({
  brand,
  navigation,
  actions,
  footer,
  mobileNavigation,
  children,
  headerBordered = true,
  compact = false
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_core11.AppShell, { header: { height: 72 }, footer: mobileNavigation ? { height: 68 } : void 0, padding: 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.AppShell.Header, { withBorder: headerBordered, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Container, { size: compact ? "md" : "lg", h: "100%", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_core11.Group, { h: "100%", justify: "space-between", wrap: "nowrap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_core11.Group, { wrap: "nowrap", gap: "sm", children: [
        mobileNavigation ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Burger, { hiddenFrom: "sm", disabled: true, opened: false, "aria-hidden": true }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Box, { children: brand })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Group, { visibleFrom: "sm", gap: "lg", children: navigation }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Group, { gap: "sm", children: actions })
    ] }) }) }),
    mobileNavigation ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.AppShell.Footer, { withBorder: true, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Container, { size: compact ? "md" : "lg", h: "100%", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Group, { h: "100%", justify: "space-around", wrap: "nowrap", children: mobileNavigation }) }) }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_core11.AppShell.Main, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Container, { size: compact ? "md" : "lg", py: "xl", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Stack, { gap: "xl", children }) }),
      footer ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Box, { component: "footer", py: "xl", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Container, { size: compact ? "md" : "lg", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_core11.Text, { size: "sm", c: "dimmed", children: footer }) }) }) : null
    ] })
  ] });
}

// src/AuthShell.tsx
var import_core12 = require("@mantine/core");
var import_jsx_runtime12 = require("react/jsx-runtime");
function AuthShell({ title, description, brand, footer, helper, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_core12.Box, { py: { base: "xl", md: "4rem" }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_core12.Container, { size: "xs", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_core12.Stack, { gap: "xl", children: [
    brand ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_core12.Group, { justify: "center", children: brand }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_core12.Card, { withBorder: true, radius: "lg", padding: "xl", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_core12.Stack, { gap: "lg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_core12.Stack, { gap: "xs", ta: "center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_core12.Title, { order: 2, children: title }),
        description ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_core12.Text, { c: "dimmed", size: "sm", children: description }) : null
      ] }),
      children,
      helper ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_core12.Text, { size: "sm", c: "dimmed", ta: "center", children: helper }) : null
    ] }) }),
    footer ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_core12.Text, { size: "sm", c: "dimmed", ta: "center", children: footer }) : null
  ] }) }) });
}

// src/ArticleShell.tsx
var import_core13 = require("@mantine/core");
var import_jsx_runtime13 = require("react/jsx-runtime");
function ArticleShell({ eyebrow, title, lead, meta, sideRail, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_core13.Container, { size: "lg", py: "xl", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_core13.Group, { align: "flex-start", gap: "xl", wrap: "nowrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_core13.Stack, { gap: "lg", maw: 760, flex: 1, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_core13.Stack, { gap: "sm", children: [
        eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_core13.Text, { size: "sm", fw: 700, c: "dimmed", tt: "uppercase", children: eyebrow }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_core13.Title, { order: 1, children: title }),
        lead ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_core13.Text, { size: "lg", c: "dimmed", children: lead }) : null,
        meta ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_core13.Group, { gap: "md", children: meta }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_core13.Stack, { gap: "md", children })
    ] }),
    sideRail ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_core13.Stack, { visibleFrom: "lg", gap: "md", w: 240, children: sideRail }) : null
  ] }) });
}

// src/UploadDropzone.tsx
var import_react2 = require("react");
var import_core14 = require("@mantine/core");
var import_jsx_runtime14 = require("react/jsx-runtime");
function UploadDropzone({
  title,
  description,
  onFilesSelected,
  accept,
  multiple = true,
  actionLabel = "Choose files"
}) {
  const inputRef = (0, import_react2.useRef)(null);
  const [dragging, setDragging] = (0, import_react2.useState)(false);
  const UploadIcon = GdsIcons.Upload;
  const forwardFiles = (files) => {
    if (!files?.length || !onFilesSelected) {
      return;
    }
    onFilesSelected(Array.from(files));
  };
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
    import_core14.Box,
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
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_core14.Stack, { align: "center", ta: "center", gap: "sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(UploadIcon, { size: "1.5rem" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_core14.Text, { fw: 600, children: title }),
          description ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_core14.Text, { size: "sm", c: "dimmed", children: description }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_core14.Group, { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_core14.Button, { variant: "light", onClick: () => inputRef.current?.click(), children: actionLabel }) })
        ] })
      ]
    }
  );
}

// src/MediaCard.tsx
var import_core15 = require("@mantine/core");
var import_jsx_runtime15 = require("react/jsx-runtime");
function MediaCard({ title, image, description, status, overlay, actions = [] }) {
  const EyeIcon = GdsIcons.Eye;
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_core15.Card, { withBorder: true, radius: "lg", padding: "md", children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_core15.Card.Section, { pos: "relative", children: [
      image,
      overlay ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { style: { position: "absolute", inset: 12, display: "flex", justifyContent: "flex-end", alignItems: "flex-start" }, children: overlay }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_core15.Stack, { gap: "sm", mt: "md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_core15.Group, { justify: "space-between", align: "flex-start", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_core15.Stack, { gap: 4, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_core15.Title, { order: 4, children: title }),
          description ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_core15.Text, { size: "sm", c: "dimmed", lineClamp: 2, children: description }) : null
        ] }),
        status ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_core15.Badge, { variant: "light", children: status }) : null
      ] }),
      actions.length ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_core15.Group, { justify: "flex-end", gap: "xs", children: actions.map((action) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_core15.ActionIcon, { variant: "light", "aria-label": action.label, onClick: action.onClick, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(EyeIcon, { size: "1rem" }) }, action.label)) }) : null
    ] })
  ] });
}

// src/AccessSummary.tsx
var import_core16 = require("@mantine/core");
var import_jsx_runtime16 = require("react/jsx-runtime");
function AccessSummary({ title, roles, scope, blocked = false, description }) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_core16.Card, { withBorder: true, radius: "lg", padding: "lg", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_core16.Stack, { gap: "sm", children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_core16.Group, { justify: "space-between", align: "center", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_core16.Title, { order: 4, children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_core16.Badge, { color: blocked ? "red" : "teal", variant: "light", children: blocked ? "Blocked" : "Allowed" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_core16.Group, { gap: "xs", children: roles.map((role) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_core16.Badge, { variant: "outline", children: role }, role)) }),
    scope ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_core16.Text, { size: "sm", c: "dimmed", children: [
      "Scope: ",
      scope
    ] }) : null,
    description ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_core16.Text, { size: "sm", children: description }) : null
  ] }) });
}

// src/locales/en.ts
var en = {
  "gds.action.settings": "Settings",
  "gds.action.analytics": "Analytics",
  "gds.action.dashboard": "Dashboard",
  "gds.action.play": "Play",
  "gds.action.start": "Start",
  "gds.action.users": "Users",
  "gds.action.add": "Add",
  "gds.action.edit": "Edit",
  "gds.action.delete": "Delete",
  "gds.action.save": "Save",
  "gds.action.cancel": "Cancel",
  "gds.action.confirm": "Confirm",
  "gds.action.close": "Close",
  "gds.action.language": "Language",
  "gds.action.theme": "Theme",
  "gds.action.home": "Home",
  "gds.action.inbox": "Inbox",
  "gds.action.calendar": "Calendar",
  "gds.action.gallery": "Gallery",
  "gds.action.history": "History",
  "gds.action.profile": "Profile",
  "gds.action.send": "Send",
  "gds.action.reply": "Reply",
  "gds.action.forward": "Forward",
  "gds.action.attach": "Attach",
  "gds.action.upload": "Upload",
  "gds.action.download": "Download",
  "gds.action.print": "Print",
  "gds.action.copy": "Copy",
  "gds.action.duplicate": "Duplicate",
  "gds.action.check": "Check",
  "gds.action.uncheck": "Uncheck",
  "gds.action.complete": "Complete",
  "gds.action.clear": "Clear",
  "gds.action.capture": "Capture",
  "gds.action.record": "Record",
  "gds.action.flip": "Flip",
  "gds.action.flash": "Flash",
  "gds.action.course": "Course",
  "gds.action.lesson": "Lesson",
  "gds.action.certificate": "Certificate",
  "gds.action.student": "Student",
  "gds.action.class": "Class",
  "gds.action.grade": "Grade",
  "gds.action.child": "Child",
  "gds.action.family": "Family",
  "gds.action.habit": "Habit",
  "gds.action.goal": "Goal",
  "gds.action.streak": "Streak",
  "gds.action.reward": "Reward",
  "gds.action.trophy": "Trophy",
  "gds.action.crown": "Crown",
  "gds.action.pause": "Pause",
  "gds.action.message": "Message",
  "gds.action.mail": "Mail",
  "gds.action.refresh": "Refresh",
  "gds.action.trendingUp": "Trending Up",
  "gds.action.trendingDown": "Trending Down",
  "gds.action.currency": "Currency",
  "gds.action.grid": "Grid",
  "gds.action.list": "List",
  "gds.action.logout": "Logout",
  "gds.action.notifications": "Notifications",
  "gds.action.back": "Back",
  "gds.action.eye": "View",
  "gds.action.eyeOff": "Hide",
  "gds.action.help": "Help",
  "gds.action.filter": "Filter",
  "gds.action.sort": "Sort",
  "gds.action.export": "Export",
  "gds.action.import": "Import",
  "gds.action.preview": "Preview",
  "gds.action.clone": "Clone",
  "gds.action.restore": "Restore",
  "gds.action.toggle": "Toggle",
  "gds.action.search": "Search",
  "gds.action.submit": "Submit",
  "gds.action.reset": "Reset",
  "gds.action.login": "Login",
  "gds.action.register": "Register",
  "gds.action.verify": "Verify",
  "gds.action.launch": "Launch",
  "gds.action.draft": "Draft",
  "gds.action.refer": "Refer",
  "gds.action.evidence": "Evidence",
  "gds.feedback.saved": "Saved",
  "gds.feedback.error": "Something went wrong",
  "gds.feedback.added": "Added",
  "gds.feedback.edited": "Edited",
  "gds.feedback.deleted": "Deleted",
  "gds.feedback.canceled": "Canceled",
  "gds.feedback.confirmed": "Confirmed",
  "gds.feedback.closed": "Closed",
  "gds.feedback.changed": "Changed",
  "gds.feedback.loaded": "Loaded",
  "gds.feedback.started": "Started",
  "gds.feedback.opened": "Opened",
  "gds.feedback.sent": "Sent",
  "gds.feedback.replied": "Replied",
  "gds.feedback.forwarded": "Forwarded",
  "gds.feedback.attached": "Attached",
  "gds.feedback.uploaded": "Uploaded",
  "gds.feedback.downloaded": "Downloaded",
  "gds.feedback.printed": "Printed",
  "gds.feedback.copied": "Copied",
  "gds.feedback.duplicated": "Duplicated",
  "gds.feedback.checked": "Checked",
  "gds.feedback.unchecked": "Unchecked",
  "gds.feedback.completed": "Completed",
  "gds.feedback.cleared": "Cleared",
  "gds.feedback.captured": "Captured",
  "gds.feedback.recorded": "Recorded",
  "gds.feedback.flipped": "Flipped",
  "gds.feedback.flashed": "Flashed",
  "gds.feedback.done": "Done",
  "gds.feedback.rewarded": "Rewarded",
  "gds.feedback.paused": "Paused",
  "gds.feedback.mailed": "Mailed",
  "gds.feedback.refreshed": "Refreshed",
  "gds.feedback.loggedOut": "Logged Out",
  "gds.feedback.filtered": "Filtered",
  "gds.feedback.sorted": "Sorted",
  "gds.feedback.exported": "Exported",
  "gds.feedback.imported": "Imported",
  "gds.feedback.previewed": "Previewed",
  "gds.feedback.cloned": "Cloned",
  "gds.feedback.restored": "Restored",
  "gds.feedback.toggled": "Toggled",
  "gds.feedback.searched": "Searched",
  "gds.feedback.submitted": "Submitted",
  "gds.feedback.reset": "Reset",
  "gds.feedback.loggedIn": "Logged In",
  "gds.feedback.registered": "Registered",
  "gds.feedback.verified": "Verified",
  "gds.feedback.launched": "Launched",
  "gds.feedback.drafted": "Drafted",
  "gds.feedback.referred": "Referred",
  "gds.aria.themeToggle": "Toggle color scheme",
  "gds.state.emptyData": "No data available."
};

// src/locales/hu.ts
var hu = {
  "gds.action.settings": "Be\xE1ll\xEDt\xE1sok",
  "gds.action.analytics": "Analitika",
  "gds.action.dashboard": "Ir\xE1ny\xEDt\xF3pult",
  "gds.action.play": "Lej\xE1tsz\xE1s",
  "gds.action.start": "Ind\xEDt\xE1s",
  "gds.action.users": "Felhaszn\xE1l\xF3k",
  "gds.action.add": "Hozz\xE1ad\xE1s",
  "gds.action.edit": "Szerkeszt\xE9s",
  "gds.action.delete": "T\xF6rl\xE9s",
  "gds.action.save": "Ment\xE9s",
  "gds.action.cancel": "M\xE9gse",
  "gds.action.confirm": "Meger\u0151s\xEDt\xE9s",
  "gds.action.close": "Bez\xE1r\xE1s",
  "gds.action.language": "Nyelv",
  "gds.action.theme": "T\xE9ma",
  "gds.action.home": "F\u0151oldal",
  "gds.action.inbox": "Be\xE9rkez\u0151",
  "gds.action.calendar": "Napt\xE1r",
  "gds.action.gallery": "Gal\xE9ria",
  "gds.action.history": "El\u0151zm\xE9nyek",
  "gds.action.profile": "Profil",
  "gds.action.send": "K\xFCld\xE9s",
  "gds.action.reply": "V\xE1lasz",
  "gds.action.forward": "Tov\xE1bb\xEDt\xE1s",
  "gds.action.attach": "Csatol\xE1s",
  "gds.action.upload": "Felt\xF6lt\xE9s",
  "gds.action.download": "Let\xF6lt\xE9s",
  "gds.action.print": "Nyomtat\xE1s",
  "gds.action.copy": "M\xE1sol\xE1s",
  "gds.action.duplicate": "Duplik\xE1l\xE1s",
  "gds.action.check": "Jel\xF6l\xE9s",
  "gds.action.uncheck": "Jel\xF6l\xE9s t\xF6rl\xE9se",
  "gds.action.complete": "K\xE9sz",
  "gds.action.clear": "Ki\xFCr\xEDt\xE9s",
  "gds.action.capture": "Felv\xE9tel",
  "gds.action.record": "R\xF6gz\xEDt\xE9s",
  "gds.action.flip": "Ford\xEDt\xE1s",
  "gds.action.flash": "Vaku",
  "gds.action.course": "Tanfolyam",
  "gds.action.lesson": "Lecke",
  "gds.action.certificate": "Tan\xFAs\xEDtv\xE1ny",
  "gds.action.student": "Tanul\xF3",
  "gds.action.class": "Oszt\xE1ly",
  "gds.action.grade": "Oszt\xE1lyzat",
  "gds.action.child": "Gyermek",
  "gds.action.family": "Csal\xE1d",
  "gds.action.habit": "Szok\xE1s",
  "gds.action.goal": "C\xE9l",
  "gds.action.streak": "Sorozat",
  "gds.action.reward": "Jutalom",
  "gds.action.trophy": "Tr\xF3fea",
  "gds.action.crown": "Korona",
  "gds.action.pause": "Sz\xFCnet",
  "gds.action.message": "\xDCzenet",
  "gds.action.mail": "Lev\xE9l",
  "gds.action.refresh": "Friss\xEDt\xE9s",
  "gds.action.trendingUp": "N\xF6vekv\u0151 trend",
  "gds.action.trendingDown": "Cs\xF6kken\u0151 trend",
  "gds.action.currency": "P\xE9nznem",
  "gds.action.grid": "R\xE1cs",
  "gds.action.list": "Lista",
  "gds.action.logout": "Kijelentkez\xE9s",
  "gds.action.notifications": "\xC9rtes\xEDt\xE9sek",
  "gds.action.back": "Vissza",
  "gds.action.eye": "Megtekint\xE9s",
  "gds.action.eyeOff": "Elrejt\xE9s",
  "gds.action.help": "S\xFAg\xF3",
  "gds.action.filter": "Sz\u0171r\u0151",
  "gds.action.sort": "Rendez\xE9s",
  "gds.action.export": "Export\xE1l\xE1s",
  "gds.action.import": "Import\xE1l\xE1s",
  "gds.action.preview": "El\u0151n\xE9zet",
  "gds.action.clone": "Kl\xF3noz\xE1s",
  "gds.action.restore": "Vissza\xE1ll\xEDt\xE1s",
  "gds.action.toggle": "V\xE1lt\xE1s",
  "gds.action.search": "Keres\xE9s",
  "gds.action.submit": "K\xFCld\xE9s",
  "gds.action.reset": "Alaphelyzet",
  "gds.action.login": "Bejelentkez\xE9s",
  "gds.action.register": "Regisztr\xE1ci\xF3",
  "gds.action.verify": "Ellen\u0151rz\xE9s",
  "gds.action.launch": "Ind\xEDt\xE1s",
  "gds.action.draft": "Piszkozat",
  "gds.action.refer": "Aj\xE1nl\xE1s",
  "gds.action.evidence": "Bizony\xEDt\xE9k",
  "gds.feedback.saved": "Mentve",
  "gds.feedback.error": "Hiba t\xF6rt\xE9nt",
  "gds.feedback.added": "Hozz\xE1adva",
  "gds.feedback.edited": "Szerkesztve",
  "gds.feedback.deleted": "T\xF6r\xF6lve",
  "gds.feedback.canceled": "Megszak\xEDtva",
  "gds.feedback.confirmed": "Meger\u0151s\xEDtve",
  "gds.feedback.closed": "Bez\xE1rva",
  "gds.feedback.changed": "Megv\xE1ltoztatva",
  "gds.feedback.loaded": "Bet\xF6ltve",
  "gds.feedback.started": "Elind\xEDtva",
  "gds.feedback.opened": "Megnyitva",
  "gds.feedback.sent": "Elk\xFCldve",
  "gds.feedback.replied": "Megv\xE1laszolva",
  "gds.feedback.forwarded": "Tov\xE1bb\xEDtva",
  "gds.feedback.attached": "Csatolva",
  "gds.feedback.uploaded": "Felt\xF6ltve",
  "gds.feedback.downloaded": "Let\xF6ltve",
  "gds.feedback.printed": "Kinyomtatva",
  "gds.feedback.copied": "M\xE1solva",
  "gds.feedback.duplicated": "Duplik\xE1lva",
  "gds.feedback.checked": "Kijel\xF6lve",
  "gds.feedback.unchecked": "Kijel\xF6l\xE9s t\xF6r\xF6lve",
  "gds.feedback.completed": "Befejezve",
  "gds.feedback.cleared": "Ki\xFCr\xEDtve",
  "gds.feedback.captured": "R\xF6gz\xEDtve",
  "gds.feedback.recorded": "Felv\xE9ve",
  "gds.feedback.flipped": "Megford\xEDtva",
  "gds.feedback.flashed": "Villantva",
  "gds.feedback.done": "K\xE9sz",
  "gds.feedback.rewarded": "Jutalmazva",
  "gds.feedback.paused": "Sz\xFCneteltetve",
  "gds.feedback.mailed": "Elk\xFCldve",
  "gds.feedback.refreshed": "Friss\xEDtve",
  "gds.feedback.loggedOut": "Kijelentkezve",
  "gds.feedback.filtered": "Sz\u0171rve",
  "gds.feedback.sorted": "Rendezve",
  "gds.feedback.exported": "Export\xE1lva",
  "gds.feedback.imported": "Import\xE1lva",
  "gds.feedback.previewed": "El\u0151n\xE9zet bet\xF6ltve",
  "gds.feedback.cloned": "Kl\xF3nozva",
  "gds.feedback.restored": "Vissza\xE1ll\xEDtva",
  "gds.feedback.toggled": "\xC1tv\xE1ltva",
  "gds.feedback.searched": "Keresve",
  "gds.feedback.submitted": "Elk\xFCldve",
  "gds.feedback.reset": "Alaphelyzetbe \xE1ll\xEDtva",
  "gds.feedback.loggedIn": "Bejelentkezve",
  "gds.feedback.registered": "Regisztr\xE1lva",
  "gds.feedback.verified": "Ellen\u0151rizve",
  "gds.feedback.launched": "Elind\xEDtva",
  "gds.feedback.drafted": "L\xE9trehozva",
  "gds.feedback.referred": "Aj\xE1nlva",
  "gds.aria.themeToggle": "Sz\xEDns\xE9ma v\xE1lt\xE1sa",
  "gds.state.emptyData": "Nincs el\xE9rhet\u0151 adat."
};

// src/locales/de.ts
var de = {
  "gds.action.settings": "Einstellungen",
  "gds.action.analytics": "Analyse",
  "gds.action.dashboard": "Dashboard",
  "gds.action.play": "Abspielen",
  "gds.action.start": "Start",
  "gds.action.users": "Benutzer",
  "gds.action.add": "Hinzuf\xFCgen",
  "gds.action.edit": "Bearbeiten",
  "gds.action.delete": "L\xF6schen",
  "gds.action.save": "Speichern",
  "gds.action.cancel": "Abbrechen",
  "gds.action.confirm": "Best\xE4tigen",
  "gds.action.close": "Schlie\xDFen",
  "gds.action.language": "Sprache",
  "gds.action.theme": "Thema",
  "gds.action.home": "Startseite",
  "gds.action.inbox": "Posteingang",
  "gds.action.calendar": "Kalender",
  "gds.action.gallery": "Galerie",
  "gds.action.history": "Verlauf",
  "gds.action.profile": "Profil",
  "gds.action.send": "Senden",
  "gds.action.reply": "Antworten",
  "gds.action.forward": "Weiterleiten",
  "gds.action.attach": "Anh\xE4ngen",
  "gds.action.upload": "Hochladen",
  "gds.action.download": "Herunterladen",
  "gds.action.print": "Drucken",
  "gds.action.copy": "Kopieren",
  "gds.action.duplicate": "Duplizieren",
  "gds.action.check": "\xDCberpr\xFCfen",
  "gds.action.uncheck": "H\xE4kchen entfernen",
  "gds.action.complete": "Abschlie\xDFen",
  "gds.action.clear": "Leeren",
  "gds.action.capture": "Aufnehmen",
  "gds.action.record": "Aufzeichnen",
  "gds.action.flip": "Umdrehen",
  "gds.action.flash": "Blitz",
  "gds.action.course": "Kurs",
  "gds.action.lesson": "Lektion",
  "gds.action.certificate": "Zertifikat",
  "gds.action.student": "Student",
  "gds.action.class": "Klasse",
  "gds.action.grade": "Note",
  "gds.action.child": "Kind",
  "gds.action.family": "Familie",
  "gds.action.habit": "Gewohnheit",
  "gds.action.goal": "Ziel",
  "gds.action.streak": "Serie",
  "gds.action.reward": "Belohnung",
  "gds.action.trophy": "Troph\xE4e",
  "gds.action.crown": "Krone",
  "gds.action.pause": "Pause",
  "gds.action.message": "Nachricht",
  "gds.action.mail": "E-Mail",
  "gds.action.refresh": "Aktualisieren",
  "gds.action.trendingUp": "Aufw\xE4rtstrend",
  "gds.action.trendingDown": "Abw\xE4rtstrend",
  "gds.action.currency": "W\xE4hrung",
  "gds.action.grid": "Raster",
  "gds.action.list": "Liste",
  "gds.action.logout": "Abmelden",
  "gds.action.notifications": "Benachrichtigungen",
  "gds.action.back": "Zur\xFCck",
  "gds.action.eye": "Anzeigen",
  "gds.action.eyeOff": "Ausblenden",
  "gds.action.help": "Hilfe",
  "gds.action.filter": "Filter",
  "gds.action.sort": "Sortieren",
  "gds.action.export": "Exportieren",
  "gds.action.import": "Importieren",
  "gds.action.preview": "Vorschau",
  "gds.action.clone": "Klonen",
  "gds.action.restore": "Wiederherstellen",
  "gds.action.toggle": "Umschalten",
  "gds.action.search": "Suchen",
  "gds.action.submit": "Absenden",
  "gds.action.reset": "Zur\xFCcksetzen",
  "gds.action.login": "Einloggen",
  "gds.action.register": "Registrieren",
  "gds.action.verify": "Verifizieren",
  "gds.action.launch": "Starten",
  "gds.action.draft": "Entwurf",
  "gds.action.refer": "Empfehlen",
  "gds.action.evidence": "Beweismittel",
  "gds.feedback.saved": "Gespeichert",
  "gds.feedback.error": "Etwas ist schiefgelaufen",
  "gds.feedback.added": "Hinzugef\xFCgt",
  "gds.feedback.edited": "Bearbeitet",
  "gds.feedback.deleted": "Gel\xF6scht",
  "gds.feedback.canceled": "Abgebrochen",
  "gds.feedback.confirmed": "Best\xE4tigt",
  "gds.feedback.closed": "Geschlossen",
  "gds.feedback.changed": "Ge\xE4ndert",
  "gds.feedback.loaded": "Geladen",
  "gds.feedback.started": "Gestartet",
  "gds.feedback.opened": "Ge\xF6ffnet",
  "gds.feedback.sent": "Gesendet",
  "gds.feedback.replied": "Geantwortet",
  "gds.feedback.forwarded": "Weitergeleitet",
  "gds.feedback.attached": "Angeh\xE4ngt",
  "gds.feedback.uploaded": "Hochgeladen",
  "gds.feedback.downloaded": "Heruntergeladen",
  "gds.feedback.printed": "Gedruckt",
  "gds.feedback.copied": "Kopiert",
  "gds.feedback.duplicated": "Dupliziert",
  "gds.feedback.checked": "Ausgew\xE4hlt",
  "gds.feedback.unchecked": "H\xE4kchen entfernt",
  "gds.feedback.completed": "Abgeschlossen",
  "gds.feedback.cleared": "Geleert",
  "gds.feedback.captured": "Erfasst",
  "gds.feedback.recorded": "Aufgezeichnet",
  "gds.feedback.flipped": "Umdreht",
  "gds.feedback.flashed": "Geblitzt",
  "gds.feedback.done": "Erledigt",
  "gds.feedback.rewarded": "Belohnt",
  "gds.feedback.paused": "Pausiert",
  "gds.feedback.mailed": "Gemailt",
  "gds.feedback.refreshed": "Aktualisiert",
  "gds.feedback.loggedOut": "Abgemeldet",
  "gds.feedback.filtered": "Gefiltert",
  "gds.feedback.sorted": "Sortiert",
  "gds.feedback.exported": "Exportiert",
  "gds.feedback.imported": "Importiert",
  "gds.feedback.previewed": "Angezeigt",
  "gds.feedback.cloned": "Kloniert",
  "gds.feedback.restored": "Wiederhergestellt",
  "gds.feedback.toggled": "Umgeschaltet",
  "gds.feedback.searched": "Gesucht",
  "gds.feedback.submitted": "Abgesendet",
  "gds.feedback.reset": "Zur\xFCckgesetzt",
  "gds.feedback.loggedIn": "Eingeloggt",
  "gds.feedback.registered": "Registriert",
  "gds.feedback.verified": "Verifiziert",
  "gds.feedback.launched": "Gestartet",
  "gds.feedback.drafted": "Entworfen",
  "gds.feedback.referred": "Empfohlen",
  "gds.aria.themeToggle": "Farbschema umschalten",
  "gds.state.emptyData": "Keine Daten verf\xFCgbar."
};

// src/locales/fr.ts
var fr = {
  "gds.action.settings": "Param\xE8tres",
  "gds.action.analytics": "Analytique",
  "gds.action.dashboard": "Tableau de bord",
  "gds.action.play": "Jouer",
  "gds.action.start": "D\xE9marrer",
  "gds.action.users": "Utilisateurs",
  "gds.action.add": "Ajouter",
  "gds.action.edit": "Modifier",
  "gds.action.delete": "Supprimer",
  "gds.action.save": "Enregistrer",
  "gds.action.cancel": "Annuler",
  "gds.action.confirm": "Confirmer",
  "gds.action.close": "Fermer",
  "gds.action.language": "Langue",
  "gds.action.theme": "Th\xE8me",
  "gds.action.home": "Accueil",
  "gds.action.inbox": "Bo\xEEte de r\xE9ception",
  "gds.action.calendar": "Calendrier",
  "gds.action.gallery": "Galerie",
  "gds.action.history": "Historique",
  "gds.action.profile": "Profil",
  "gds.action.send": "Envoyer",
  "gds.action.reply": "R\xE9pondre",
  "gds.action.forward": "Transf\xE9rer",
  "gds.action.attach": "Joindre",
  "gds.action.upload": "T\xE9l\xE9verser",
  "gds.action.download": "T\xE9l\xE9charger",
  "gds.action.print": "Imprimer",
  "gds.action.copy": "Copier",
  "gds.action.duplicate": "Dupliquer",
  "gds.action.check": "Cocher",
  "gds.action.uncheck": "D\xE9cocher",
  "gds.action.complete": "Terminer",
  "gds.action.clear": "Effacer",
  "gds.action.capture": "Capturer",
  "gds.action.record": "Enregistrer",
  "gds.action.flip": "Retourner",
  "gds.action.flash": "Flash",
  "gds.action.course": "Cours",
  "gds.action.lesson": "Le\xE7on",
  "gds.action.certificate": "Certificat",
  "gds.action.student": "\xC9tudiant",
  "gds.action.class": "Classe",
  "gds.action.grade": "Note",
  "gds.action.child": "Enfant",
  "gds.action.family": "Famille",
  "gds.action.habit": "Habitude",
  "gds.action.goal": "Objectif",
  "gds.action.streak": "S\xE9rie",
  "gds.action.reward": "R\xE9compense",
  "gds.action.trophy": "Troph\xE9e",
  "gds.action.crown": "Couronne",
  "gds.action.pause": "Pause",
  "gds.action.message": "Message",
  "gds.action.mail": "Courrier",
  "gds.action.refresh": "Actualiser",
  "gds.action.trendingUp": "Tendance \xE0 la hausse",
  "gds.action.trendingDown": "Tendance \xE0 la baisse",
  "gds.action.currency": "Devise",
  "gds.action.grid": "Grille",
  "gds.action.list": "Liste",
  "gds.action.logout": "D\xE9connexion",
  "gds.action.notifications": "Notifications",
  "gds.action.back": "Retour",
  "gds.action.eye": "Afficher",
  "gds.action.eyeOff": "Masquer",
  "gds.action.help": "Aide",
  "gds.action.filter": "Filtrer",
  "gds.action.sort": "Trier",
  "gds.action.export": "Exporter",
  "gds.action.import": "Importer",
  "gds.action.preview": "Aper\xE7u",
  "gds.action.clone": "Cloner",
  "gds.action.restore": "Restaurer",
  "gds.action.toggle": "Basculer",
  "gds.action.search": "Rechercher",
  "gds.action.submit": "Soumettre",
  "gds.action.reset": "R\xE9initialiser",
  "gds.action.login": "Connexion",
  "gds.action.register": "S'inscrire",
  "gds.action.verify": "V\xE9rifier",
  "gds.action.launch": "Lancer",
  "gds.action.draft": "Brouillon",
  "gds.action.refer": "R\xE9f\xE9rer",
  "gds.action.evidence": "Preuve",
  "gds.feedback.saved": "Enregistr\xE9",
  "gds.feedback.error": "Une erreur est survenue",
  "gds.feedback.added": "Ajout\xE9",
  "gds.feedback.edited": "Modifi\xE9",
  "gds.feedback.deleted": "Supprim\xE9",
  "gds.feedback.canceled": "Annul\xE9",
  "gds.feedback.confirmed": "Confirm\xE9",
  "gds.feedback.closed": "Ferm\xE9",
  "gds.feedback.changed": "Modifi\xE9",
  "gds.feedback.loaded": "Charg\xE9",
  "gds.feedback.started": "D\xE9marr\xE9",
  "gds.feedback.opened": "Ouvert",
  "gds.feedback.sent": "Envoy\xE9",
  "gds.feedback.replied": "R\xE9pondu",
  "gds.feedback.forwarded": "Transf\xE9r\xE9",
  "gds.feedback.attached": "Joint",
  "gds.feedback.uploaded": "T\xE9l\xE9vers\xE9",
  "gds.feedback.downloaded": "T\xE9l\xE9charg\xE9",
  "gds.feedback.printed": "Imprim\xE9",
  "gds.feedback.copied": "Copi\xE9",
  "gds.feedback.duplicated": "Dupliqu\xE9",
  "gds.feedback.checked": "Coch\xE9",
  "gds.feedback.unchecked": "D\xE9coch\xE9",
  "gds.feedback.completed": "Termin\xE9",
  "gds.feedback.cleared": "Effac\xE9",
  "gds.feedback.captured": "Captur\xE9",
  "gds.feedback.recorded": "Enregistr\xE9",
  "gds.feedback.flipped": "Retourn\xE9",
  "gds.feedback.flashed": "Flash\xE9",
  "gds.feedback.done": "Fait",
  "gds.feedback.rewarded": "R\xE9compens\xE9",
  "gds.feedback.paused": "En pause",
  "gds.feedback.mailed": "Envoy\xE9",
  "gds.feedback.refreshed": "Actualis\xE9",
  "gds.feedback.loggedOut": "D\xE9connect\xE9",
  "gds.feedback.filtered": "Filtr\xE9",
  "gds.feedback.sorted": "Tri\xE9",
  "gds.feedback.exported": "Export\xE9",
  "gds.feedback.imported": "Import\xE9",
  "gds.feedback.previewed": "Visualis\xE9",
  "gds.feedback.cloned": "Clon\xE9",
  "gds.feedback.restored": "Restaur\xE9",
  "gds.feedback.toggled": "Bascul\xE9",
  "gds.feedback.searched": "Recherch\xE9",
  "gds.feedback.submitted": "Soumis",
  "gds.feedback.reset": "R\xE9initialis\xE9",
  "gds.feedback.loggedIn": "Connect\xE9",
  "gds.feedback.registered": "Inscrit",
  "gds.feedback.verified": "V\xE9rifi\xE9",
  "gds.feedback.launched": "Lanc\xE9",
  "gds.feedback.drafted": "R\xE9dig\xE9",
  "gds.feedback.referred": "R\xE9f\xE9r\xE9",
  "gds.aria.themeToggle": "Basculer le th\xE8me",
  "gds.state.emptyData": "Aucune donn\xE9e disponible."
};

// src/locales/it.ts
var it = {
  "gds.action.settings": "Impostazioni",
  "gds.action.analytics": "Analitica",
  "gds.action.dashboard": "Dashboard",
  "gds.action.play": "Riproduci",
  "gds.action.start": "Inizia",
  "gds.action.users": "Utenti",
  "gds.action.add": "Aggiungi",
  "gds.action.edit": "Modifica",
  "gds.action.delete": "Elimina",
  "gds.action.save": "Salva",
  "gds.action.cancel": "Annulla",
  "gds.action.confirm": "Conferma",
  "gds.action.close": "Chiudi",
  "gds.action.language": "Lingua",
  "gds.action.theme": "Tema",
  "gds.action.home": "Home",
  "gds.action.inbox": "Posta in arrivo",
  "gds.action.calendar": "Calendario",
  "gds.action.gallery": "Galleria",
  "gds.action.history": "Cronologia",
  "gds.action.profile": "Profilo",
  "gds.action.send": "Invia",
  "gds.action.reply": "Rispondi",
  "gds.action.forward": "Inoltra",
  "gds.action.attach": "Allega",
  "gds.action.upload": "Carica",
  "gds.action.download": "Scarica",
  "gds.action.print": "Stampa",
  "gds.action.copy": "Copia",
  "gds.action.duplicate": "Duplica",
  "gds.action.check": "Seleziona",
  "gds.action.uncheck": "Deseleziona",
  "gds.action.complete": "Completa",
  "gds.action.clear": "Pulisci",
  "gds.action.capture": "Cattura",
  "gds.action.record": "Registra",
  "gds.action.flip": "Capovolgi",
  "gds.action.flash": "Flash",
  "gds.action.course": "Corso",
  "gds.action.lesson": "Lezione",
  "gds.action.certificate": "Certificato",
  "gds.action.student": "Studente",
  "gds.action.class": "Classe",
  "gds.action.grade": "Voto",
  "gds.action.child": "Bambino",
  "gds.action.family": "Famiglia",
  "gds.action.habit": "Abitudine",
  "gds.action.goal": "Obiettivo",
  "gds.action.streak": "Serie",
  "gds.action.reward": "Ricompensa",
  "gds.action.trophy": "Trofeo",
  "gds.action.crown": "Corona",
  "gds.action.pause": "Pausa",
  "gds.action.message": "Messaggio",
  "gds.action.mail": "Posta",
  "gds.action.refresh": "Aggiorna",
  "gds.action.trendingUp": "In crescita",
  "gds.action.trendingDown": "In calo",
  "gds.action.currency": "Valuta",
  "gds.action.grid": "Griglia",
  "gds.action.list": "Elenco",
  "gds.action.logout": "Esci",
  "gds.action.notifications": "Notifiche",
  "gds.action.back": "Indietro",
  "gds.action.eye": "Mostra",
  "gds.action.eyeOff": "Nascondi",
  "gds.action.help": "Aiuto",
  "gds.action.filter": "Filtra",
  "gds.action.sort": "Ordina",
  "gds.action.export": "Esporta",
  "gds.action.import": "Importa",
  "gds.action.preview": "Anteprima",
  "gds.action.clone": "Clona",
  "gds.action.restore": "Ripristina",
  "gds.action.toggle": "Attiva/Disattiva",
  "gds.action.search": "Cerca",
  "gds.action.submit": "Invia",
  "gds.action.reset": "Reimposta",
  "gds.action.login": "Accedi",
  "gds.action.register": "Registrati",
  "gds.action.verify": "Verifica",
  "gds.action.launch": "Avvia",
  "gds.action.draft": "Bozza",
  "gds.action.refer": "Segnala",
  "gds.action.evidence": "Prova",
  "gds.feedback.saved": "Salvato",
  "gds.feedback.error": "Si \xE8 verificato un errore",
  "gds.feedback.added": "Aggiunto",
  "gds.feedback.edited": "Modificato",
  "gds.feedback.deleted": "Eliminato",
  "gds.feedback.canceled": "Annullato",
  "gds.feedback.confirmed": "Confermato",
  "gds.feedback.closed": "Chiuso",
  "gds.feedback.changed": "Cambiato",
  "gds.feedback.loaded": "Caricato",
  "gds.feedback.started": "Iniziato",
  "gds.feedback.opened": "Aperto",
  "gds.feedback.sent": "Inviato",
  "gds.feedback.replied": "Risposto",
  "gds.feedback.forwarded": "Inoltrato",
  "gds.feedback.attached": "Allegato",
  "gds.feedback.uploaded": "Caricato",
  "gds.feedback.downloaded": "Scaricato",
  "gds.feedback.printed": "Stampato",
  "gds.feedback.copied": "Copiato",
  "gds.feedback.duplicated": "Duplicato",
  "gds.feedback.checked": "Selezionato",
  "gds.feedback.unchecked": "Deselezionato",
  "gds.feedback.completed": "Completato",
  "gds.feedback.cleared": "Svuotato",
  "gds.feedback.captured": "Catturato",
  "gds.feedback.recorded": "Registrato",
  "gds.feedback.flipped": "Capovolto",
  "gds.feedback.flashed": "Lampeggiato",
  "gds.feedback.done": "Fatto",
  "gds.feedback.rewarded": "Premiato",
  "gds.feedback.paused": "In pausa",
  "gds.feedback.mailed": "Inviato",
  "gds.feedback.refreshed": "Aggiornato",
  "gds.feedback.loggedOut": "Disconnesso",
  "gds.feedback.filtered": "Filtrato",
  "gds.feedback.sorted": "Ordinato",
  "gds.feedback.exported": "Esportato",
  "gds.feedback.imported": "Importato",
  "gds.feedback.previewed": "Visualizzato",
  "gds.feedback.cloned": "Clonato",
  "gds.feedback.restored": "Ripristinato",
  "gds.feedback.toggled": "Attivato",
  "gds.feedback.searched": "Cercato",
  "gds.feedback.submitted": "Inviato",
  "gds.feedback.reset": "Reimpostato",
  "gds.feedback.loggedIn": "Accesso effettuato",
  "gds.feedback.registered": "Registrato",
  "gds.feedback.verified": "Verificato",
  "gds.feedback.launched": "Avviato",
  "gds.feedback.drafted": "Bozza salvata",
  "gds.feedback.referred": "Segnalato",
  "gds.aria.themeToggle": "Cambia schema colori",
  "gds.state.emptyData": "Nessun dato disponibile."
};

// src/locales/ru.ts
var ru = {
  "gds.action.settings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
  "gds.action.analytics": "\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430",
  "gds.action.dashboard": "\u041F\u0430\u043D\u0435\u043B\u044C",
  "gds.action.play": "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0441\u0442\u0438",
  "gds.action.start": "\u0421\u0442\u0430\u0440\u0442",
  "gds.action.users": "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438",
  "gds.action.add": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C",
  "gds.action.edit": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C",
  "gds.action.delete": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
  "gds.action.save": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
  "gds.action.cancel": "\u041E\u0442\u043C\u0435\u043D\u0430",
  "gds.action.confirm": "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C",
  "gds.action.close": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
  "gds.action.language": "\u042F\u0437\u044B\u043A",
  "gds.action.theme": "\u0422\u0435\u043C\u0430",
  "gds.action.home": "\u0413\u043B\u0430\u0432\u043D\u0430\u044F",
  "gds.action.inbox": "\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0435",
  "gds.action.calendar": "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
  "gds.action.gallery": "\u0413\u0430\u043B\u0435\u0440\u0435\u044F",
  "gds.action.history": "\u0418\u0441\u0442\u043E\u0440\u0438\u044F",
  "gds.action.profile": "\u041F\u0440\u043E\u0444\u0438\u043B\u044C",
  "gds.action.send": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
  "gds.action.reply": "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C",
  "gds.action.forward": "\u041F\u0435\u0440\u0435\u0441\u043B\u0430\u0442\u044C",
  "gds.action.attach": "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C",
  "gds.action.upload": "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C",
  "gds.action.download": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
  "gds.action.print": "\u041F\u0435\u0447\u0430\u0442\u044C",
  "gds.action.copy": "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
  "gds.action.duplicate": "\u0414\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
  "gds.action.check": "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C",
  "gds.action.uncheck": "\u0421\u043D\u044F\u0442\u044C \u043E\u0442\u043C\u0435\u0442\u043A\u0443",
  "gds.action.complete": "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C",
  "gds.action.clear": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C",
  "gds.action.capture": "\u0421\u043D\u044F\u0442\u044C",
  "gds.action.record": "\u0417\u0430\u043F\u0438\u0441\u044C",
  "gds.action.flip": "\u041F\u0435\u0440\u0435\u0432\u0435\u0440\u043D\u0443\u0442\u044C",
  "gds.action.flash": "\u0412\u0441\u043F\u044B\u0448\u043A\u0430",
  "gds.action.course": "\u041A\u0443\u0440\u0441",
  "gds.action.lesson": "\u0423\u0440\u043E\u043A",
  "gds.action.certificate": "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442",
  "gds.action.student": "\u0421\u0442\u0443\u0434\u0435\u043D\u0442",
  "gds.action.class": "\u041A\u043B\u0430\u0441\u0441",
  "gds.action.grade": "\u041E\u0446\u0435\u043D\u043A\u0430",
  "gds.action.child": "\u0420\u0435\u0431\u0435\u043D\u043E\u043A",
  "gds.action.family": "\u0421\u0435\u043C\u044C\u044F",
  "gds.action.habit": "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0430",
  "gds.action.goal": "\u0426\u0435\u043B\u044C",
  "gds.action.streak": "\u0421\u0435\u0440\u0438\u044F",
  "gds.action.reward": "\u041D\u0430\u0433\u0440\u0430\u0434\u0430",
  "gds.action.trophy": "\u0422\u0440\u043E\u0444\u0435\u0439",
  "gds.action.crown": "\u041A\u043E\u0440\u043E\u043D\u0430",
  "gds.action.pause": "\u041F\u0430\u0443\u0437\u0430",
  "gds.action.message": "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435",
  "gds.action.mail": "\u041F\u043E\u0447\u0442\u0430",
  "gds.action.refresh": "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
  "gds.action.trendingUp": "\u0422\u0435\u043D\u0434\u0435\u043D\u0446\u0438\u044F \u0432\u0432\u0435\u0440\u0445",
  "gds.action.trendingDown": "\u0422\u0435\u043D\u0434\u0435\u043D\u0446\u0438\u044F \u0432\u043D\u0438\u0437",
  "gds.action.currency": "\u0412\u0430\u043B\u044E\u0442\u0430",
  "gds.action.grid": "\u0421\u0435\u0442\u043A\u0430",
  "gds.action.list": "\u0421\u043F\u0438\u0441\u043E\u043A",
  "gds.action.logout": "\u0412\u044B\u0439\u0442\u0438",
  "gds.action.notifications": "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
  "gds.action.back": "\u041D\u0430\u0437\u0430\u0434",
  "gds.action.eye": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C",
  "gds.action.eyeOff": "\u0421\u043A\u0440\u044B\u0442\u044C",
  "gds.action.help": "\u041F\u043E\u043C\u043E\u0449\u044C",
  "gds.action.filter": "\u0424\u0438\u043B\u044C\u0442\u0440",
  "gds.action.sort": "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430",
  "gds.action.export": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442",
  "gds.action.import": "\u0418\u043C\u043F\u043E\u0440\u0442",
  "gds.action.preview": "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
  "gds.action.clone": "\u041A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
  "gds.action.restore": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
  "gds.action.toggle": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C",
  "gds.action.search": "\u041F\u043E\u0438\u0441\u043A",
  "gds.action.submit": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
  "gds.action.reset": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C",
  "gds.action.login": "\u0412\u043E\u0439\u0442\u0438",
  "gds.action.register": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F",
  "gds.action.verify": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C",
  "gds.action.launch": "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C",
  "gds.action.draft": "\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A",
  "gds.action.refer": "\u041D\u0430\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
  "gds.action.evidence": "\u0414\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E",
  "gds.feedback.saved": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E",
  "gds.feedback.error": "\u0427\u0442\u043E-\u0442\u043E \u043F\u043E\u0448\u043B\u043E \u043D\u0435 \u0442\u0430\u043A",
  "gds.feedback.added": "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E",
  "gds.feedback.edited": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u043E",
  "gds.feedback.deleted": "\u0423\u0434\u0430\u043B\u0435\u043D\u043E",
  "gds.feedback.canceled": "\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u043E",
  "gds.feedback.confirmed": "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E",
  "gds.feedback.closed": "\u0417\u0430\u043A\u0440\u044B\u0442\u043E",
  "gds.feedback.changed": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u043E",
  "gds.feedback.loaded": "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E",
  "gds.feedback.started": "\u041D\u0430\u0447\u0430\u0442\u043E",
  "gds.feedback.opened": "\u041E\u0442\u043A\u0440\u044B\u0442\u043E",
  "gds.feedback.sent": "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E",
  "gds.feedback.replied": "\u041E\u0442\u0432\u0435\u0447\u0435\u043D\u043E",
  "gds.feedback.forwarded": "\u041F\u0435\u0440\u0435\u0441\u043B\u0430\u043D\u043E",
  "gds.feedback.attached": "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u043E",
  "gds.feedback.uploaded": "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E",
  "gds.feedback.downloaded": "\u0421\u043A\u0430\u0447\u0430\u043D\u043E",
  "gds.feedback.printed": "\u0420\u0430\u0441\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E",
  "gds.feedback.copied": "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
  "gds.feedback.duplicated": "\u0414\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
  "gds.feedback.checked": "\u041E\u0442\u043C\u0435\u0447\u0435\u043D\u043E",
  "gds.feedback.unchecked": "\u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u0441\u043D\u044F\u0442\u0430",
  "gds.feedback.completed": "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E",
  "gds.feedback.cleared": "\u041E\u0447\u0438\u0449\u0435\u043D\u043E",
  "gds.feedback.captured": "\u0421\u043D\u044F\u0442\u043E",
  "gds.feedback.recorded": "\u0417\u0430\u043F\u0438\u0441\u0430\u043D\u043E",
  "gds.feedback.flipped": "\u041F\u0435\u0440\u0435\u0432\u0435\u0440\u043D\u0443\u0442\u043E",
  "gds.feedback.flashed": "\u0412\u0441\u043F\u044B\u0448\u043A\u0430",
  "gds.feedback.done": "\u0413\u043E\u0442\u043E\u0432\u043E",
  "gds.feedback.rewarded": "\u041D\u0430\u0433\u0440\u0430\u0436\u0434\u0435\u043D\u043E",
  "gds.feedback.paused": "\u041F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
  "gds.feedback.mailed": "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E",
  "gds.feedback.refreshed": "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
  "gds.feedback.loggedOut": "\u0412\u044B\u0448\u0435\u043B",
  "gds.feedback.filtered": "\u041E\u0442\u0444\u0438\u043B\u044C\u0442\u0440\u043E\u0432\u0430\u043D\u043E",
  "gds.feedback.sorted": "\u041E\u0442\u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
  "gds.feedback.exported": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
  "gds.feedback.imported": "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
  "gds.feedback.previewed": "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043E",
  "gds.feedback.cloned": "\u041A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
  "gds.feedback.restored": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
  "gds.feedback.toggled": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
  "gds.feedback.searched": "\u041D\u0430\u0439\u0434\u0435\u043D\u043E",
  "gds.feedback.submitted": "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E",
  "gds.feedback.reset": "\u0421\u0431\u0440\u043E\u0448\u0435\u043D\u043E",
  "gds.feedback.loggedIn": "\u0412\u0445\u043E\u0434 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D",
  "gds.feedback.registered": "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
  "gds.feedback.verified": "\u041F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E",
  "gds.feedback.launched": "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u043E",
  "gds.feedback.drafted": "\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0441\u043E\u0437\u0434\u0430\u043D",
  "gds.feedback.referred": "\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E",
  "gds.aria.themeToggle": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0446\u0432\u0435\u0442\u043E\u0432\u0443\u044E \u0441\u0445\u0435\u043C\u0443",
  "gds.state.emptyData": "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445."
};

// src/locales/he.ts
var he = {
  "gds.action.settings": "\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA",
  "gds.action.analytics": "\u05E0\u05D9\u05EA\u05D5\u05D7 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD",
  "gds.action.dashboard": "\u05DC\u05D5\u05D7 \u05D1\u05E7\u05E8\u05D4",
  "gds.action.play": "\u05D4\u05E4\u05E2\u05DC",
  "gds.action.start": "\u05D4\u05EA\u05D7\u05DC",
  "gds.action.users": "\u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD",
  "gds.action.add": "\u05D4\u05D5\u05E1\u05E3",
  "gds.action.edit": "\u05E2\u05E8\u05D5\u05DA",
  "gds.action.delete": "\u05DE\u05D7\u05E7",
  "gds.action.save": "\u05E9\u05DE\u05D5\u05E8",
  "gds.action.cancel": "\u05D1\u05D9\u05D8\u0648\u0644",
  "gds.action.confirm": "\u05D0\u05D9\u05E9\u05D5\u05E8",
  "gds.action.close": "\u05E1\u05D2\u05D5\u05E8",
  "gds.action.language": "\u05E9\u05E4\u05D4",
  "gds.action.theme": "\u05E2\u05E8\u05DB\u05EA \u05E0\u05D5\u05E9\u05D0",
  "gds.action.home": "\u05D3\u05E3 \u05D4\u05D1\u05D9\u05EA",
  "gds.action.inbox": "\u05D3\u05D5\u05D0\u05E8 \u05E0\u05DB\u05E0\u05E1",
  "gds.action.calendar": "\u05DC\u05D5\u05D7 \u05E9\u05E0\u05D4",
  "gds.action.gallery": "\u05D2\u05DC\u05E8\u05D9\u05D4",
  "gds.action.history": "\u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D4",
  "gds.action.profile": "\u05E4\u05E8\u05D5\u05E4\u05D9\u05DC",
  "gds.action.send": "\u05E9\u05DC\u05D7",
  "gds.action.reply": "\u05D4\u05E9\u05D1",
  "gds.action.forward": "\u05D4\u05E2\u05D1\u05E8",
  "gds.action.attach": "\u05E6\u05E8\u05E3",
  "gds.action.upload": "\u05D4\u05E2\u05DC\u05D4",
  "gds.action.download": "\u05D4\u05D5\u05E8\u05D3",
  "gds.action.print": "\u05D4\u05D3\u05E4\u05E1",
  "gds.action.copy": "\u05D4\u05E2\u05EA\u05E7",
  "gds.action.duplicate": "\u05E9\u05DB\u05E4\u05DC",
  "gds.action.check": "\u05E1\u05DE\u05DF",
  "gds.action.uncheck": "\u05D1\u05D8\u05DC \u05E1\u05D9\u05DE\u05D5\u05DF",
  "gds.action.complete": "\u05D4\u05E9\u05DC\u05DD",
  "gds.action.clear": "\u05E0\u05E7\u05D4",
  "gds.action.capture": "\u05E6\u05DC\u05DD",
  "gds.action.record": "\u05D4\u05E7\u05DC\u05D8",
  "gds.action.flip": "\u05D4\u05E4\u05D5\u05DA",
  "gds.action.flash": "\u05DE\u05D1\u05D6\u05E7",
  "gds.action.course": "\u05E7\u05D5\u05E8\u05E1",
  "gds.action.lesson": "\u05E9\u05D9\u05E2\u05D5\u05E8",
  "gds.action.certificate": "\u05EA\u05E2\u05D5\u05D3\u05D4",
  "gds.action.student": "\u05EA\u05DC\u05DE\u05D9\u05D3",
  "gds.action.class": "\u05DB\u05D9\u05EA\u05D4",
  "gds.action.grade": "\u05E6\u05D9\u05D5\u05DF",
  "gds.action.child": "\u05D9\u05DC\u05D3",
  "gds.action.family": "\u05DE\u05E9\u05E4\u05D7\u05D4",
  "gds.action.habit": "\u05D4\u05E8\u05D2\u05DC",
  "gds.action.goal": "\u05DE\u05D8\u05E8\u05D4",
  "gds.action.streak": "\u05E8\u05E6\u05E3",
  "gds.action.reward": "\u05E4\u05E8\u05E1",
  "gds.action.trophy": "\u05D2\u05D1\u05D9\u05E2",
  "gds.action.crown": "\u05DB\u05EA\u05E8",
  "gds.action.pause": "\u05D4\u05E9\u05D4\u05D4",
  "gds.action.message": "\u05D4\u05D5\u05D3\u05E2\u05D4",
  "gds.action.mail": "\u05D3\u05D5\u05D0\u05E8",
  "gds.action.refresh": "\u05E8\u05E2\u05E0\u05DF",
  "gds.action.trendingUp": "\u05DE\u05D2\u05DE\u05D4 \u05D7\u05D9\u05D5\u05D1\u05D9\u05EA",
  "gds.action.trendingDown": "\u05DE\u05D2\u05DE\u05D4 \u05E9\u05DC\u05D9\u05DC\u05D9\u05EA",
  "gds.action.currency": "\u05DE\u05D8\u05D1\u05E2",
  "gds.action.grid": "\u05E8\u05E9\u05EA",
  "gds.action.list": "\u05E8\u05E9\u05D9\u05DE\u05D4",
  "gds.action.logout": "\u05D4\u05EA\u05E0\u05EA\u05E7",
  "gds.action.notifications": "\u05D4\u05EA\u05E8\u05D0\u05D5\u05EA",
  "gds.action.back": "\u05D7\u05D6\u05D5\u05E8",
  "gds.action.eye": "\u05D4\u05E6\u05D2",
  "gds.action.eyeOff": "\u05D4\u05E1\u05EA\u05E8",
  "gds.action.help": "\u05E2\u05D6\u05E8\u05D4",
  "gds.action.filter": "\u05E1\u05E0\u05DF",
  "gds.action.sort": "\u05DE\u05D9\u05D9\u05DF",
  "gds.action.export": "\u05D9\u05D9\u05E6\u05D5\u05D0",
  "gds.action.import": "\u05D9\u05D9\u05D1\u05D5\u05D0",
  "gds.action.preview": "\u05EA\u05E6\u05D5\u05D2\u05D4 \u05DE\u05E7\u05D3\u05D9\u05DE\u05D4",
  "gds.action.clone": "\u05E9\u05DB\u05E4\u05D5\u05DC",
  "gds.action.restore": "\u05E9\u05D7\u05D6\u05D5\u05E8",
  "gds.action.toggle": "\u05D4\u05D7\u05DC\u05E4\u05D4",
  "gds.action.search": "\u05D7\u05D9\u05E4\u05D5\u05E9",
  "gds.action.submit": "\u05E9\u05DC\u05D9\u05D7\u05D4",
  "gds.action.reset": "\u05D0\u05D9\u05E4\u05D5\u05E1",
  "gds.action.login": "\u05D4\u05EA\u05D7\u05D1\u05E8\u05D5\u05EA",
  "gds.action.register": "\u05D4\u05E8\u05E9\u05DE\u05D4",
  "gds.action.verify": "\u05D0\u05D9\u05DE\u05D5\u05EA",
  "gds.action.launch": "\u05D4\u05E9\u05E7\u05D4",
  "gds.action.draft": "\u05D8\u05D9\u05D5\u05D8\u05D4",
  "gds.action.refer": "\u05D4\u05E4\u05E0\u05D9\u05D4",
  "gds.action.evidence": "\u05E8\u05D0\u05D9\u05D4",
  "gds.feedback.saved": "\u05E0\u05E9\u05DE\u05E8",
  "gds.feedback.error": "\u05DE\u05E9\u05D4\u05D5 \u05D4\u05E9\u05EA\u05D1\u05E9",
  "gds.feedback.added": "\u05E0\u05D5\u05E1\u05E3",
  "gds.feedback.edited": "\u05E0\u05E2\u05E8\u05DA",
  "gds.feedback.deleted": "\u05E0\u05DE\u05D7\u05E7",
  "gds.feedback.canceled": "\u05D1\u05D5\u05D8\u05DC",
  "gds.feedback.confirmed": "\u05D0\u05D5\u05E9\u05E8",
  "gds.feedback.closed": "\u05E0\u05E1\u05D2\u05E8",
  "gds.feedback.changed": "\u05E9\u05D5\u05E0\u05D4",
  "gds.feedback.loaded": "\u05E0\u05D8\u05E2\u05DF",
  "gds.feedback.started": "\u05D4\u05D5\u05EA\u05D7\u05DC",
  "gds.feedback.opened": "\u05E0\u05E4\u05EA\u05D7",
  "gds.feedback.sent": "\u05E0\u05E9\u05DC\u05D7",
  "gds.feedback.replied": "\u05E0\u05E2\u05E0\u05D4",
  "gds.feedback.forwarded": "\u05D4\u05D5\u05E2\u05D1\u05E8",
  "gds.feedback.attached": "\u05E6\u05D5\u05E8\u05E3",
  "gds.feedback.uploaded": "\u05D4\u05D5\u05E2\u05DC\u05D4",
  "gds.feedback.downloaded": "\u05D4\u05D5\u05E8\u05D3",
  "gds.feedback.printed": "\u05D4\u05D5\u05D3\u05E4\u05E1",
  "gds.feedback.copied": "\u05D4\u05D5\u05E2\u05EA\u05E7",
  "gds.feedback.duplicated": "\u05E9\u05D5\u05DB\u05E4\u05DC",
  "gds.feedback.checked": "\u05E1\u05D5\u05DE\u05DF",
  "gds.feedback.unchecked": "\u05D4\u05E1\u05D9\u05DE\u05D5\u05DF \u05D1\u05D5\u05D8\u05DC",
  "gds.feedback.completed": "\u05D4\u05D5\u05E9\u05DC\u05DD",
  "gds.feedback.cleared": "\u05E0\u05D5\u05E7\u05D4",
  "gds.feedback.captured": "\u05E6\u05D5\u05DC\u05DD",
  "gds.feedback.recorded": "\u05D4\u05D5\u05E7\u05DC\u05D8",
  "gds.feedback.flipped": "\u05E0\u05D4\u05E4\u05DA",
  "gds.feedback.flashed": "\u05D4\u05D5\u05D1\u05D6\u05E7",
  "gds.feedback.done": "\u05D1\u05D5\u05E6\u05E2",
  "gds.feedback.rewarded": "\u05EA\u05D5\u05D2\u05DE\u05DC",
  "gds.feedback.paused": "\u05D4\u05D5\u05E9\u05D4\u05D4",
  "gds.feedback.mailed": "\u05E0\u05E9\u05DC\u05D7",
  "gds.feedback.refreshed": "\u05E8\u05D5\u05E2\u05E0\u05DF",
  "gds.feedback.loggedOut": "\u05D4\u05EA\u05E0\u05EA\u05E7",
  "gds.feedback.filtered": "\u05E1\u05D5\u05E0\u05DF",
  "gds.feedback.sorted": "\u05DE\u05D5\u05D9\u05DF",
  "gds.feedback.exported": "\u05D9\u05D5\u05E6\u05D0",
  "gds.feedback.imported": "\u05D9\u05D5\u05D1\u05D0",
  "gds.feedback.previewed": "\u05D4\u05D5\u05E6\u05D2",
  "gds.feedback.cloned": "\u05E9\u05D5\u05DB\u05E4\u05DC",
  "gds.feedback.restored": "\u05E9\u05D5\u05D7\u05D6\u05E8",
  "gds.feedback.toggled": "\u05D4\u05D5\u05D7\u05DC\u05E3",
  "gds.feedback.searched": "\u05D7\u05D9\u05E4\u05D5\u05E9 \u05D4\u05D5\u05E9\u05DC\u05DD",
  "gds.feedback.submitted": "\u05E0\u05E9\u05DC\u05D7",
  "gds.feedback.reset": "\u05D0\u05D5\u05E4\u05E1",
  "gds.feedback.loggedIn": "\u05D4\u05EA\u05D7\u05D1\u05E8",
  "gds.feedback.registered": "\u05E0\u05E8\u05E9\u05DD",
  "gds.feedback.verified": "\u05D0\u05D5\u05DE\u05EA",
  "gds.feedback.launched": "\u05D4\u05D5\u05E9\u05E7",
  "gds.feedback.drafted": "\u05E0\u05E9\u05DE\u05E8 \u05DB\u05D8\u05D9\u05D5\u05D8\u05D4",
  "gds.feedback.referred": "\u05D4\u05D5\u05E4\u05E0\u05D4",
  "gds.aria.themeToggle": "\u05D4\u05D7\u05DC\u05E3 \u05E2\u05E8\u05DB\u05EA \u05E6\u05D1\u05E2\u05D9\u05DD",
  "gds.state.emptyData": "\u05D0\u05D9\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05D6\u05DE\u05D9\u05E0\u05D9\u05DD."
};

// src/locales/ar.ts
var ar = {
  "gds.action.settings": "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
  "gds.action.analytics": "\u062A\u062D\u0644\u064A\u0644\u0627\u062A",
  "gds.action.dashboard": "\u0644\u0648\u062D\u0629 \u0627\u0644\u0642\u064A\u0627\u062F\u0629",
  "gds.action.play": "\u062A\u0634\u063A\u064A\u0644",
  "gds.action.start": "\u0628\u062F\u0621",
  "gds.action.users": "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646",
  "gds.action.add": "\u0625\u0636\u0627\u0641\u0629",
  "gds.action.edit": "\u062A\u0639\u062F\u064A\u0644",
  "gds.action.delete": "\u062D\u0630\u0641",
  "gds.action.save": "\u062D\u0641\u0638",
  "gds.action.cancel": "\u0625\u0644\u063A\u0627\u0621",
  "gds.action.confirm": "\u062A\u0623\u0643\u064A\u062F",
  "gds.action.close": "\u0625\u063A\u0644\u0627\u0642",
  "gds.action.language": "\u0627\u0644\u0644\u063A\u0629",
  "gds.action.theme": "\u0627\u0644\u0633\u0645\u0629",
  "gds.action.home": "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
  "gds.action.inbox": "\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0648\u0627\u0631\u062F",
  "gds.action.calendar": "\u0627\u0644\u062A\u0642\u0648\u064A\u0645",
  "gds.action.gallery": "\u0627\u0644\u0645\u0639\u0631\u0636",
  "gds.action.history": "\u0627\u0644\u0633\u062C\u0644",
  "gds.action.profile": "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",
  "gds.action.send": "\u0625\u0631\u0633\u0627\u0644",
  "gds.action.reply": "\u0631\u062F",
  "gds.action.forward": "\u0625\u0639\u0627\u062F\u0629 \u062A\u0648\u062C\u064A\u0647",
  "gds.action.attach": "\u0625\u0631\u0641\u0627\u0642",
  "gds.action.upload": "\u0631\u0641\u0639",
  "gds.action.download": "\u062A\u0646\u0632\u064A\u0644",
  "gds.action.print": "\u0637\u0628\u0627\u0639\u0629",
  "gds.action.copy": "\u0646\u0633\u062E",
  "gds.action.duplicate": "\u062A\u0643\u0631\u0627\u0631",
  "gds.action.check": "\u062A\u062D\u062F\u064A\u062F",
  "gds.action.uncheck": "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062D\u062F\u064A\u062F",
  "gds.action.complete": "\u0627\u0643\u062A\u0645\u0627\u0644",
  "gds.action.clear": "\u0645\u0633\u062D",
  "gds.action.capture": "\u0627\u0644\u062A\u0642\u0627\u0637",
  "gds.action.record": "\u062A\u0633\u062C\u064A\u0644",
  "gds.action.flip": "\u0642\u0644\u0628",
  "gds.action.flash": "\u0641\u0644\u0627\u0634",
  "gds.action.course": "\u062F\u0648\u0631\u0629",
  "gds.action.lesson": "\u062F\u0631\u0633",
  "gds.action.certificate": "\u0634\u0647\u0627\u062F\u0629",
  "gds.action.student": "\u0637\u0627\u0644\u0628",
  "gds.action.class": "\u0641\u0635\u0644",
  "gds.action.grade": "\u062F\u0631\u062C\u0629",
  "gds.action.child": "\u0637\u0641\u0644",
  "gds.action.family": "\u0639\u0627\u0626\u0644\u0629",
  "gds.action.habit": "\u0639\u0627\u062F\u0629",
  "gds.action.goal": "\u0647\u062F\u0641",
  "gds.action.streak": "\u0633\u0644\u0633\u0644\u0629",
  "gds.action.reward": "\u0645\u0643\u0627\u0641\u0623\u0629",
  "gds.action.trophy": "\u0643\u0623\u0633",
  "gds.action.crown": "\u062A\u0627\u062C",
  "gds.action.pause": "\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A",
  "gds.action.message": "\u0631\u0633\u0627\u0644\u0629",
  "gds.action.mail": "\u0628\u0631\u064A\u062F",
  "gds.action.refresh": "\u062A\u062D\u062F\u064A\u062B",
  "gds.action.trendingUp": "\u0627\u062A\u062C\u0627\u0647 \u0635\u0627\u0639\u062F",
  "gds.action.trendingDown": "\u0627\u062A\u062C\u0627\u0647 \u0647\u0627\u0628\u0637",
  "gds.action.currency": "\u0639\u0645\u0644\u0629",
  "gds.action.grid": "\u0634\u0628\u0643\u0629",
  "gds.action.list": "\u0642\u0627\u0626\u0645\u0629",
  "gds.action.logout": "\u062A\u0633\u062C\u064A\u0644 \u062E\u0631\u0648\u062C",
  "gds.action.notifications": "\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
  "gds.action.back": "\u0631\u062C\u0648\u0639",
  "gds.action.eye": "\u0639\u0631\u0636",
  "gds.action.eyeOff": "\u0625\u062E\u0641\u0627\u0621",
  "gds.action.help": "\u0645\u0633\u0627\u0639\u062F\u0629",
  "gds.action.filter": "\u062A\u0635\u0641\u064A\u0629",
  "gds.action.sort": "\u0641\u0631\u0632",
  "gds.action.export": "\u062A\u0635\u062F\u064A\u0631",
  "gds.action.import": "\u0627\u0633\u062A\u064A\u0631\u0627\u062F",
  "gds.action.preview": "\u0645\u0639\u0627\u064A\u0646\u0629",
  "gds.action.clone": "\u0627\u0633\u062A\u0646\u0633\u0627\u062E",
  "gds.action.restore": "\u0627\u0633\u062A\u0639\u0627\u062F\u0629",
  "gds.action.toggle": "\u062A\u0628\u062F\u064A\u0644",
  "gds.action.search": "\u0628\u062D\u062B",
  "gds.action.submit": "\u0625\u0631\u0633\u0627\u0644",
  "gds.action.reset": "\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637",
  "gds.action.login": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
  "gds.action.register": "\u062A\u0633\u062C\u064A\u0644",
  "gds.action.verify": "\u062A\u062D\u0642\u0642",
  "gds.action.launch": "\u0625\u0637\u0644\u0627\u0642",
  "gds.action.draft": "\u0645\u0633\u0648\u062F\u0629",
  "gds.action.refer": "\u0625\u062D\u0627\u0644\u0629",
  "gds.action.evidence": "\u062F\u0644\u064A\u0644",
  "gds.feedback.settings": "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
  "gds.feedback.analytics": "\u062A\u062D\u0644\u064A\u0644\u0627\u062A",
  "gds.feedback.dashboard": "\u0644\u0648\u062D\u0629 \u0627\u0644\u0642\u064A\u0627\u062F\u0629",
  "gds.feedback.play": "\u062A\u0634\u063A\u064A\u0644",
  "gds.feedback.start": "\u0628\u062F\u0621",
  "gds.feedback.users": "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646",
  "gds.feedback.add": "\u0625\u0636\u0627\u0641\u0629",
  "gds.feedback.edit": "\u062A\u0639\u062F\u064A\u0644",
  "gds.feedback.delete": "\u062D\u0630\u0641",
  "gds.feedback.save": "\u062D\u0641\u0638",
  "gds.feedback.cancel": "\u0625\u0644\u063A\u0627\u0621",
  "gds.feedback.confirm": "\u062A\u0623\u0643\u064A\u062F",
  "gds.feedback.close": "\u0625\u063A\u0644\u0627\u0642",
  "gds.feedback.language": "\u0627\u0644\u0644\u063A\u0629",
  "gds.feedback.theme": "\u0627\u0644\u0633\u0645\u0629",
  "gds.feedback.home": "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
  "gds.feedback.inbox": "\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0648\u0627\u0631\u062F",
  "gds.feedback.calendar": "\u0627\u0644\u062A\u0642\u0648\u064A\u0645",
  "gds.feedback.gallery": "\u0627\u0644\u0645\u0639\u0631\u0636",
  "gds.feedback.history": "\u0627\u0644\u0633\u062C\u0644",
  "gds.feedback.profile": "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",
  "gds.feedback.send": "\u0625\u0631\u0633\u0627\u0644",
  "gds.feedback.reply": "\u0631\u062F",
  "gds.feedback.forward": "\u0625\u0639\u0627\u062F\u0629 \u062A\u0648\u062C\u064A\u0647",
  "gds.feedback.attach": "\u0625\u0631\u0641\u0627\u0642",
  "gds.feedback.upload": "\u0631\u0641\u0639",
  "gds.feedback.download": "\u062A\u0646\u0632\u064A\u0644",
  "gds.feedback.print": "\u0637\u0628\u0627\u0639\u0629",
  "gds.feedback.copy": "\u0646\u0633\u062E",
  "gds.feedback.duplicate": "\u062A\u0643\u0631\u0627\u0631",
  "gds.feedback.check": "\u062A\u062D\u062F\u064A\u062F",
  "gds.feedback.uncheck": "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062D\u062F\u064A\u062F",
  "gds.feedback.complete": "\u0627\u0643\u062A\u0645\u0627\u0644",
  "gds.feedback.clear": "\u0645\u0633\u062D",
  "gds.feedback.capture": "\u0627\u0644\u062A\u0642\u0627\u0637",
  "gds.feedback.record": "\u062A\u0633\u062C\u064A\u0644",
  "gds.feedback.flip": "\u0642\u0644\u0628",
  "gds.feedback.flash": "\u0641\u0644\u0627\u0634",
  "gds.feedback.course": "\u062F\u0648\u0631\u0629",
  "gds.feedback.lesson": "\u062F\u0631\u0633",
  "gds.feedback.certificate": "\u0634\u0647\u0627\u062F\u0629",
  "gds.feedback.student": "\u0637\u0627\u0644\u0628",
  "gds.feedback.class": "\u0641\u0635\u0644",
  "gds.feedback.grade": "\u062F\u0631\u062C\u0629",
  "gds.feedback.child": "\u0637\u0641\u0644",
  "gds.feedback.family": "\u0639\u0627\u0626\u0644\u0629",
  "gds.feedback.habit": "\u0639\u0627\u062F\u0629",
  "gds.feedback.goal": "\u0647\u062F\u0641",
  "gds.feedback.streak": "\u0633\u0644\u0633\u0644\u0629",
  "gds.feedback.reward": "\u0645\u0643\u0627\u0641\u0623\u0629",
  "gds.feedback.trophy": "\u0643\u0623\u0633",
  "gds.feedback.crown": "\u062A\u0627\u062C",
  "gds.feedback.pause": "\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A",
  "gds.feedback.message": "\u0631\u0633\u0627\u0644\u0629",
  "gds.feedback.mail": "\u0628\u0631\u064A\u062F",
  "gds.feedback.refresh": "\u062A\u062D\u062F\u064A\u062B",
  "gds.feedback.trendingUp": "\u0627\u062A\u062C\u0627\u0647 \u0635\u0627\u0639\u062F",
  "gds.feedback.trendingDown": "\u0627\u062A\u062C\u0627\u0647 \u0647\u0627\u0628\u0637",
  "gds.feedback.currency": "\u0639\u0645\u0644\u0629",
  "gds.feedback.grid": "\u0634\u0628\u0643\u0629",
  "gds.feedback.list": "\u0642\u0627\u0626\u0645\u0629",
  "gds.feedback.logout": "\u062A\u0633\u062C\u064A\u0644 \u062E\u0631\u0648\u062C",
  "gds.feedback.notifications": "\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
  "gds.feedback.back": "\u0631\u062C\u0648\u0639",
  "gds.feedback.eye": "\u0639\u0631\u0636",
  "gds.feedback.eyeOff": "\u0625\u062E\u0641\u0627\u0621",
  "gds.feedback.help": "\u0645\u0633\u0627\u0639\u062F\u0629",
  "gds.feedback.filter": "\u062A\u0635\u0641\u064A\u0629",
  "gds.feedback.sort": "\u0641\u0631\u0632",
  "gds.feedback.exported": "\u062A\u0645 \u0627\u0644\u062A\u0635\u062F\u064A\u0631",
  "gds.feedback.imported": "\u062A\u0645 \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F",
  "gds.feedback.previewed": "\u062A\u0645\u062A \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629",
  "gds.feedback.cloned": "\u062A\u0645 \u0627\u0644\u0627\u0633\u062A\u0646\u0633\u0627\u062E",
  "gds.feedback.restored": "\u062A\u0645\u062A \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629",
  "gds.feedback.toggled": "\u062A\u0645 \u0627\u0644\u062A\u0628\u062F\u064A\u0644",
  "gds.feedback.searched": "\u062A\u0645 \u0627\u0644\u0628\u062D\u062B",
  "gds.feedback.submitted": "\u062A\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644",
  "gds.feedback.reset": "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0636\u0628\u0637",
  "gds.feedback.loggedIn": "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
  "gds.feedback.registered": "\u062A\u0645 \u0627\u0644\u062A\u0633\u062C\u064A\u0644",
  "gds.feedback.verified": "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642",
  "gds.feedback.launched": "\u062A\u0645 \u0627\u0644\u0625\u0637\u0644\u0627\u0642",
  "gds.feedback.drafted": "\u062A\u0645 \u0627\u0644\u062D\u0641\u0638 \u0643\u0645\u0633\u0648\u062F\u0629",
  "gds.feedback.referred": "\u062A\u0645\u062A \u0627\u0644\u0625\u062D\u0627\u0644\u0629",
  "gds.feedback.error": "\u062D\u062F\u062B \u062E\u0637\u0623 \u0645\u0627",
  "gds.aria.themeToggle": "\u062A\u0628\u062F\u064A\u0644 \u0646\u0638\u0627\u0645 \u0627\u0644\u0623\u0644\u0648\u0627\u0646",
  "gds.state.emptyData": "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062A\u0627\u062D\u0629."
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AccessSummary,
  ArticleShell,
  AuthShell,
  ConfirmDialog,
  DataToolbar,
  EmptyState,
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
});
