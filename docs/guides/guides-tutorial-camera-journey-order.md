# Tutorial: Choose, edit and order Camera journeys (camera app)
Status: Active
Last Updated: 2026-11-06T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera journey implementation in issue camera#797 and PR #798 (local release checks passed; GitHub Verify is running)

> Audience: The people who set up an event in the Camera app (editors, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner · Related: [The acceptance on the "Who are you" page](guides-tutorial-camera-journey-acceptance.md), [The CTA page with a picture](guides-tutorial-camera-cta-page.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

### Choose the journey that guests will see

Camera can keep multiple named journeys at each level. Each level has one selected default:

- **Global User Journey (GUJ)** is the fallback for partners that follow the global default.
- **Partner User Journey (PUJ)** is the fallback for that partner's events that follow the partner default.
- **Event User Journey (EUJ)** is the flow selected for one event.

An event serves **one complete journey**: its selected EUJ, otherwise its partner's selected PUJ, otherwise the selected GUJ. These journeys do not stack or merge page-by-page. A partner can choose a different PUJ without changing the GUJ; an event can choose a different EUJ without changing the partner's choice. Parent changes flow only to children still following that parent choice.

Open **Global User Journey**, **Partner User Journey**, or **Event User Journey** from the matching scope's Content navigation. Each page is a list of the journeys owned at that level: you can create, rename, select, and open any one of them in the same full page editor. Creating a regular version does not make it live; select it and save the choice to make it that level's default.

The selected GUJ is the default for partners that follow Global. Each partner may select one PUJ as its default, or follow the GUJ. Each event may select one EUJ, or follow its partner's PUJ (and the GUJ if the partner follows Global). The event serves exactly one complete journey.

A journey can only be edited at the level that owns it. A Partner cannot edit the GUJ in place, and an Event cannot edit its inherited PUJ or GUJ in place. Choose **Customize inherited journey** to create and select a copy owned by that Partner or Event; Camera then opens that copy in the same editor. The parent journey remains unchanged. Later parent edits flow only to children still following it. Editing an owned, selected journey updates its inheriting descendants; editing an unselected journey does not change the guest flow until it is selected.

Existing events with their own legacy pages keep those pages until an editor saves them as a named Event Journey and selects it. Event capture links, short links, and QR codes keep their existing addresses and serve the currently effective journey.

The editor is the same at Global, Partner, and Event scope. It edits that journey's page flow, page settings, and supported text/message settings, and uses the existing scope-aware image, frame, logo, and text resources. It does not make a second copy of those libraries. Branding, consent policy, and other event-specific settings stay with their existing owners; the event supplies its own applicable visual assets and policy when the inherited page flow is shown.

The shared editor includes a read-only live preview of the page you are editing. On a wide screen, page settings and preview appear in two columns; on a narrow screen, they stack. Choose Mobile, Tablet, or Desktop to change the preview's stage size. Supported page edits appear in the preview before you save. Camera, Submit, and frame/message-selection steps use placeholders because they need a live device or event state. The preview does not submit a photo or test the complete journey; use the event's capture URL in a separate session for that.

### A journey example

If the global default is **Standard**, a new partner follows **Standard**. The partner can select **Club version** as its PUJ, and its inheriting events then serve **Club version**. An event can select **Matchday version** as its EUJ; later edits to **Club version** will not change that event. At every step only the one selected effective journey is served.

## Edit the pages in a journey

Open any journey you own from its Global, Partner, or Event journey list. The shared editor shows the guest pages in order. Use each page's **Edit** control to change its supported settings and copy; add, hide, or reorder pages there, then press **Save Pages**. The Welcome page opens its visual composition editor from this same flow and uses the image library for the journey's scope.

Changes to the selected journey affect its live guest flow and descendants that still inherit it. Editing an unselected journey only changes that saved version; select it at its owner level to make it live. An inherited journey must first be customized into a child-owned journey before that child can edit it. The page flow can place consent and identity steps, but the event's consent wording, identity requirements, and other event-owned policy remain configured at the Event.

### Take photo and Submit

By default the photo is saved when the user presses **Continue** after the reframe screen: saving is part of the Take Photo page. If you want the user to **take the photo first and then log in (or see a CTA) before the photo is saved**, untick **Submit is part of this page** on the Take Photo page. A **[Submit]** step appears right after Take Photo; the pages you put between the two run after the photo is taken and before it is saved.

## Before you start

1. Open the Global, Partner, or Event journey list from that scope's Content navigation.
2. Open a journey owned at that level. If you are working from an inherited journey at Partner or Event scope, use **Customize inherited journey** first; the child-owned version opens in the shared editor.
3. To put a **Who are you?** page between the photo and the save, add it as one of your own pages or customize the default page.

## Step by step

### 1. Change the order of a page

Press the up or down button of the page and then **Save Pages**. Two rules keep the journey sound: a **default** page cannot go behind the **Take Photo** page (a photo that is checked needs an e-mail or a login first), unless the event has a **[Submit]** step, in which case it may sit between the two but never behind it; and **[Submit]** always stays after **Take Photo**. Move your own pages where needed, subject to these journey rules. The grey **Built in** rows (waiting or share screen, e-mails, public photo page) are not pages and stay where they are.

### 2. Take the photo first, then log in

1. Open the **Take Photo** page (**Edit**) and **untick Submit is part of this page**. A **[Submit]** row appears right after **Take Photo**.
2. Put the **Who are you?** page (and a CTA page if you want one) **between** **Take Photo** and **[Submit]** with the up and down buttons.
3. Press **Save Pages**.

Now the user takes the photo, adjusts it, presses **Continue**, sees the **Who are you?** page, gives a name and an e-mail address, and the photo is saved with that contact. A **consent** page or the acceptance box on the login page works the same way when it sits between the two.

### 3. Back to the default

Tick **Submit is part of this page** again and press **Save Pages**: the **[Submit]** row goes away and **Continue** saves the photo at once, as it always did. Pages that were between the two are then after the photo.

## Managing it

- **Who are you? between the photo and the save shows the name and e-mail form only.** A Google or Facebook sign-in leaves the page and the photo would be lost, so those buttons are not offered there. Before the photo, the sign-in buttons work as usual.
- **A save that fails** shows the error on the same screen; **Continue** saves again and does not ask for the login again. The next photo of the same user does not ask again either; a **Restart** page does.
- **Check it on a phone** with the event's capture link before the event: take a photo, go through the pages, and look at the result in the admin.

## Gotchas & good practice

- Do not untick the box on the day of an event without testing it on a phone first.
- If you only want to change the order of the pages **before** the photo, you do not need the box at all.
- Words on the pages are edited as always: the page editor, the Dictionary and the text levels.

## Magyar változat

### Válaszd ki, melyik utat látják a szurkolók

A Camera minden szinten több, névvel ellátott utat tud tárolni. Mindegyik szinten egy kiválasztott alapértelmezés van:

- A **Global User Journey (GUJ)** az alapértelmezését követő partnerek tartalék útja.
- A **Partner User Journey (PUJ)** az alapértelmezését követő partner eseményeinek tartalék útja.
- Az **Event User Journey (EUJ)** egy eseményhez kiválasztott út.

Egy esemény **egyetlen teljes utat** szolgál ki: a kiválasztott EUJ-t, ennek hiányában a partner kiválasztott PUJ-jét, ennek hiányában a kiválasztott GUJ-t. Ezek az utak nem rakódnak egymásra, és nem olvadnak össze oldalanként. A partner választhat másik PUJ-t a GUJ módosítása nélkül; az esemény választhat másik EUJ-t a partner választásának módosítása nélkül. A szülő módosításai csak azokra a gyermekekre jutnak tovább, amelyek továbbra is azt a szülői választást követik.

Nyisd meg a megfelelő szint **Global User Journey**, **Partner User Journey** vagy **Event User Journey** oldalát a Content menüben. Mindegyik oldal az adott szinten lévő utak listája: létrehozhatsz, átnevezhetsz és kiválaszthatsz utat, vagy bármelyik saját utat megnyithatod ugyanabban a teljes oldalszerkesztőben. A szokásos létrehozás új, névvel ellátott változatot ment, de nem teszi aktívvá; válaszd ki és mentsd el, hogy az adott szint alapértelmezése legyen.

A kiválasztott GUJ az alapértelmezését követő partnerek útja. Minden partner kiválaszthat egy PUJ-t alapértelmezésként, vagy követheti a GUJ-t. Minden esemény kiválaszthat egy EUJ-t, vagy követheti a partner PUJ-jét (és ha a partner is örököl, a GUJ-t). Az esemény mindig pontosan egy teljes utat szolgál ki.

Egy út csak annál a szintnél szerkeszthető, amelyik birtokolja. A partner nem módosíthatja helyben a GUJ-t, és az esemény sem módosíthatja helyben az örökölt PUJ-t vagy GUJ-t. A **Customize inherited journey** művelettel létrejön és kiválasztódik egy, a partner vagy esemény tulajdonában lévő másolat; a Camera ezt nyitja meg ugyanabban a szerkesztőben. A szülői út változatlan marad. A későbbi szülői módosítások csak azokat a gyermekeket érintik, amelyek továbbra is követik. A saját, kiválasztott út szerkesztése az öröklő leszármazottakat is módosítja; egy ki nem választott út szerkesztése csak akkor változtatja meg a vendégek útját, ha kiválasztják.

A saját, régi oldalakkal rendelkező események megtartják ezeket, amíg egy szerkesztő el nem menti azokat névvel ellátott Event Journey-ként, és ki nem választja őket. Az esemény rögzítési linkjei, rövid linkjei és QR-kódjai megtartják a címüket, és mindig az aktuálisan érvényes utat szolgálják ki.

A szerkesztő minden szinten ugyanaz. Az út oldalfolyamát, oldalbeállításait, valamint a támogatott szöveg- és üzenetbeállításokat szerkeszti, és a meglévő, szinthez igazított kép-, keret-, logó- és szövegforrásokat használja; nem hoz létre második médiatárat. A márka, a hozzájárulási szabályzat és az eseményspecifikus beállítások a meglévő tulajdonosi szintjükön maradnak; az esemény a saját vizuális elemeit és szabályzatát adja az örökölt oldalfolyamhoz.

### Példa

Ha a globális alapértelmezés a **Standard**, az új partner ezt követi. A partner kiválaszthatja a **Club version** PUJ-t, amelyet ezután az ezt követő eseményei használnak. Egy esemény kiválaszthatja a **Matchday version** EUJ-t; a **Club version** későbbi módosításai nem változtatják meg ennek az eseménynek az útját. Minden szinten csak az egyetlen kiválasztott, érvényes út jelenik meg.

### Az út oldalainak szerkesztése

Nyisd meg a saját Global, Partner vagy Event utadat a megfelelő szint User Journey listájából. Az egységes szerkesztő a vendégoldalakat sorrendben mutatja. Az oldalak **Edit** vezérlőjével módosíthatod a támogatott beállításokat és szövegeket; itt adhatsz hozzá, rejthetsz el vagy rendezhetsz át oldalakat, majd nyomd meg a **Save Pages** gombot. Az üdvözlő oldal vizuális összeállítója ugyanebből a folyamatból nyílik meg, és az adott út szintjének képtárát használja.

Az egységes szerkesztő az éppen szerkesztett oldalról egy csak megtekintésre használható élő előnézetet is mutat. Széles képernyőn az oldalbeállítások és az előnézet két oszlopban jelennek meg; keskeny képernyőn egymás alá kerülnek. A Mobile, Tablet vagy Desktop választóval módosíthatod az előnézet méretét. A támogatott oldalak módosításai mentés előtt megjelennek az előnézetben. A Camera, Submit, valamint a keret-/üzenetválasztó lépések helyőrzőt mutatnak, mert élő eszközt vagy eseményállapotot igényelnek. Az előnézet nem küld be fotót és nem próbálja végig a teljes utat; ehhez külön munkamenetben használd az esemény rögzítési URL-jét.

A kiválasztott út módosítása frissíti az élő vendégfolyamot és azokat a leszármazottakat, amelyek továbbra is ezt öröklik. Egy ki nem választott út szerkesztése csak a mentett változatot módosítja; az adott szint tulajdonosának kell kiválasztania az élő használathoz. A gyermek csak akkor szerkeszthet örökölt utat, ha előbb saját tulajdonú úttá alakítja. Az oldalfolyam elhelyezi a hozzájárulási és azonosítási lépéseket, de a hozzájárulási szöveg, az azonosítási követelmény és más eseményszintű szabályzat továbbra is az eseménynél állítható.

### Fotózás és Beküldés

Alapesetben a fotó akkor mentődik, amikor a felhasználó a kép igazítása után a **Continue** gombot nyomja: a mentés a Take Photo oldal része. Ha azt szeretnéd, hogy a felhasználó **előbb lefotózza magát, és csak utána jelentkezzen be (vagy lásson egy CTA oldalt), mielőtt a fotó mentődik**, vedd ki a pipát a **Submit is part of this page** jelölőnégyzetből a Take Photo oldalon. Egy **[Submit]** lépés jelenik meg közvetlenül a Take Photo után; a kettő közé tett oldalak a fotó elkészülte után és a mentés előtt jelennek meg.

### Mit kell előtte tudni?

1. Nyisd meg a Global, Partner vagy Event User Journey listát az adott szint Content menüjéből.
2. Nyiss meg egy azon a szinten tulajdonolt utat. Ha Partner vagy Event szinten örökölt utat szeretnél módosítani, használd előbb a **Customize inherited journey** műveletet; a létrejött saját változat ugyanabban a szerkesztőben nyílik meg.
3. Ha a fotó és a mentés közé **Who are you?** oldalt szeretnél tenni, add hozzá a saját oldalak közé, vagy alakítsd saját oldallá az alapértelmezett oldalt.

### Lépésről lépésre

**1. Egy oldal helyének megváltoztatása.** Nyomd meg az oldal fel vagy le gombját, majd a **Save Pages** gombot. Két szabály tartja egyben az utat: egy **alapértelmezett** oldal nem kerülhet a **Take Photo** mögé (az ellenőrzött fotóhoz előbb e-mail-cím vagy bejelentkezés kell), kivéve, ha az eseménynek van **[Submit]** lépése: akkor a kettő közé kerülhet, de mögé soha; a **[Submit]** mindig a **Take Photo** után marad. A saját oldalaidat e szabályok szerint rendezheted el. A szürke **Built in** sorok (várakozó vagy megosztó képernyő, e-mailek, nyilvános fotóoldal) nem oldalak, és a helyükön maradnak.

**2. Előbb fotó, utána bejelentkezés.** (1) Nyisd meg a **Take Photo** oldalt (**Edit**), és vedd ki a pipát a **Submit is part of this page** négyzetből. Egy **[Submit]** sor jelenik meg közvetlenül a **Take Photo** után. (2) A **Who are you?** oldalt (és ha kell, egy CTA oldalt) tedd a **Take Photo** és a **[Submit]** **közé** a fel és le gombokkal. (3) Nyomd meg a **Save Pages** gombot. A felhasználó ekkor lefotózza magát, igazít a képen, a **Continue** gombot nyomja, megjelenik a **Who are you?** oldal, megadja a nevét és az e-mail-címét, és a fotó ezzel az elérhetőséggel mentődik. Egy hozzájárulás oldal vagy az elfogadás-négyzet a bejelentkezési oldalon ugyanígy működik, ha a kettő közé kerül.

**3. Vissza az alapértelmezetthez.** Tedd vissza a pipát a **Submit is part of this page** négyzetbe, és nyomd meg a **Save Pages** gombot: a **[Submit]** sor eltűnik, a **Continue** pedig azonnal ment, mint mindig. A kettő közt lévő oldalak ekkor a fotó után következnek.

### Kezelés

- **A fotó és a mentés közti Who are you? oldal csak a név és e-mail űrlapot mutatja.** A Google- vagy Facebook-belépés elhagyja az oldalt, és a fotó elveszne, ezért ott ezek a gombok nincsenek. A fotó előtt a belépő gombok a szokott módon működnek.
- **Ha a mentés nem sikerül**, a hiba ugyanazon a képernyőn jelenik meg; a **Continue** újra ment, és nem kéri újra a bejelentkezést. Ugyanennek a felhasználónak a következő fotójánál sem kérdez újra; a **Restart** oldal igen.
- **Próbáld ki telefonon** az esemény fotózó linkjével az esemény előtt: készíts egy fotót, menj végig az oldalakon, és nézd meg az eredményt az adminban.

### Jó tudni

- Ne vedd ki a pipát az esemény napján, mielőtt telefonon kipróbáltad.
- Ha csak a fotó **előtti** oldalak sorrendjét akarod megváltoztatni, a négyzetre nincs szükséged.
- Az oldalak szövegeit a szokott módon szerkeszted: az oldalszerkesztőben, a Szótárban és a szövegszinteken.
