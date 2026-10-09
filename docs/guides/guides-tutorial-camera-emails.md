# Tutorial: The e-mails to the users (camera app)
Status: Active
Last Updated: 2026-10-09T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ 2e6d10d (camera#463)

> Audience: The people who set up an event in the Camera app (editors, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner (a global admin can do everything here) · Related: [Approving photos at an event](guides-tutorial-approving-photos.md), [Layouts, messages and the dark area](guides-tutorial-camera-layouts-messages.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

The Camera app sends e-mails to the people who take part in an event. There are **five kinds**, and each can be switched on or off for every event:

| E-mail | When it is sent | On by default |
| --- | --- | --- |
| **Welcome** | When somebody registers: gives a name and an e-mail on the "Who are you" step, or signs in, before the photo. Once for each event and address. | No |
| **Arrived** | When somebody submits a photo (later: other media). "We got it." It has no button, because there is nothing to open yet. | No |
| **Approved** | When the photo is approved, with the link to it. At once for an event without photo approval, when the approver presses Approve for an event with it. | **Yes** |
| **Declined** | When the approver declines a photo (events with photo approval): a short note with a link to take another one. | **Yes** |
| **Follow up** | One week after the event, to look back at the memory. | No. **Not sent yet**: the text and the switch are saved, the daily job that sends it is added later. |

You decide the words, the look comes from the event (its colours, font and logo), and one **legal part** (the small print about terms and policies) is shared by all e-mails, so it is written once.

## Before you start

1. Sign in to the Camera app admin (`/admin`) with an e-mail address that has the **Manager** role for the event's partner.
2. Know which event you are setting up. Everything below is in the **event menu** (the left side while you are inside an event): **Emails**.
3. The partner and the whole system can have their own legal part: **the partner menu, Emails** (all events of the partner) and **Settings, Emails** (everything, global admins only).

## Step by step

### 1. Open the Emails page of the event

Open **Events**, choose the event, then **Emails** in the event menu. You see **Sender and terms**, one card for each of the five e-mails, and **Legal part** at the end.

### 2. Switch the e-mails on or off

Each card shows its state: **On · default**, **Off · default**, or **On/Off · chosen**. A switch you do not touch **follows the default**, so a change of the default reaches the events that never chose. Tick or untick **Send this e-mail** to choose. **Use the default (switch and texts)** takes your choice away.

Two e-mails are on by default, **approved** and **declined**: an event whose settings say nothing sends them. If the event uses photo approval, the approved e-mail is how the person gets the link to the photo, so do not switch it off unless you hand the links out some other way.

### 3. Write the subject and the message

Each card has a **Subject** and a **Message** with a toolbar:

- **B** bold, **I** italic;
- **Title**, **Large**, **Small**: make the paragraph under the cursor a title, large text or small print (press again to turn it back to a normal paragraph);
- **Link**: select some words, press Link and give the address (it must start with `https://`, or be `{link}`, `{terms}` or `{eventlink}`); the link is drawn bold and underlined;
- **Variable…**: puts the name of a thing in the text (see the table below).

What you type is the whole text: paragraphs are separated by a blank line. Under the hood the editor writes a few simple marks (`**bold**`, `*italic*`, `# title`, `-# small`, `[label](https://address)`), and **nothing else is ever treated as formatting**: raw HTML never reaches an e-mail. A text with no marks reads as plain text, exactly as before.

**Variables**

| Variable | What it stands for |
| --- | --- |
| `{name}` | the name of the person |
| `{event}` | the name of the event |
| `{partner}` | the partner (the club or organiser) |
| `{home}`, `{visitor}`, `{teams}` | the home team, the visitor team, both |
| `{date}` | the date of the event, written in the language of the event ("2026. október 16.") |
| `{location}` | the place of the event |
| `{eventlink}` | the link to the event: its **short link when the event has a URL slug**, the capture page otherwise |
| `{link}` | the link to the person's photo |
| `{terms}` | the link to the terms and policies |

If the event has no value for a variable (for example no teams), it is **left out of the e-mail** and the preview tells you; a word in braces that is not a variable is left out too. A person's name can never become formatting or a link.

### 4. See it before anybody else does

Beside each text is the **Preview**: the e-mail at the width of a phone, in the look of the event, drawn from the text as you type it, saved or not. It lists the variables it could not fill. **Send me a test e-mail** sends exactly this e-mail to **your own address only** (with `[Test]` in the subject) so you can read it on your phone.

### 5. The legal part

The **legal part** is small print under the message and the button of **every** e-mail. It has three levels and one text for each language:

1. **General** (Settings, Emails, global admins): the one everybody follows.
2. **Partner** (the partner menu, Emails): the legal part of all events of the partner. What the partner writes becomes the default of its events.
3. **Event** (this page, at the end): the event's own.

An event follows its partner and the partner follows the general one, until a level writes its own; a later change above never overrides what a level wrote itself. The page says what is used now. **Start from the standard line** inserts "Policies and General Terms and Conditions: {terms}" in the language; **Follow the level above** clears your own text. Bold and links work in the legal part; a paragraph is small print unless you make it a title or large text. When there is a legal part, the standard terms line at the end of the default message is left out so the terms are not written twice. If no level has a legal part, nothing is added.

### 6. Save

Press **Save the e-mails** at the top. What is the default is not stored.

## Managing it

- **Sender and terms:** the sender display name and the link behind `{terms}` are per event; empty means the default.
- **Links to the event use the short link.** If the event has a **URL slug** (in Edit and pages), `{eventlink}` and the "take another photo" link of the declined e-mail are its short link, not the long capture address.
- **Try-on events** also show two older e-mails (when the related photos are ready, and after an approved resubmitted result), kept as they were.
- **The footer picture** of the e-mails is still set with the other pictures (the event's Edit and pages, and the partner's Pictures).
- **Welcome** is sent to the address the person typed, which is not verified, so it only says welcome and gives the link to the event.

## Gotchas & good practice

- Unsaved changes are lost if you leave the page: save first. The page says "You have unsaved changes."
- A text that is the same as the default is not stored: you cannot tell the difference, and a later change of the default reaches you.
- Try the e-mail with **Send me a test e-mail** and open it **on the phone** before the event.
- The preview shows what the saved settings and the legal part give; the follow up has no preview of a send because it is not sent yet.

<a id="magyar-valtozat"></a>

## Magyar változat

### A felhasználóknak küldött e-mailek (camera alkalmazás)

Az eseményhez tartozó e-maileket az esemény menüjében az **Emails** (E-mailek) oldalon állítod be. Öt e-mail van, mindegyik külön kapcsolható:

- **Welcome (üdvözlés):** amikor valaki regisztrál (megadja a nevét és az e-mail-címét, vagy bejelentkezik), még a fotó előtt. Eseményenként és címenként egyszer megy ki. Alapból **ki van kapcsolva**.
- **Arrived (megérkezett):** amikor valaki beküld egy fotót. Gomb nélküli értesítés. Alapból **ki van kapcsolva**.
- **Approved (jóváhagyva):** amikor a fotót jóváhagyják, a hozzá vezető linkekkel. Alapból **be van kapcsolva**.
- **Declined (elutasítva):** amikor a fotót elutasítják; rövid üzenet egy linkkel egy új fotó készítéséhez. Alapból **be van kapcsolva**.
- **Follow up (utánkövetés):** egy héttel az esemény után, az emlék visszanézésére. Alapból **ki van kapcsolva**, és **még nem megy ki**: a szöveg és a kapcsoló mentődik, a napi feladat később kerül be.

**Hogyan állítsd be**

1. Nyisd meg az eseményt, majd az **Emails** menüt. Minden e-mailnél látod az állapotot (**On · default** = alapértelmezett, vagy **chosen** = általad választott). Amit nem érintesz, az az alapértelmezést követi.
2. A **Subject** (tárgy) és a **Message** (üzenet) mezőben eszköztár van: **B** félkövér, **I** dőlt, **Title / Large / Small** (cím, nagy, kicsi szöveg), **Link** (a cím `https://`-sel kezdődjön, vagy `{link}`, `{terms}`, `{eventlink}`), és a **Variable…** menü. A változók: `{name}` név, `{event}` esemény neve, `{partner}`, `{home}`, `{visitor}`, `{teams}` csapatok, `{date}` az esemény dátuma az esemény nyelvén, `{location}` helyszín, `{eventlink}` az esemény linkje (ha van URL-slug, a **rövid link**), `{link}` a fotó linkje, `{terms}` a szabályzat linkje. Ha egy változónak nincs értéke az eseményen, kimarad az e-mailből, és az előnézet jelzi.
3. Jobb oldalon az **előnézet** telefon szélességben, az esemény színeivel. A **Send me a test e-mail** gomb a saját címedre küldi el pontosan ezt az e-mailt (a tárgyban `[Test]`), hogy telefonon megnézhesd.
4. A **jogi rész** (Legal part) minden e-mail alján kis betűs szöveg. Három szintje van: **általános** (Settings, Emails), **partner** (a partner menü, Emails), **esemény**. Az esemény a partnerét követi, a partner az általánosat, amíg valaki sajátot nem ír. A **Start from the standard line** gomb a szokásos sort írja be, a **Follow the level above** a saját szöveget törli.
5. A **Save the e-mails** gombbal mentesz.

**Jó tudni**

- Ha az eseménynek van URL-slugja, az e-mailekben az esemény linkje a **rövid link**.
- Mentés előtt ne hagyd el az oldalt. A tesztet mindig nézd meg telefonon az esemény előtt.
