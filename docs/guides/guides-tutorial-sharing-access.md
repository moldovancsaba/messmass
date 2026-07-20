# Tutorial: Sharing reports & access control
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & implementation partners (partners can self-serve edit/view via link + password) · Prerequisites: An admin sign-in for the Share popup; an event, partner, organisation, filter, or hashtag page to share · Related: [Events](guides-tutorial-events.md) · [Collecting event data](guides-tutorial-collecting-data.md) · [Authentication & SSO](guides-tutorial-authentication-sso.md)

## What it is & why it matters
messmass has to let the right people see the right thing without handing everyone an admin account. It does this with two mechanisms:

- **Unguessable UUID slugs** — report URLs contain a random UUID that cannot be guessed, so the link itself is the access control.
- **Page passwords** — a per-page password that gates the surfaces that need an extra lock.

The subtle part — and the part operators most often get wrong — is that **not every surface is gated the same way.** Reports are open to anyone with the link; filter, hashtag, and all edit surfaces require a password. Get this right and you share confidently; get it wrong and you either expose editing or block a viewer.

## Before you start
- You need to be **signed in as an admin** to open the **Share popup** and generate links/passwords.
- Know **which surface** you are sharing — the rules differ by page type (see the table below).
- Decide **who** should be able to view vs. edit. Never send an edit link when you mean a report.

## Step by step

### 1. Open the Share popup
From an admin list (for example `/admin/events`), use the surface's **Share** action. The Share popup opens with the title matching the surface (e.g. "Share Statistics Page" or "Share Edit Page").

### 2. Read what it gives you
The popup generates two things for the page:

- **🔗 Shareable URL** — the link to the page. There are **Copy** and **🔎 Visit** buttons.
- **🔐 Access Password** — a 32-character password (looks like an MD5 hash). There is a **Copy** button.

There is also an optional **Recipient Name or Email** field. It is **for your reference only** — a note to help you remember who you shared with. It does not restrict who can use the link.

### 3. Follow the built-in instructions
The popup spells out the safe way to share:

1. Share the URL with the intended recipient.
2. Provide the password **separately** (through a different channel), for security.
3. They use the password to open the page — and **signed-in admins bypass the prompt** entirely.

### 4. Know which surfaces actually prompt for the password
This is the crucial rule. The Share popup can generate a password for any page type, but only some surfaces actually **prompt** for it:

| Surface | URL shape | Password-prompted? | Protected by |
|---|---|---|---|
| Event report | `/report/{viewSlug}` | **No** | Unguessable UUID slug |
| Partner report | `/partner-report/{slug}` | **No** | Unguessable slug |
| Organisation report | `/organization-report/{id}` | **No** | Unguessable id |
| Filter page | `/filter/{slug}` | **Yes** | Page password |
| Hashtag page | `/hashtag/{hashtag}` | **Yes** | Page password |
| Event editor | `/edit/{editSlug}` | **Yes** | Page password |
| Partner editor | `/partner-edit/{slug}` | **Yes** | Page password |
| Organisation editor | `/organization-edit/{id}` | **Yes** | Page password |

In plain terms:

- **Event, partner, and organisation reports are NOT password-prompted.** Anyone with the link can view them. Their protection is that the UUID slug in the URL is random and cannot be guessed. Treat the report link itself as the secret.
- **Filter and hashtag pages ARE password-gated.** These aggregate across many events, so they carry a password prompt on top of the link.
- **All edit surfaces (`/edit`, `/partner-edit`, `/organization-edit`) are page-password gated.** This is exactly what lets a non-admin edit via a link plus password without an admin account.

### 5. Enter the password (the recipient's view)
When a recipient opens a gated page, they see the **Access Required** screen: a single password field and an **Access Page** button. On success they are let in. The screen also reminds them that a signed-in admin session bypasses the prompt.

## Managing it
**How sessions behave.** When a recipient enters a valid page password, messmass remembers it for that page in their browser session, so they are not re-prompted on every reload:

- **Page-password access lasts 24 hours.**
- **Admin sessions last 7 days.**

After the window, the page prompts again. This is per page and per browser — clearing the browser session or using another device requires re-entry.

**Admins bypass everything.** A signed-in admin session is checked first; if present, the page opens without any prompt on any gated surface. This is why an operator testing a "gated" link while still logged in as admin may never see the password screen — open it in a private window (or while signed out) to experience what the recipient experiences.

**Regenerating vs. reusing.** Opening the Share popup reuses the existing password for a page rather than minting a new one each time, so a link and password you shared earlier keep working. Treat the password like a shared secret and rotate it (via admin tooling) if it leaks.

**The page types at a glance.** messmass recognises a fixed set of page types, and each maps to one URL family and one gating rule:

- `event-report`, `partner-report`, `organization-report` — **open** (UUID-protected reports).
- `filter`, `hashtag` — **password-gated** aggregate pages.
- `edit`, `partner-edit`, `organization-edit` — **password-gated** editing surfaces.

When you generate a link, the popup already knows the page type and produces the correct URL family; your job is just to pick the right surface and route the password appropriately.

**Staff dashboards (SSO).** Beyond the shareable surfaces above, there are internal analytics dashboards under **`/dashboard/*`** (for example `/dashboard/partner`, `/dashboard/hashtag`, `/dashboard/filter`). These are **not** page-password surfaces — they require a signed-in admin session, and when single sign-on is configured they require an **SSO** session specifically. The same SSO requirement applies to `/admin/dashboard`. See [Authentication & SSO](guides-tutorial-authentication-sso.md).

## Gotchas & good practice
- **The report link IS the password.** Because reports are not prompted, forwarding a `/report/...`, `/partner-report/...`, or `/organization-report/...` link gives full view access. Share it only with people who should see the numbers.
- **Never paste an edit link where you meant a report.** `/edit/...` grants data-entry access. If you want someone to only look, send the `/report/...` link.
- **Send URL and password on separate channels.** The popup recommends it: one leaked message should not both reveal the link and unlock it.
- **Test gated links while signed out.** Admins bypass the prompt, so a quick "does the password work?" check must be done in a private/incognito window.
- **The recipient field is a memo, not a lock.** Filling in a name or email does not tie the link to that person — anyone with the URL (and password, where required) still gets in.
- **24h means re-prompting.** Field partners returning the next day will be asked for the password again — that is expected, not a failure. Keep the password handy for them.
- **Dashboards are staff-only.** Do not try to hand out `/dashboard/*` via a page password; those require an admin (and SSO where configured) sign-in.

## How it connects
- **Reports** are the primary thing you share — see [Reports](guides-tutorial-reports.md) and [Report variants](guides-tutorial-report-variants.md).
- **Editing via link + password** is how partners self-serve data entry — see [Collecting event data](guides-tutorial-collecting-data.md).
- **Filter and hashtag pages** are the gated aggregate surfaces — see [Hashtags & filters](guides-tutorial-hashtags-filters.md).
- **Partner and organisation** report/edit surfaces roll up events — see [Partners](guides-tutorial-partners.md) and [Organisations](guides-tutorial-organisations.md).
- **Admin and SSO sessions** govern who bypasses prompts and who reaches dashboards — see [Authentication & SSO](guides-tutorial-authentication-sso.md).

## Screenshots
_Screenshots to be added._

## Related tutorials
- [Events](guides-tutorial-events.md)
- [Collecting event data (Clicker & Manual)](guides-tutorial-collecting-data.md)
- [Reports](guides-tutorial-reports.md)
- [Hashtags & filters](guides-tutorial-hashtags-filters.md)
- [Partners](guides-tutorial-partners.md)
- [Organisations](guides-tutorial-organisations.md)
- [Authentication & SSO](guides-tutorial-authentication-sso.md)
