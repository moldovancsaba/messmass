// WHAT: Distinguishes "this call changed something" from "nothing was there
//     to change" -- the DELETE /api/page-passwords response's own `removed`
//     field, previously never read by SharePopup.
// WHY: Split out from components/SharePopup.tsx so it's unit testable
//     without pulling in that file's client-component import chain
//     (BaseModal -> @mantine/core, which touches browser-only APIs at
//     module-load time under this repo's node-environment jest config).
export function deriveRemovalInfoMessage(removed: boolean | undefined): string {
  return removed ? 'Protection removed.' : 'Protection was already off for this page.';
}
