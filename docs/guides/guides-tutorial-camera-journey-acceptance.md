# Tutorial: The acceptance on the "Who are you" page (camera app)
Status: Active
Last Updated: 2026-10-09T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ 5f489dd (camera#523); the public gallery permission with camera#554

> Audience: The people who set up an event in the Camera app (editors, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner · Related: [The CTA page with a picture](guides-tutorial-camera-cta-page.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

By default a user meets two pages before the photo: **Before we start** (the consent page with three checkboxes: the terms, the cookies, the privacy policy) and **Who are you?** (sign in with Google or Facebook, or give a name and an e-mail address). Two pages mean two taps and a screen of three boxes on a phone.

With **Show acceptance** switched on, the consent page is not a step of its own any more. Its checkboxes appear on the **Who are you?** page as **one small checkbox with one sentence**, under the intro text and above the sign-in buttons, for example: *I accept the Terms and conditions, and I acknowledge the Privacy notice and the Cookie notice* (each name is a link to its page, opening in a new tab). **Everything on the page is off until that box is ticked**: the Google and Facebook buttons, the name and e-mail fields and the continue button.

## Before you start

1. Open the event in the Camera app admin, then its page editor (**Edit and pages**).
2. The event needs a **Who are you?** page and a **consent** page, both **before** the photo and both **switched on**. If your event uses the **default** pages (marked *Default*), press **Customise** on the page you want to open: a default page has no editor until it is customised.

## Step by step

### 1. Switch it on

Open the **Who are you?** page editor and tick **Show acceptance**, or open the consent page editor and tick **Show it on Who-are-you**. They are **the same setting**: ticking one ticks the other. Then press **Save all** (the setting is saved with the pages).

### 2. Look at it on a phone

Open the event's capture link on a phone. The page shows the sentence in a small box where the intro text ends. The sign-in buttons are pale and the fields grey until the box is ticked; after that everything works as before. Try signing in with Google too: the box stays ticked when you come back from the sign-in.

### 3. The wording

The sentence is made from the **three usual legal pages** of an event (the terms, the cookies, the privacy policy, in that order). Its wording is a text of the dictionary, in each language, editable at the global, partner and event level in the **Texts** editors (`consent.combined` and the three link names). If the consent page has a **different list of checkboxes**, the Who-are-you page shows their own texts one after the other, each with its link, so nothing the user is asked to accept is left out.

### 4. Switch it off

Untick the same box and press **Save all**: the two pages come back, one after the other, as before.

## A separate permission for the public gallery (optional, per service and market)

The box above covers accepting the terms. Some services and markets also need the user's **own, separate permission** before a photo is shown on a **public wall or gallery** (for example the pledge wall or the savetheworld galleries); for others the terms are enough. So it is a setting, and **nothing changes for any event until you choose**.

1. **For all events of a partner:** open the partner in the Camera app admin, **Edit**, and in the section **Public gallery permission** choose **Ask** (the standard is **Do not ask**), then save.
2. **For one event:** open the event, **Edit and pages**. At the top of the list **Pages of the user journey** (and inside the consent page's editor, the same setting) choose **Permission to show the photo in the public gallery**: **Same as the partner** (it says in brackets what that gives), **Ask** or **Do not ask**, then **Save all**.

When an event asks, the user sees **one optional checkbox, not ticked,** where the photo is saved (under the picture, above **Continue**): "I agree to show my photo on the public campaign wall (optional)." with a line saying that leaving it empty keeps the photo off the wall. **Only a ticked box puts the photo on the wall** (the public pledge wall and galleries of the savetheworld campaign): the giant screen at the venue, the user's own share link and the e-mails follow the approval rule alone, so a user who leaves the box empty loses nothing else. The ticked box is kept with the photo as evidence (the version of the sentence and the time), it is for **one photo** (the next photo starts empty), and the server checks it, so an old page cannot skip it. The words are ordinary Dictionary texts (`share.publicGalleryConsent` and `share.publicGalleryConsentHelp`, English and Hungarian) that you can change at every level; have whoever advises on privacy check them before the event.

## Managing it

- **What is recorded:** the same consent records as the separate page, one per document (its exact text, its link and the time), and each also keeps **the sentence the user read**. They are recorded the moment the box is ticked.
- **If a page is missing or switched off**, or the consent page comes after the photo, nothing changes: the user still gets a consent page. The setting only works when both pages are active and before the photo.
- **Sign-in:** the acceptance given before a Google or Facebook sign-in is kept in the browser for up to 30 minutes and used when the user comes back, so the photo keeps its consents.

## Gotchas & good practice

- The box covers **accepting the terms and taking note of the two notices**. If the event later collects more (analytics, profiling), that needs its own **separate, optional** consent, not this tick. Ask whoever advises on privacy to check the wording for your event.
- The Hungarian sentence is the club's own wording: have the club read it.
- Always test on a phone with a real sign-in before the event, and keep the separate pages as the fallback (untick **Show acceptance**).

## Magyar változat

### Mi ez, és miért jó?

Alapesetben a felhasználó a fotó előtt két oldalon megy át: **Mielőtt elkezdjük** (a hozzájárulás oldal három jelölőnégyzettel: az ÁSZF, a sütik, az adatvédelem) és **Ki vagy te?** (belépés Google-lal vagy Facebookkal, vagy név és e-mail-cím). Két oldal két koppintás, és telefonon egy képernyőnyi három jelölőnégyzet.

Ha a **Show acceptance** be van kapcsolva, a hozzájárulás oldal már nem külön lépés. A jelölőnégyzetei a **Ki vagy te?** oldalon jelennek meg **egyetlen kis jelölőnégyzetként, egyetlen mondattal**, a bevezető szöveg alatt és a belépő gombok fölött, például: *Elfogadom az Általános Szerződési Feltételeket, tudomásul veszem az Adatkezelési tájékoztatót és a Sütikezelési tájékoztatót* (minden név egy hivatkozás a saját oldalára, új lapon nyílik meg). **Az oldalon minden ki van kapcsolva, amíg ezt a négyzetet nem pipálják be**: a Google- és Facebook-gombok, a név és az e-mail mező, és a folytatás gomb.

### Mit kell előtte tudni?

1. Nyisd meg az eseményt a Camera app adminjában, majd az oldalszerkesztőjét (**Edit and pages**).
2. Az eseménynek kell egy **Ki vagy te?** oldal és egy **hozzájárulás** oldal, mindkettő a fotó **előtt** és mindkettő **bekapcsolva**. Ha az esemény az **alapértelmezett** oldalakat használja (*Default* jelzés), nyomd meg a **Customise** gombot azon az oldalon, amelyiket meg akarod nyitni: az alapértelmezett oldalnak nincs szerkesztője, amíg nem szabod személyre.

### Lépésről lépésre

**1. Bekapcsolás.** Nyisd meg a **Ki vagy te?** oldal szerkesztőjét, és pipáld be a **Show acceptance** négyzetet, vagy a hozzájárulás oldal szerkesztőjében a **Show it on Who-are-you** négyzetet. **Ugyanaz a beállítás**: az egyik pipálása a másikat is bepipálja. Utána nyomd meg a **Save all** gombot (a beállítás az oldalakkal együtt mentődik).

**2. Nézd meg telefonon.** Nyisd meg az esemény fotózó linkjét telefonon. Az oldalon a mondat egy kis dobozban áll ott, ahol a bevezető szöveg véget ér. A belépő gombok halványak, a mezők szürkék, amíg a négyzet nincs bepipálva; utána minden a régi módon működik. Próbáld ki a Google-os belépést is: a négyzet bepipálva marad, amikor visszatérsz a belépésből.

**3. A szövegezés.** A mondat az esemény **három szokásos jogi oldalából** készül (ÁSZF, sütik, adatvédelem, ebben a sorrendben). A szövege a szótár egy szövege minden nyelven, a **Texts** szerkesztőkben átírható globális, partner és esemény szinten (`consent.combined` és a három hivatkozásnév). Ha a hozzájárulás oldalon **más jelölőnégyzet-lista** van, a Ki vagy te? oldal a saját szövegeiket mutatja egymás után, mindegyiket a hivatkozásával, így semmi sem marad ki abból, amit el kell fogadni.

**4. Kikapcsolás.** Vedd ki ugyanazt a pipát, és nyomd meg a **Save all** gombot: a két oldal visszatér, egymás után, a régi módon.

### Külön hozzájárulás a nyilvános galériához (nem kötelező, szolgáltatásonként és piaconként)

A fenti négyzet az ÁSZF elfogadását fedi. Egyes szolgáltatásoknál és piacokon a felhasználó **saját, külön hozzájárulása** is kell ahhoz, hogy egy fotó **nyilvános falon vagy galériában** megjelenjen (például a fogadalomfalon vagy a savetheworld galériáiban); másoknál az ÁSZF elég. Ezért ez egy beállítás, és **amíg nem választasz, egyetlen esemény sem változik**.

**Egy partner összes eseményére:** nyisd meg a partnert a camera admin felületen, **Edit**, és a **Public gallery permission** szekcióban válaszd az **Ask** lehetőséget (az alapértelmezett a **Do not ask**), majd mentsd. **Egy eseményre:** nyisd meg az eseményt, **Edit and pages**. A **Pages of the user journey** lista tetején (és a hozzájárulás oldal szerkesztőjében, ugyanez a beállítás) válaszd a **Permission to show the photo in the public gallery** mezőt: **Same as the partner** (zárójelben megmutatja, mit ad), **Ask** vagy **Do not ask**, majd **Save all**.

Ha egy esemény kéri, a felhasználó **egy nem kötelező, nem bepipált négyzetet** lát ott, ahol a fotó mentődik (a kép alatt, a **Continue** fölött): „Hozzájárulok, hogy a fotóm megjelenjen a kampány nyilvános falán (nem kötelező).”, mellette egy sorral, hogy az üresen hagyás a fotót kihagyja a falról. **Csak a bepipált négyzet teszi fel a fotót a falra** (a savetheworld kampány nyilvános fogadalomfalára és galériáira): a helyszíni nagy képernyő, a felhasználó saját megosztási linkje és az e-mailek csak a jóváhagyási szabályt követik, ezért aki üresen hagyja a négyzetet, mást nem veszít. A bepipálást a fotó mellett őrizzük bizonyítékként (a mondat verziója és az időpont), **egy fotóra** szól (a következő fotónál újra üres), és a szerver ellenőrzi, így egy régi oldal nem tudja kihagyni. A szövegek közönséges Szótár-szövegek (`share.publicGalleryConsent` és `share.publicGalleryConsentHelp`, angolul és magyarul), minden szinten módosíthatók; az esemény előtt olvastasd el azzal, aki az adatvédelmi kérdésekben tanácsot ad.

### Kezelés

- **Mit rögzít:** ugyanazokat a hozzájárulási bejegyzéseket, mint a külön oldal, dokumentumonként egyet (a pontos szöveget, a hivatkozást és az időpontot), és mindegyik megőrzi **a mondatot is, amit a felhasználó elolvasott**. A rögzítés a négyzet bepipálásának pillanatában történik.
- **Ha egy oldal hiányzik vagy ki van kapcsolva**, vagy a hozzájárulás oldal a fotó után van, semmi sem változik: a felhasználó továbbra is kap hozzájárulás oldalt. A beállítás csak akkor működik, ha mindkét oldal aktív és a fotó előtt van.
- **Belépés:** a Google- vagy Facebook-belépés előtt megadott elfogadást a böngésző legfeljebb 30 percig megőrzi, és a visszatéréskor felhasználja, így a fotó megtartja a hozzájárulásait.

### Jó tudni

- A négyzet az **ÁSZF elfogadását és a két tájékoztató tudomásul vételét** fedi. Ha az esemény később többet gyűjt (analitika, profilozás), ahhoz külön, **választható** hozzájárulás kell, nem ez a pipa. Kérd meg az adatvédelmi tanácsadót, hogy nézze át a szöveget az eseményedhez.
- A magyar mondat a klub saját megfogalmazása: olvastasd el a klubbal.
- Az esemény előtt mindig próbáld ki telefonon, valódi belépéssel, és tartsd készenlétben a külön oldalakat (vedd ki a **Show acceptance** pipát).
