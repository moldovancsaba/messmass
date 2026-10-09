# Tutorial: Layouts, messages and the dark area at an event (camera app)
Status: Active
Last Updated: 2026-10-09T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ 2e6d10d (camera#444)

> Audience: The people who set up an event in the Camera app (editors, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner · Related: [E-mails to the users](guides-tutorial-camera-emails.md), [Approving photos at an event](guides-tutorial-approving-photos.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

The picture a person ends up with is **their selfie**, a **layout** (the design around it: team logo, event title, graphics) and a **supporter message**. At an event you can have one layout and one message, or several of each, and you decide **how the person gets them**:

- **A:** only the **generated** layout exists (the Camera app draws it from the event's data: logo, teams, bar, message). Everybody gets it.
- **B:** you made **one** layout (a designer's frame). It is the default.
- **C:** you made **more than one** (for example a blue and a pink design). You choose how people get them.

For both the layout and the message there are three ways: **you choose** (one fixed pick), **random** (a new draw at every photo, never the same twice in a row), or **the user chooses**. When the user chooses both, the order is **design first, message second**, and then the photo.

Each design covers the picture differently, so each has its own **dark area**: the part the person must keep their face away from while they move and zoom the selfie. It is shown at 50 % black.

## Before you start

1. Sign in to the Camera app admin and open the event, then **Frames** in the event menu.
2. Have the designs ready as frames (see the Libraries): a **complete frame** is one finished picture the person can pick; a **text-free frame with a message area** carries the messages (you mark the area where the text goes, and the header and footer boxes that are the dark area).
3. Write the messages in the **Generated default frame** panel (up to 10; they can use `{partner1}` and `{partner2}` for the two teams).

## Step by step

### 1. Say which message goes on which design

In the Generated default frame panel, the table **Which message goes on which design** has a row for each message and a column for each design that carries messages. **Tick** the designs a message can be written on: one, several or all, so it can be fully mixed. A message with no tick is written on the generated layout. Every tick is one picture, drawn when you press **Save messages** (a few seconds; at most 40 pictures per event, the page shows the count).

### 2. Choose how people get the layout and the message

The panel **How users get the layout and the message** shows **The layouts** with a picture of each and the situation (A, B or C). Under it, for the layout and for the message, pick **You choose** (and which), **Random**, or **The user chooses**, then **Save**. **Back to as before** takes the setting away. The choices show only when there is something to choose between: more than one layout, more than one message.

Until you save, the event does what it always did: a person with several complete frames picks one, otherwise a random message is drawn at every shutter press.

### 3. Choose the dark area of the designs

Under the table, **Dark area of the designs**: **the design's own** (the header and footer boxes its designer drew, the default) or **the mask of the generated frame** (the logo, the teams, the bar and the message box of the generated default frame, whatever the design). Changing it draws nothing again: only the dark boxes change.

A **complete frame** you uploaded shows as its **50 % black silhouette** (its whole non-transparent graphic) in the live view and while the person moves and zooms, on every event. The real frame shows in the final picture.

## What the person sees

With **the user chooses** for both: a step **Choose your design** (each design with its first message), then **Choose your message** (only the messages that design carries), then the camera. **Change design** and **Change message** are on the camera step. If the person changes the design, the **message stays if the new design offers it**, otherwise they choose again. With **random**, a new design and message are drawn when the camera step opens and again after a retake. The dark area on screen is the one of the design that photo gets.

## Managing it

- A message on **no** design is written on the generated layout. If you remove or switch off a design, the messages on it fall back to the generated layout until you tick another.
- Pictures are reused while nothing they depend on changed, so adding a design to a message draws only the new picture.
- Partner-level layouts and message lists (a design every event of a partner can use by default) are planned for after the first match.

## Gotchas & good practice

- **Save the setting.** An unsaved panel changes nothing for the people at the event.
- **Check on the phone**, in portrait and landscape, before the event. The dark area is easy to judge there.
- **Keep the message list short** when several designs are ticked: every message on every design is a picture to draw.
- Do not change the setting during a live event unless you must: people in the middle of the flow keep what they chose.

<a id="magyar-valtozat"></a>

## Magyar változat

### Elrendezések, üzenetek és a sötét terület egy eseményen (camera alkalmazás)

A kész kép három részből áll: a **szelfi**, egy **elrendezés** (a körülötte lévő grafika: csapatlogó, esemény címe) és egy **szurkolói üzenet**. Az esemény **Frames** oldalán állítod be, hogyan kapják meg ezeket a felhasználók.

**Helyzetek.** **A:** csak a generált elrendezés van, mindenki azt kapja. **B:** egy általad készített elrendezés van, az az alapértelmezett. **C:** több elrendezés van (például kék és rózsaszín), és te döntöd el, hogyan kapják.

**Három mód** külön az elrendezésre és külön az üzenetre: **te választod** (egy rögzített), **véletlenszerű** (minden fotónál új sorsolás, soha nem kétszer ugyanaz egymás után), vagy **a felhasználó választ**. Ha mindkettőt a felhasználó választja, a sorrend: **először a dizájn, aztán az üzenet**, utána jön a fotó.

**Lépések**

1. **Melyik üzenet melyik dizájnon.** A *Generated default frame* panel *Which message goes on which design* táblázatában pipáld be, melyik üzenet melyik dizájnra kerülhet (egyre, többre vagy mindre). Pipa nélkül az üzenet a generált elrendezésre kerül. Minden pipa egy kép, a **Save messages** gombbal készül el (legfeljebb 40 kép eseményenként).
2. **Hogyan kapják.** A *How users get the layout and the message* panelen az elrendezéshez és az üzenethez is válaszd ki: **You choose**, **Random**, **The user chooses**, majd **Save**. A **Back to as before** visszaállítja a korábbi működést. Amíg nem mentesz, az esemény a régi módon működik.
3. **Sötét terület.** A táblázat alatt: *Dark area of the designs*: **a dizájn saját** fejléc- és lábléc-dobozai (alapértelmezett), vagy **a generált keret maszkja** (logó, csapatok, sáv, üzenetdoboz). A váltás nem rajzol újra semmit. A feltöltött **teljes keret** minden eseményen **50%-os fekete sziluettként** látszik a mozgatásnál és nagyításnál.

**Mit lát a felhasználó.** Ha mindkettőt ő választja: *Choose your design*, majd *Choose your message* (csak az adott dizájn üzenetei), majd a kamera. A kamera lépésen ott a **Change design** és a **Change message** gomb. Dizájnváltáskor az **üzenet megmarad, ha az új dizájn is kínálja**, különben újra választ. Véletlenszerű módban a kamera lépés megnyitásakor sorsol a rendszer, és újrafotózáskor is.

**Jó tudni:** mentsd el a beállítást, mert a mentetlen semmit sem változtat. Telefonon, álló és fekvő helyzetben is próbáld ki az esemény előtt.
