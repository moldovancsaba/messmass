# Tutorial: The giant screen (camera app slideshow)
Status: Active
Last Updated: 2026-10-09T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ 2bc1aee (camera#476, camera#487), the Crossfade checkbox with camera#497; the controls, the theme and broken pictures with camera#510 and the check of pictures with the hidden-pictures change (camera rule of 2026-10-09)

> Audience: The people who set up an event in the Camera app and the person who runs the screen at the venue · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner (a global admin can do everything here) · Related: [Layouts, messages and the dark area](guides-tutorial-camera-layouts-messages.md), [Approving photos at an event](guides-tutorial-approving-photos.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

The **giant screen** is a web page that shows the photos of the event as they arrive, on the stadium's LED wall or any other screen. It is the page `/slideshow/<id>` of the Camera app. It keeps a queue of the next pictures ready, shows each one for a few seconds, and asks the server for new ones all the time, so the loop never stops.

Every new event gets a **default slideshow** with a ready-made design, so nobody starts with an empty screen: the photos play in a window on the left, a **QR code** (its scans are counted on their own tracked link) sits alone in the panel on the right, and under the photos one big line says **where to go**: the written address, which is the event's own short address when it has one (for example `go.messmass.com/mtk-vasas`) and otherwise the address of the screen's tracked link. The line is as wide as the photo window and the text is scaled to fill that width, always on one line. The QR code still points at the tracked link, so its scans keep their own count. A slideshow made before this layout keeps the layout it was made with: only a new event, or a default slideshow made again, gets it. When you type your own text in the slideshow editor (Screen design, Texts), it is placed under the photo window, as wide as the window, with **Fill the box** ticked: the line scales to the box width, and the size you give is the largest it may take. Untick it for a fixed size.

## Before you start

1. Open the event, then **Slideshows**. The default slideshow is marked **Default**; you can edit it or make another one the default.
2. For the venue: a computer with the browser open on the slideshow's address (**Open slideshow**, or **Copy public URL**), a wired network if there is any, and the display set not to sleep.

## Step by step

### 1. Open the screen and go full screen

Open the address on the screen's computer. The controls are a **transparent bar at the bottom of the picture**, like a media player's: **pause / play** on the left, **full screen** on the right. It shows when the page opens and whenever you move the pointer or touch the screen, and **fades after three seconds**, so it never stays on the wall (the pointer disappears too in full screen). You can also **double-click the picture** (like a video) or press **F**; the space bar pauses, the arrows go to the next or the previous picture. Press the same again, or Esc, to leave. **iPhone Safari has no full screen for a page**, so there the full-screen button only shows how: **Share, then Add to Home Screen**, and open the screen from the icon: it then opens with no browser bars, in the event's colours. Everything behind the pictures, the page and the browser's bars, is **the event's theme**, never white; a screen with no colours of its own is in the event's colours.

### 2. Set how it plays

In **Edit slideshow**: how long each picture stays (hold), the **fade** (milliseconds), the **buffer** (how many pictures are kept ready; a new photo appears about that many pictures later, so a smaller buffer shows new photos sooner), the **order** (*fixed* shows the least shown photos first and is the fair one; *random* mixes them) and the **source** of the pictures.

**Crossfade** is an option below the fade. **Off** (the default): a picture is replaced by the next one. **On**: the next picture fades in over the one before, which stays until the new one is fully shown. It is new, so **try it on a test slideshow first** and look at it on the screen before you tick it on the real one.

### 3. Let it run, and look at what it does

The page looks after itself:

- if the picture has not changed for a while it **goes to the next one**, and if it is still stuck a minute later it **reloads** (at most three times in ten minutes);
- it **reloads itself every 3 hours**, between two pictures, so a long evening never builds up a stuck state;
- it asks the display to **stay awake**;
- a request that does not answer is given up after a few seconds and tried again, and a picture that will not load is skipped for a few minutes.

To **reload the screen yourself** (for example before the match): on the slideshow's card press **Reload the screen**. Every open copy of that screen reloads at its next picture, a few seconds later.

To **look inside** before the event, open the screen's address with `?debug=1` at the end: a small panel in the corner shows the last events (slides shown, requests, a heartbeat every 10 seconds). Without it nothing is shown.

## Managing it

- **The venue's computer:** full screen, **nothing laid over the window** (a covered window counts as hidden and its timers slow down or stop), no screen saver, no pop-up notifications, no scheduled browser updates during the event. A weak or shared internet link is the usual cause of a slow screen: a wired connection helps most.
- **New photos** reach the screen when the queue next asks for a picture, about every picture; hidden, rejected and not yet approved photos never show.
- **A picture that is gone is never shown.** If a picture's host no longer has a photo (ImgBB deleted it, say), the screen skips it and the photo is hidden everywhere: on every screen, in the galleries, on the share page. A global admin can check all pictures with the card **Broken pictures** on the Slideshows page (**Check the pictures**); nothing is deleted, and a picture that answers again comes back at the next check. A gallery says how many photos it hides.
- **Screen-sized pictures:** the screen is sent a lighter version of each photo (at most 1920 px, WebP), made when a photo is approved. For photos that already existed, a global admin opens **Slideshows** in the Camera app: the card **Screen-sized pictures** says how many photos on slideshow events still use the full-size picture, and **Make the screen pictures** makes them (24 at a time, with the progress shown; you can stop and press again). It only adds a picture next to each photo; no original is changed or deleted.
- **The picture on a new event:** the QR code points to a tracked link, so the first real scan after launch is the proof that it reaches the report.

## Gotchas & good practice

- A **Reload the screen** press restarts the show for a moment (the screen shows its loading picture); do not press it while a goal is celebrated.
- **Crossfade** is a per-slideshow switch: switching it on for the real screen is your decision after you have seen it.
- If a screen freezes anyway, note the time: the Camera app keeps a short log of what the screen did (the developers read it), and the time tells them where to look.
- The default design cannot be deleted: make another slideshow the default first.

<a id="magyar-valtozat"></a>

## Magyar változat

### Az óriáskijelző (a camera alkalmazás vetítése)

Az **óriáskijelző** egy weboldal (`/slideshow/<id>`), amely az esemény fotóit mutatja, ahogy megérkeznek: a stadion LED-falán vagy bármilyen kijelzőn. Mindig készen tart egy sor következő képet, mindegyiket néhány másodpercig mutatja, és folyamatosan kér újakat a szervertől, így a körforgás sosem áll meg.

Minden új eseményhez automatikusan készül egy **alapértelmezett vetítés**: a fotók a bal oldali ablakban játszanak, a jobb oldali panelben egyedül áll a **QR-kód** (a beolvasásokat külön követett link számolja), a fotók alatt pedig egy nagy sor mondja meg, **hova menj**: a leírt cím, ami az esemény saját rövid címe, ha van neki (például `go.messmass.com/mtk-vasas`), különben a képernyő követett linkjének címe. A sor olyan széles, mint a fotóablak, és a szöveg úgy méreteződik, hogy kitöltse ezt a szélességet, mindig egy sorban. A QR-kód továbbra is a követett linkre mutat, így a beolvasásait külön számoljuk. A korábban készült vetítés megtartja a régi elrendezést: csak új esemény, vagy újra elkészített alapértelmezett vetítés kapja ezt. Ha a vetítésszerkesztőben (Screen design, Texts) saját szöveget írsz, az a fotóablak alá kerül, olyan szélesen, mint az ablak, a **Fill the box** (kitölti a dobozt) pipával: a sor a doboz szélességére méreteződik, a megadott méret pedig a legnagyobb, amit felvehet. Fix méretű szöveghez vedd ki a pipát.

**Lépések**

1. **Megnyitás és teljes képernyő.** Nyisd meg az eseményt, majd a **Slideshows** oldalt, és az **Open slideshow** gombbal a vetítés címét. A vezérlők a kép alján egy **átlátszó sávban** vannak, mint egy médialejátszón: balra a **szünet / lejátszás**, jobbra a **teljes képernyő**. Az oldal megnyitásakor és minden egérmozdulatnál vagy érintésnél megjelenik, és **három másodperc után elhalványul**, így nem marad rajta a falon (teljes képernyőn az egérmutató is eltűnik). A képre **duplán kattintva** (mint egy videón) vagy az **F** billentyűvel is teljes képernyőre váltasz; a szóköz szünetel, a nyilak a következő vagy az előző képre lépnek. Ugyanígy, vagy Esc-cel lépsz ki. **iPhone Safarin nincs oldal-teljes képernyő**, ott a gomb csak megmutatja a megoldást: **Megosztás, Főképernyőre**, és az ikonról nyisd meg a kijelzőt: böngészősáv nélkül, az esemény színeiben nyílik meg. Minden, ami a képek mögött van, az oldal és a böngésző sávjai is, **az esemény témája**, soha nem fehér; a saját színek nélküli kijelző az esemény színeiben van.
2. **Lejátszás beállítása.** Az **Edit slideshow** oldalon: mennyi ideig marad egy kép, az áttűnés ideje (ezredmásodperc), a **buffer** (hány képet tart készenlétben; az új fotó körülbelül ennyi képpel később jelenik meg, tehát kisebb buffer hamarabb mutatja), a **sorrend** (*fixed*: a legkevesebbszer mutatottak előre, ez a méltányos; *random*: kevert) és a képek forrása. A **Crossfade** a következő kép áttűnése az előző fölött: **ki van kapcsolva** alapból, és új funkció, ezért **előbb egy próbavetítésen** nézd meg, és csak utána kapcsold be az éles kijelzőn.
3. **Ez vigyáz magára.** Ha a kép egy ideig nem vált, **továbblép a következőre**, és ha egy perc után is áll, **újratölt** (tíz percen belül legfeljebb háromszor); **3 óránként magától újratölt**, két kép között; kéri, hogy a kijelző **ne aludjon el**; a nem válaszoló kérést néhány másodperc után feladja és újrapróbálja, a be nem töltődő képet néhány percre kihagyja. **Kézi újratöltés** (például a meccs előtt): a vetítés kártyáján a **Reload the screen** gomb; minden nyitott példány a következő képnél, néhány másodpercen belül újratölt. Az **`?debug=1`** a cím végén egy kis panelt mutat a sarokban az utolsó eseményekkel; nélküle semmi nem látszik.

**Jó tudni**

- **Egy eltűnt kép soha nem látszik.** Ha egy kép tárolója már nem őrzi a fotót (például az ImgBB törölte), a kijelző átugorja, és a fotó mindenhol rejtve lesz: minden kijelzőn, a galériákban, a megosztó oldalon. A globális admin a Slideshows oldal **Broken pictures** kártyáján (**Check the pictures**) minden képet ellenőriztethet; semmi sem törlődik, és ha egy kép újra válaszol, a következő ellenőrzésnél visszajön. A galéria megmondja, hány fotót rejt.
- **Képernyőméretű képek:** a kijelző a fotók könnyebb változatát kapja (legfeljebb 1920 px, WebP), amely a fotó jóváhagyásakor készül. A már meglévő fotóknál egy globális admin a camera alkalmazás **Slideshows** oldalán a **Screen-sized pictures** kártyán látja, hány fotó használ még teljes méretű képet, és a **Make the screen pictures** gombbal elkészíttetheti (egyszerre 24, látható haladással, megállítható és újra indítható). Csak egy képet ad a fotó mellé, eredetit nem módosít és nem töröl.
- A helyszíni gép: teljes képernyő, **semmi ne takarja az ablakot** (a letakart ablakot a böngésző rejtettnek veszi, és lassítja), nincs képernyővédő, nincs felugró értesítés, nincs időzített böngészőfrissítés a rendezvény alatt; a lassú kijelző leggyakoribb oka a gyenge vagy megosztott internet, a vezetékes kapcsolat segít a legtöbbet.
- A **Reload the screen** egy pillanatra újraindítja a vetítést (betöltő kép látszik): ne nyomd meg gól ünneplése közben.
- Ha a kijelző mégis megáll, jegyezd fel az időpontot: a camera alkalmazás rövid naplót vezet arról, mit csinált a kijelző, az időpont megmondja a fejlesztőknek, hol keressék.
