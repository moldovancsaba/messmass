# Tutorial: The acceptance on the "Who are you" page (camera app)
Status: Active
Last Updated: 2026-10-15T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app's marketing opt-in release (camera#679); acceptance settings originate in camera#558 and public gallery permission in camera#554

> Audience: The people who set up an event in the Camera app (editors, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner · Related: [The CTA page with a picture](guides-tutorial-camera-cta-page.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

By default a user meets two pages before the photo: **Before we start** (the consent page with the terms, cookies, privacy policy and the optional marketing opt-in) and **Who are you?** (sign in with Google or Facebook, or give a name and an e-mail address). The marketing opt-in is separate from legal acceptance and never blocks the journey.

With acceptance **on the Who-are-you page**, the legal items appear together as one small checkbox with one sentence, under the intro text and above the sign-in buttons. If marketing is shown, it appears beneath as its own optional checkbox: *I am open to marketing communications about the club and fan photos.* Leaving the marketing box empty never blocks sign-in or Continue. Only required legal acceptance can lock the page.

## Before you start

1. Open the event in the Camera app admin, then its page editor (**Edit and pages**).
2. The event needs a **Who are you?** page and a **consent** page, both **before** the photo and both **switched on**. If your event uses the **default** pages (marked *Default*), press **Customise** on the page you want to open: a default page has no editor until it is customised.

## Step by step

### 1. Switch it on

Choose **Acceptance on the Who-are-you page** in checkbox settings: **required** (the page waits for legal acceptance) or **optional**. Separately set **Marketing opt-in** to **shown** or **not shown**; it is always optional. For one event these settings are in **Consent page settings: the checkboxes of this event**; for all events of a partner they are in **Checkboxes of the events**. Press **Save all**.

### 2. Look at it on a phone

Open the event's capture link on a phone. The legal sentence and, when enabled, the separate marketing checkbox appear below the intro. Only a required legal choice disables sign-in and the fields. Try signing in with Google too: both choices stay as selected when you come back.

### 3. The wording

The combined sentence includes only shown legal items (terms, cookies and privacy policy). Marketing is never included in it: its own checkbox uses the `consent.marketing` text, editable in the global, partner and event **Texts** editors. It remains a separate optional checkbox on either page.

### 4. Switch it off

Choose **Not there: a consent page of its own** for the acceptance and press **Save all**: the two pages come back, one after the other, as before.

## Every checkbox: shown or not, required or optional

Each partner and event can configure which consent choices are shown. Legal checkboxes can be required or optional. Marketing has a show/hide setting only: it is always optional and cannot block the flow.

- **Where.** Partner: **Edit**, the section **Checkboxes of the events** (the default of all the partner's events). Event: the journey editor, **Consent page settings: the checkboxes of this event**; the first choice there is **Same as the partner (...)**, which follows the partner and says what it gives. A consent page of your own: each of its checkboxes has the toggles **Shown** and **Required**. Landing page: **Show the cookie checkbox** and **Cookie checkbox is required**.
- **The kinds.** The legal documents (**Terms and conditions**, **Cookies**, **Privacy policy**) can each be shown as required, shown as optional, or hidden. **Marketing opt-in** can be shown as optional or hidden; it is always optional and never prevents continuing. Its English wording is *I am open to marketing communications about the club and fan photos.* Its Hungarian wording is *Nyitott vagyok klub és szurkolói fotó marketing kommunikációra.* If legal acceptance is on Who-are-you, the marketing checkbox still appears separately below it. **Permission to show the photo in the public gallery** has its own independent setting.
- **Required legal consent.** The required legal checkbox still gates the consent and sign-in pages. If a photo reaches the server without required consent evidence, the upload is retained privately as pending consent and is deleted after 24 hours if consent is not recorded; it is not made public while pending.

### The public gallery permission

Some services and markets need the user's **own, separate permission** before a photo is shown on a **public wall or gallery**; for others the terms are enough. When an event asks, the user sees an optional checkbox where the photo is saved. **Only a ticked box makes the photo eligible for the wall.** If required consent is missing, the photo is uploaded privately as pending consent and deleted after 24 hours if no consent is recorded. The choice is recorded with the photo; its wording can be changed in the Dictionary.

## Managing it

- **What is recorded:** each legal document has its own consent record. Marketing has a separate record of its exact wording and whether the user opted in or left it empty. An empty marketing choice never blocks sign-in or the journey. Choices are kept with the photo through social sign-in.
- **If a page is missing or switched off**, or the consent page comes after the photo, nothing changes: the user still gets a consent page. The setting only works when both pages are active and before the photo.
- **Sign-in:** the acceptance given before a Google or Facebook sign-in is kept in the browser for up to 30 minutes and used when the user comes back, so the photo keeps its consents.

## Gotchas & good practice

- Legal acceptance and the marketing opt-in are separate choices. Ask whoever advises on privacy to review the wording and lawful basis for marketing before the event.
- The Hungarian sentence is the club's own wording: have the club read it.
- Always test on a phone with a real sign-in before the event, and keep the separate pages as the fallback (choose **Not there: a consent page of its own** for the acceptance).

## Magyar változat

### Mi ez, és miért jó?

Alapesetben a felhasználó a fotó előtt két oldalon megy át: **Mielőtt elkezdjük** (ÁSZF, sütik, adatvédelem és külön választható marketing-hozzájárulás) és **Ki vagy te?** (belépés Google-lal vagy Facebookkal, vagy név és e-mail-cím). A marketing-hozzájárulás különálló, választható; kihagyása soha nem akadályozza az útvonal folytatását.

Ha az elfogadás a **Ki vagy te? oldalon** van, a jogi elemek egy közös jelölőnégyzetben jelennek meg. Ha a marketing-hozzájárulás látható, alatta külön jelölőnégyzetként jelenik meg ezzel a szöveggel: *Nyitott vagyok klub és szurkolói fotó marketing kommunikációra.* A marketing pipa nélkül is folytatható a belépés és az útvonal; csak a kötelező jogi elfogadás zárolhatja az oldalt.

### Mit kell előtte tudni?

1. Nyisd meg az eseményt a Camera app adminjában, majd az oldalszerkesztőjét (**Edit and pages**).
2. Az eseménynek kell egy **Ki vagy te?** oldal és egy **hozzájárulás** oldal, mindkettő a fotó **előtt** és mindkettő **bekapcsolva**. Ha az esemény az **alapértelmezett** oldalakat használja (*Default* jelzés), nyomd meg a **Customise** gombot azon az oldalon, amelyiket meg akarod nyitni: az alapértelmezett oldalnak nincs szerkesztője, amíg nem szabod személyre.

### Lépésről lépésre

**1. Bekapcsolás.** Válaszd ki, hogy a jogi elfogadás a **Ki vagy te?** oldalon jelenjen-e meg, majd külön állítsd a **Marketing opt-in** értékét **Show optional** vagy **Not shown** állapotra. Egy eseménynél az útvonal-szerkesztő **Consent page settings: the checkboxes of this event** részében, partnerhez a partner szerkesztő **Checkboxes of the events** részében találod. Nyomd meg a **Save all** gombot.

**2. Nézd meg telefonon.** Nyisd meg az esemény fotózó linkjét telefonon. A jogi mondat és ha be van kapcsolva, a külön marketing-jelölőnégyzet a bevezető alatt jelenik meg. Csak a kötelező jogi választás kapcsolja ki a belépést és a mezőket. Próbáld ki a Google-os belépést: a választások megmaradnak, amikor visszatérsz.

**3. A szövegezés.** A közös mondat csak a látható jogi elemeket tartalmazza. A marketing-hozzájárulás külön jelölőnégyzet marad; a szövege a `consent.marketing` kulcs a **Texts** szerkesztőkben.

**4. Kikapcsolás.** Válaszd az elfogadásnál a **Not there: a consent page of its own** lehetőséget, és nyomd meg a **Save all** gombot: a két oldal visszatér, egymás után, a régi módon.

### Minden jelölőnégyzet: látszik-e, kötelező-e

Partnerenként és eseményenként állítható, hogy mely hozzájárulási lehetőségek jelenjenek meg. A jogi jelölőnégyzetek lehetnek kötelezők vagy választhatók. A marketing-hozzájárulás csak megjeleníthető vagy elrejthető; mindig választható, és nem akadályozza az útvonalat.

- **Hol.** Partner: **Edit**, a **Checkboxes of the events** rész (a partner összes eseményének alapértelmezése). Esemény: az útvonal-szerkesztő **Consent page settings: the checkboxes of this event** része; az első választás itt a **Same as the partner (...)**, amely a partnert követi, és megmondja, mit ad. Saját hozzájárulás oldalon minden jelölőnégyzetnek van **Shown** és **Required** kapcsolója. Landing oldal: **Show the cookie checkbox** és **Cookie checkbox is required**.
- **A fajták.** Az ÁSZF, a sütik és az adatvédelem lehet kötelezően látható, választhatóan látható vagy rejtett. A **Marketing opt-in** választhatóan jeleníthető meg vagy rejthető el; mindig választható, kihagyása sosem akadályozza a folytatást. Magyar szövege: *Nyitott vagyok klub és szurkolói fotó marketing kommunikációra.* Ha a jogi elfogadás a **Ki vagy te?** oldalon van, a marketing-hozzájárulás alatta külön jelölőnégyzetként jelenik meg.
- **Kötelező jogi hozzájárulás.** A kötelező jogi jelölőnégyzet a hozzájárulás és a belépés oldalán továbbra is feltétel. Ha egy fotó kötelező hozzájárulás nélkül mégis eljut a szerverhez, privát, függőben lévő fotóként mentődik; ha 24 órán belül nem rögzítünk hozzájárulást, töröljük. Addig nem válik nyilvánossá.

#### A nyilvános galéria engedélye

Egyes szolgáltatásoknál és piacokon a felhasználó **külön hozzájárulása** is kell a fotó **nyilvános falon vagy galériában** való megjelenítéséhez. Ha egy esemény kéri, a felhasználó választható jelölőnégyzetet lát a fotó mentésekor. **Csak a bepipált négyzet teszi a fotót alkalmassá a falra kerülésre.** Ha hiányzik egy kötelező hozzájárulás, a fotó privát, függőben lévő fotóként mentődik; ha 24 órán belül nem rögzítünk hozzájárulást, töröljük. A választást a fotóval rögzítjük; a szöveg a Szótárban módosítható.

### Kezelés

- **Mit rögzít:** minden jogi dokumentumnak külön bejegyzése van. A marketing-hozzájárulás saját bejegyzésben őrzi a pontos szöveget és azt, hogy a felhasználó hozzájárult-e vagy üresen hagyta-e. Az üres marketing-választás sosem akadályozza a belépést vagy az útvonalat; a választás a közösségi belépés során is megmarad.
- **Ha egy oldal hiányzik vagy ki van kapcsolva**, vagy a hozzájárulás oldal a fotó után van, semmi sem változik: a felhasználó továbbra is kap hozzájárulás oldalt. A beállítás csak akkor működik, ha mindkét oldal aktív és a fotó előtt van.
- **Belépés:** a Google- vagy Facebook-belépés előtt megadott elfogadást a böngésző legfeljebb 30 percig megőrzi, és a visszatéréskor felhasználja, így a fotó megtartja a hozzájárulásait.

### Jó tudni

- A jogi elfogadás és a marketing-hozzájárulás külön választás. Kérd meg az adatvédelmi tanácsadót, hogy ellenőrizze a szöveget és a marketing-hozzájárulás jogalapját az esemény előtt.
- A magyar mondat a klub saját megfogalmazása: olvastasd el a klubbal.
- Az esemény előtt mindig próbáld ki telefonon, valódi belépéssel, és tartsd készenlétben a külön oldalakat (válaszd az elfogadásnál a **Not there: a consent page of its own** lehetőséget).
