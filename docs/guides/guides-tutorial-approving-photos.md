# Tutorial: Approving photos at an event (camera app)
Status: Active
Last Updated: 2026-10-10T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ 75c595b (camera#373); marking the people with camera#542

> Audience: The person who approves photos live at an event, and the operators who give them access · Prerequisites: The event exists in the Camera app with photo approval switched on, and your e-mail address has the **Manager** role for Events on the event's partner · Related: [Camera app integration](guides-tutorial-camera-app.md) · [Events](guides-tutorial-events.md) · [Partners](guides-tutorial-partners.md) · [Authentication, roles & SSO](guides-tutorial-authentication-sso.md) · Magyar változat: [lent / below](#magyar-valtozat)

## What it is & why it matters

At events where **photo approval** is switched on, a photo taken in the Camera app is not shown to anyone until a person approves it. The person who took it sees "Thank you! Your photo is waiting for approval" and gets an e-mail with the link to the finished photo (the photo in its frame) as soon as it is approved. So at a live event, the speed of the approver decides how long people wait.

This guide is for the **approver**: the member of the event's staff who decides, photo by photo, what goes out. It also tells the operator who sets the access up what to check. Approval happens in the Camera app's admin, not in messmass, on the event's **Vetting** tab.

A **Manager** (or a global admin) can approve and reject. A **Viewer** can open the event but cannot decide.

## Before the event

Do this once, at least a day before.

1. **Give the approver access (operator).** In the Camera app's admin open the partner of the event, find the **Partner users** panel, and add the approver's e-mail address with the app **Events** and the role **Manager**.
2. **Sign in (approver).** Open the Camera app admin (`/admin` on the Camera app's address) and sign in with that e-mail address, through the same single sign-on the other seyu tools use.
3. **Find the tab.** Open **Events**, choose the event, then the **Vetting** tab. (The tabs of an event are Overview, Vetting, Queue and Analytics.)

You should see three lists, each with a count: **Waiting**, **Rejected**, **Approved**.

If you cannot find the event, or the Vetting tab sends you back to the event overview, the account does not have the Manager role for that partner yet: ask the operator.

> Note: Rehearse once on a throw-away event under the same partner (not linked to messmass), with a test photo and an e-mail address you can read. Delete the test event afterwards. Do not rehearse on a live event: an approved test photo is a real photo.

## At the event

Keep the Vetting tab open on **Waiting**. The oldest photo comes first. The list looks for new photos by itself every 10 seconds, only while the page is on screen, and it pauses while you are deciding or writing a reason. If it ever looks stuck, reload the page.

Each photo is a card with the picture, the name of the person, when it was taken (**Taken**), which frame it will get (**Generated frame**, **Own frame** or **No frame**), and **Wall** (whether the person agreed to be shown). A checkbox on the picture selects it.

| You want to | Do this | What happens |
| --- | --- | --- |
| Approve one photo | Press **Approve** on the card | The card leaves the list. The person gets an e-mail with the link to their finished photo. |
| Reject one photo | Press **Reject**, write a reason if you want to, then **Confirm reject** (or **Cancel**) | The person gets a short note by e-mail and can take another photo. The photo stays private. The reason is kept for your records and is not sent. |
| Approve many | Tick the cards, or press **Select all**, then **Approve selected** | The button shows how far it is ("Approving 3 of 20…"). It works through the photos two at a time, so leave the page open until it says **Approve selected** again. |
| Change a decision | Open **Rejected** and press **Approve** | A rejected photo can still be approved. An approved photo cannot be taken back on this page, so look before you press **Approve**. |

Approve by default and reject only what you would not want next to the organiser's name. The organiser sets the rules, so agree them before the event.

**What the person sees while they wait:** "Thank you! Your photo is waiting for approval. We will email you the link as soon as it is approved." (in the language of the event).

## Marking the people in a photo (when the event uses it)

An event can ask the reviewer to **mark the people in each photo before deciding**. It is switched on by a global admin on the Vetting tab (**Marking the people is on**); **until it is on, nothing in this guide changes**. The marks are saved with the photo and used for the analytics: how many people, how old, how they feel, what they wear.

Press **Review one by one** on the Vetting tab. The oldest waiting photo opens **big**, one at a time:

1. Press **Clicker**, then **draw a rectangle around one person**: press, drag and let go (a mouse or a finger). A tap is not a rectangle. **Retry** draws it again.
2. Press **Next**. Sixteen buttons appear: the top two rows say **who it is** (first row women and girls, second row men and boys: kid, young, adult, old), the third row the **emotion** (sad, unamused, happy, angry), the last row any **merchandise** (cap, other merchandise, jersey or shirt, flag). Choose **who** (needed), then the emotion and the merchandise if you can (optional; more than one merchandise is fine).
3. Press **Done**. The person is marked with a coloured rectangle (yellow, blue, ...). Press **Clicker** again for the next person, **Remove** takes the last one off, **Cancel** throws away the one you are marking.
4. When you have marked what you can (nobody is also fine), press **Next**. The people are saved, and you decide: **Approve**, or **Reject** (with a reason if you want). The next photo opens at once. **Skip this photo** leaves it for later.

On a phone held upright the sixteen buttons are under the photo; on a computer they are over it. If you are not sure about someone, leave the emotion empty and choose the closest **who**.

## Managing it

- **Nobody can approve for a while.** Nothing is lost. The photos wait, and people keep seeing the waiting message. Only a global admin can switch approval off for the event (the setting on the Vetting tab).
- **Counts.** The three tabs show how many photos are waiting, rejected and approved. **Approved** lists are view-only.
- **Who can do what.** Approving and rejecting needs the Manager role for the event's partner (or a global admin). The setting that switches approval on or off for an event is for global admins only.

## Gotchas & good practice

- **A red message says the photo was not approved.** The card stays in the list. Press **Approve** again; if it fails again, tell the operator what the message says.
- **The message says an e-mail could not be sent.** The photo is approved, but the person did not get the e-mail. Tell the operator the time and the name on the card.
- **The message says "No answer arrived from the server".** The decision may have gone through anyway. The list shows what the server holds now: check **Approved** before you try again.
- **The page asks you to sign in again.** Sign in with the same e-mail address and open the Vetting tab again.
- **Rehearse and keep a second approver.** One person with a phone battery is a single point of failure.

<a id="magyar-valtozat"></a>

## Magyar változat

### Fotók jóváhagyása egy eseményen (camera alkalmazás)

Annak szól, aki egy eseményen élőben jóváhagyja a fotókat. Telefon vagy laptop kell hozzá, internettel. Nem kell semmit telepíteni.

**Az esemény előtt (egyszer, legalább egy nappal korábban)**

1. Az operátor az esemény partnerének oldalán, a **Partner users** panelen felveszi az e-mail-címedet az **Events** alkalmazáshoz **Manager** (menedzser) szereppel.
2. Nyisd meg a camera alkalmazás admin felületét (`/admin`), és jelentkezz be ezzel az e-mail-címmel.
3. Nyisd meg az **Events** menüt, válaszd ki az eseményt, majd a **Vetting** fület.

Három listát kell látnod, mindegyik mellett egy számmal (az oldal feliratai angolok): **Waiting** (várakozik), **Rejected** (elutasított), **Approved** (jóváhagyott). Ha nem találod az eseményt, vagy a Vetting fül visszadob az esemény áttekintőjére, akkor a fiókodnak még nincs Manager szerepe: szólj az operátornak.

**Az eseményen**

A Vetting fület tartsd nyitva a **Waiting** listán. A legrégebbi fotó van elöl, és a lista 10 másodpercenként magától megnézi, jött-e új fotó. Ha valaha elakadni látszik, töltsd újra az oldalt.

- **Approve (jóváhagyás):** a fotó eltűnik a listából, és a fotós e-mailben megkapja a linket a kész fotójához.
- **Reject (elutasítás):** ha szeretnél, írj indoklást (csak a saját nyilvántartásodnak szól, nem megy ki a fotósnak), majd nyomd meg a **Confirm reject** gombot. A fotós rövid értesítést kap e-mailben, a fotó pedig privát marad. Készíthet másikat.
- **Egyszerre sok fotó:** pipáld be a fotókat, vagy nyomd meg a **Select all** gombot, majd az **Approve selected** gombot. A gomb mutatja, hol tart. Egyszerre két fotót dolgoz fel, ezért hagyd nyitva az oldalt, amíg újra az Approve selected felirat nem áll rajta.
- **Meggondoltad magad:** a **Rejected** listán lévő fotót még jóváhagyhatod. A jóváhagyott fotót ezen az oldalon nem lehet visszavonni, ezért nézd meg, mielőtt az Approve gombra nyomsz.

Alapból hagyd jóvá, és csak azt utasítsd el, amit nem szeretnél a szervező neve mellett látni. A szabályokat a szervező határozza meg, ezért az esemény előtt egyeztesd vele.

### Az emberek megjelölése egy fotón (ha az esemény használja)

Egy esemény kérheti, hogy a jóváhagyó **döntés előtt jelölje meg az embereket minden fotón**. Ezt egy globális admin kapcsolja be a Vetting fülön (**Marking the people is on**); **amíg nincs bekapcsolva, az útmutató többi része semmit sem változik**. A jelölések a fotóval együtt mentődnek, és az elemzésekhez kellenek: hány ember van rajta, milyen idős, milyen kedvű, mi van rajta.

Nyomd meg a Vetting fülön a **Review one by one** gombot. A legrégebbi várakozó fotó **nagyban** nyílik meg, egyesével:

1. Nyomd meg a **Clicker** gombot, majd **rajzolj egy téglalapot egy személy köré**: nyomd le, húzd, engedd el (egérrel vagy ujjal). Egy koppintás nem téglalap. A **Retry** újrarajzoltat.
2. Nyomd meg a **Next** gombot. Tizenhat gomb jelenik meg: a felső két sor azt mondja meg, **ki az**: az első sor a nők és lányok, a második a férfiak és fiúk (kicsi, fiatal, felnőtt, idős); a harmadik sor az **érzelem** (szomorú, rosszkedvű, vidám, dühös); az utolsó sor az esetleges **kellékek** (sapka, egyéb kellék, mez vagy póló, zászló). Válaszd ki, **ki az** (kötelező), majd ha tudod, az érzelmet és a kellékeket (nem kötelező; több kellék is lehet).
3. Nyomd meg a **Done** gombot. A személy színes téglalapot kap (sárga, kék, ...). A **Clicker** gombbal jön a következő személy, a **Remove** az utolsót leveszi, a **Cancel** eldobja azt, amelyiket éppen jelölsz.
4. Ha megjelöltél mindent, amit tudsz (az is rendben van, ha senki), nyomd meg a **Next** gombot. Az emberek mentődnek, és döntesz: **Approve**, vagy **Reject** (ha szeretnél, indoklással). Rögtön megnyílik a következő fotó. A **Skip this photo** későbbre hagyja.

Telefonon, álló helyzetben a tizenhat gomb a fotó alatt van, számítógépen a fotó fölött. Ha nem vagy biztos valakiben, hagyd üresen az érzelmet, és válaszd a legközelebbi **ki az** gombot.

**Ha valami elromlik**

- **Piros üzenet jelzi, hogy a fotó nincs jóváhagyva.** A kártya a listán marad. Nyomd meg újra az Approve gombot. Ha megint nem sikerül, mondd el az operátornak, mit ír az üzenet.
- **Az üzenet szerint egy e-mailt nem sikerült elküldeni.** A fotó jóvá van hagyva, de a fotós nem kapta meg az e-mailt. Mondd meg az operátornak az időpontot és a kártyán lévő nevet.
- **Az üzenet szerint nem érkezett válasz a szervertől (No answer arrived).** A döntés lehet, hogy mégis megtörtént. Nézd meg az Approved listát, mielőtt újra próbálkozol.
- **Egy ideig senki sem tud jóváhagyni.** Semmi sem vész el. A fotók várnak, és a fotósok továbbra is a várakozó üzenetet látják. A jóváhagyást az eseményre csak egy globális admin tudja kikapcsolni.
- **Az oldal újra bejelentkezést kér.** Jelentkezz be ugyanazzal az e-mail-címmel, és nyisd meg újra a Vetting fület.
