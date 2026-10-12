// lib/clipboard.ts
// WHAT: Copy text to the clipboard with the asynchronous Clipboard API and report
//     whether it worked.
// WHY: The two admin dialogs that copy a share link or a password
//     (components/SharePopup.tsx, components/PasswordModal.tsx) fell back to the
//     document copy command (the old execCommand API) when the Clipboard API threw.
//     That API is deprecated (messmass#465). navigator.clipboard exists only in a secure
//     context (https or localhost); both dialogs live in the admin area, which is
//     served over https in production and from localhost in development, so the
//     legacy fallback was dead weight there. A page that could be opened over plain
//     http (a LAN address on a phone, say) would still need one -- that is the only
//     case where a fallback earns its place, and nothing here is such a page.
// HOW: Resolve true when the text reached the clipboard, false otherwise (API
//     missing, permission refused, document not focused). Never throws, so the
//     caller decides what the person sees on failure.

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  const clipboard = navigator.clipboard;
  if (!clipboard || typeof clipboard.writeText !== 'function') return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
