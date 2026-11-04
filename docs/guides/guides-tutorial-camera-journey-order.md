# Tutorial: The order of the pages, and Take photo + Submit (camera app)
Status: Active
Last Updated: 2026-11-04T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code (camera#535, steps 1 and 2; camera#788 journey versions)

> Audience: The people who set up an event in the Camera app (editors, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner · Related: [The acceptance on the "Who are you" page](guides-tutorial-camera-journey-acceptance.md), [The CTA page with a picture](guides-tutorial-camera-cta-page.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

The list **Pages of the user journey** in the event's page editor is the journey in the order a user goes through it. Two things in it can be changed, and neither changes anything for an event until you do it:

1. **The order of every page**, including the pages marked **Default** (the welcome page, **Before we start** (consent) and **Who are you?**). They have the up and down buttons like your own pages. A default page stays a default: its words still come from the Dictionary and the text levels; only its **place** is yours.
2. **Take photo and Submit.** By default the photo is saved when the user presses **Continue** after the reframe screen: saving is part of the Take Photo page. If you want the user to **take the photo first and then log in (or see a CTA) before the photo is saved**, untick **Submit is part of this page** on the Take Photo page. A **[Submit]** step appears right after Take Photo; the pages you put between the two run after the photo is taken and before it is saved.

## Choose which journey guests see

Global, Partner and Event User Journey settings can keep more than one named journey version. Creating a version only adds it to the available list; it does not change what guests see. At Global or Partner level, select the version you want as that level's default and save. A child that follows its parent receives that default; a Partner or Event that selects its own version keeps that choice when the parent changes.

In **Event User Journey**, choose **Follow the parent default**, one of the Event's own versions, or **Use this event's own pages**, then save. The page shows the journey currently live and the Event's capture URL and short link. The Event's QR code and existing public URLs keep the same addresses; after the selection is saved, those addresses serve the selected journey. Use the public capture link to check the flow on a phone before the event.

Creating an Event version and selecting it are separate actions. If you create another version, choose it in **Journey shown to event guests** and save when you are ready to publish it for that Event.

## Before you start

1. Open the event in the Camera app admin, then its page editor (**Edit and pages**).
2. To put a **Who are you?** page between the photo and the save you need that page as one of your own pages (add it with **+ Who Are You**, or press **Customise** on the default one).

## Step by step

### 1. Change the order of a page

Press the up or down button of the page and then **Save all**. Two rules keep the journey sound: a **default** page cannot go behind the **Take Photo** page (a photo that is checked needs an e-mail or a login first), unless the event has a **[Submit]** step, in which case it may sit between the two but never behind it; and **[Submit]** always stays after **Take Photo**. Your own pages can go anywhere. The grey **Built in** rows (waiting or share screen, e-mails, public photo page) are not pages and stay where they are.

### 2. Take the photo first, then log in

1. Open the **Take Photo** page (**Edit**) and **untick Submit is part of this page**. A **[Submit]** row appears right after **Take Photo**.
2. Put the **Who are you?** page (and a CTA page if you want one) **between** **Take Photo** and **[Submit]** with the up and down buttons.
3. Press **Save all**.

Now the user takes the photo, adjusts it, presses **Continue**, sees the **Who are you?** page, gives a name and an e-mail address, and the photo is saved with that contact. A **consent** page or the acceptance box on the login page works the same way when it sits between the two.

### 3. Back to the default

Tick **Submit is part of this page** again and press **Save all**: the **[Submit]** row goes away and **Continue** saves the photo at once, as it always did. Pages that were between the two are then after the photo.

## Managing it

- **Who are you? between the photo and the save shows the name and e-mail form only.** A Google or Facebook sign-in leaves the page and the photo would be lost, so those buttons are not offered there. Before the photo, the sign-in buttons work as usual.
- **A save that fails** shows the error on the same screen; **Continue** saves again and does not ask for the login again. The next photo of the same user does not ask again either; a **Restart** page does.
- **Check it on a phone** with the event's capture link before the event: take a photo, go through the pages, and look at the result in the admin.

## Gotchas & good practice

- Do not untick the box on the day of an event without testing it on a phone first.
- If you only want to change the order of the pages **before** the photo, you do not need the box at all.
- Words on the pages are edited as always: the page editor, the Dictionary and the text levels.

## Magyar változat

### Mi ez, és miért jó?

Az esemény oldalszerkesztőjében a **Pages of the user journey** lista a felhasználó útja a sorrendben, ahogy végigmegy rajta. Két dolgot lehet benne megváltoztatni, és amíg nem teszed meg, semmi sem változik az eseményen:

1. **Minden oldal sorrendjét**, a **Default** jelölésű oldalakét is (az üdvözlő oldal, a **Before we start** (hozzájárulás) és a **Who are you?**). Nekik is van fel és le gombjuk, mint a saját oldalaknak. Egy alapértelmezett oldal alapértelmezett marad: a szövegei továbbra is a Szótárból és a szövegszintekből jönnek, csak a **helye** a tiéd.
2. **Fotózás és Beküldés.** Alapesetben a fotó akkor mentődik, amikor a felhasználó a kép igazítása után a **Continue** gombot nyomja: a mentés a Take Photo oldal része. Ha azt szeretnéd, hogy a felhasználó **előbb lefotózza magát, és csak utána jelentkezzen be (vagy lásson egy CTA oldalt), mielőtt a fotó mentődik**, vedd ki a pipát a **Submit is part of this page** jelölőnégyzetből a Take Photo oldalon. Egy **[Submit]** lépés jelenik meg közvetlenül a Take Photo után; a kettő közé tett oldalak a fotó elkészülte után és a mentés előtt jelennek meg.

## Annak kiválasztása, melyik utat látják a vendégek

A Global, Partner és Event User Journey beállításokban több, névvel ellátott útverziót is megtarthatsz. Az új verzió létrehozása csak hozzáadja azt a választható listához; önmagában nem változtatja meg, mit látnak a vendégek. Global vagy Partner szinten válaszd ki, melyik verzió legyen az adott szint alapértelmezett útja, majd mentsd el. A szülő útját követő gyermek megkapja ezt az alapértelmezést; a saját verziót választó Partner vagy Event választása nem változik, amikor a szülő módosul.

Az **Event User Journey** részen válaszd a **Follow the parent default** lehetőséget, az Event egyik saját verzióját vagy a **Use this event's own pages** lehetőséget, majd mentsd el. Az oldal megmutatja, melyik út van éppen használatban, valamint az Event fotózó linkjét és rövid linkjét. Az Event QR-kódjának és a már létező nyilvános linkeknek a címe nem változik; a mentés után ezek a kiválasztott utat jelenítik meg. Az esemény előtt telefonon is ellenőrizd a nyilvános fotózó linken.

Az Event-verzió létrehozása és kiválasztása két külön művelet. Ha újabb verziót hozol létre, válaszd ki a **Journey shown to event guests** mezőben, és akkor mentsd el, amikor készen állsz arra, hogy az adott Event vendégei ezt lássák.

### Mit kell előtte tudni?

1. Nyisd meg az eseményt a Camera app adminban, majd az oldalszerkesztőjét (**Edit and pages**).
2. Ahhoz, hogy a fotó és a mentés közé **Who are you?** oldalt tegyél, a saját oldalaid között kell lennie (add hozzá a **+ Who Are You** gombbal, vagy az alapértelmezettet a **Customise** gombbal tedd sajátoddá).

### Lépésről lépésre

**1. Egy oldal helyének megváltoztatása.** Nyomd meg az oldal fel vagy le gombját, majd a **Save all** gombot. Két szabály tartja egyben az utat: egy **alapértelmezett** oldal nem kerülhet a **Take Photo** mögé (az ellenőrzött fotóhoz előbb e-mail-cím vagy bejelentkezés kell), kivéve, ha az eseménynek van **[Submit]** lépése: akkor a kettő közé kerülhet, de mögé soha; a **[Submit]** mindig a **Take Photo** után marad. A saját oldalaid bárhová mehetnek. A szürke **Built in** sorok (várakozó vagy megosztó képernyő, e-mailek, nyilvános fotóoldal) nem oldalak, és a helyükön maradnak.

**2. Előbb fotó, utána bejelentkezés.** (1) Nyisd meg a **Take Photo** oldalt (**Edit**), és vedd ki a pipát a **Submit is part of this page** négyzetből. Egy **[Submit]** sor jelenik meg közvetlenül a **Take Photo** után. (2) A **Who are you?** oldalt (és ha kell, egy CTA oldalt) tedd a **Take Photo** és a **[Submit]** **közé** a fel és le gombokkal. (3) Nyomd meg a **Save all** gombot. A felhasználó ekkor lefotózza magát, igazít a képen, a **Continue** gombot nyomja, megjelenik a **Who are you?** oldal, megadja a nevét és az e-mail-címét, és a fotó ezzel az elérhetőséggel mentődik. Egy hozzájárulás oldal vagy az elfogadás-négyzet a bejelentkezési oldalon ugyanígy működik, ha a kettő közé kerül.

**3. Vissza az alapértelmezetthez.** Tedd vissza a pipát a **Submit is part of this page** négyzetbe, és nyomd meg a **Save all** gombot: a **[Submit]** sor eltűnik, a **Continue** pedig azonnal ment, mint mindig. A kettő közt lévő oldalak ekkor a fotó után következnek.

### Kezelés

- **A fotó és a mentés közti Who are you? oldal csak a név és e-mail űrlapot mutatja.** A Google- vagy Facebook-belépés elhagyja az oldalt, és a fotó elveszne, ezért ott ezek a gombok nincsenek. A fotó előtt a belépő gombok a szokott módon működnek.
- **Ha a mentés nem sikerül**, a hiba ugyanazon a képernyőn jelenik meg; a **Continue** újra ment, és nem kéri újra a bejelentkezést. Ugyanennek a felhasználónak a következő fotójánál sem kérdez újra; a **Restart** oldal igen.
- **Próbáld ki telefonon** az esemény fotózó linkjével az esemény előtt: készíts egy fotót, menj végig az oldalakon, és nézd meg az eredményt az adminban.

### Jó tudni

- Ne vedd ki a pipát az esemény napján, mielőtt telefonon kipróbáltad.
- Ha csak a fotó **előtti** oldalak sorrendjét akarod megváltoztatni, a négyzetre nincs szükséged.
- Az oldalak szövegeit a szokott módon szerkeszted: az oldalszerkesztőben, a Szótárban és a szövegszinteken.
