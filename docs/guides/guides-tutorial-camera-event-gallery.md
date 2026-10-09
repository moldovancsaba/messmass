# Tutorial: The event gallery (camera app)
Status: Active
Last Updated: 2026-10-09T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ ae60b30 (camera#488, camera#500)

> Audience: The people who run an event in the Camera app (editors, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has access to it · Related: [Approving photos at an event](guides-tutorial-approving-photos.md), [Layouts, messages and the dark area](guides-tutorial-camera-layouts-messages.md), [The giant screen](guides-tutorial-camera-giant-screen.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

The **Gallery** is the page of an event where all its photos are: the ones the users took, and the ones you add yourself (photos from the photographer, the club's own pictures). From here you can **upload** photos, give the ones you upload **the event's frame** so they look like the photos the users take, and **select several photos at once** to remove them or to give them the frame.

## Before you start

- The gallery has **its own entry in the event menu: Gallery**. The event's overview only shows a short card with the number of photos and a button that opens the gallery.
- The page shows the **100 newest photos** and says how many there are in all.
- To give uploaded photos a frame, the event needs a frame: a **complete frame** you uploaded on the Frames page, or the generated frame of the event.

## Step by step

### 1. Upload photos

In the upload box press the button to choose files (or drop them). To make them look like the users' photos tick **Add the event's frame to the photos I upload**:

- the photo is **cropped to the shape of the frame** (the part with the most going on is kept, usually the people) and the **frame is laid over it**, exactly as on a user's photo;
- the **plain upload is kept** as the original, so nothing is lost;
- with a **generated frame** (no complete frame uploaded) one of the event's messages is picked at random for each photo and written on it, as for a user's photo;
- if the event has **no frame yet**, the box is greyed out and says so: set one up on the Frames page first.

If the frame cannot be fetched for some reason, the photo is **added without it** and the answer says so.

### 2. Select several photos

- **Shift + click**: click one photo's checkbox, then Shift + click another: **everything between them** is selected, in either direction.
- **Ctrl (Cmd on a Mac) + click**: adds or takes away one photo.
- **Drag a box**: press on the space **between** the pictures and drag: the photos the box touches are selected (hold Shift or Ctrl/Cmd to keep what was selected). A click on the empty space lets go of the selection.
- **Select mode** (the button above the photos): a drag starts **anywhere** and a tap **selects instead of opening**. Use it with a finger on a tablet or a phone.
- **Ctrl/Cmd + A** selects every photo shown (while you are in the gallery); **Esc** clears the selection.

Selected photos have an outline, and the number selected is announced to screen readers.

### 3. Do something with the selection

- **Remove selected (N)**: asks to confirm, then removes the photos from the event.
- **Add the frame to N selected**: gives the frame to photos **you uploaded earlier without it**. Only photos that **an editor uploaded here** and that **have no frame yet** are changed: the users' photos were framed when they were taken, and a photo is framed once, so pressing it twice does nothing. The answer says how many were framed and why the others were left. Up to **25 at a time**; the plain upload is kept.

## Managing it

- A photo added to the gallery also gets its **screen-sized picture** for the giant screen, made a moment after the upload.
- The photos of users who must be approved first are approved in the **Vetting** tab, not here.

## Gotchas & good practice

- Look at **one framed photo** before you frame a hundred: the crop keeps the busiest part, which is usually the people but not always.
- Selection does not reach past what is shown: if the event has more than 100 photos, select what you see, act, and the next ones appear.
- There is no automatic scrolling while you drag a box: use Shift + click for long ranges.
- Not tried by the author on a real phone: check **Select mode** with your finger before the event.

<a id="magyar-valtozat"></a>

## Magyar változat

### Az esemény galériája (camera alkalmazás)

A **Gallery** (galéria) az esemény oldala, ahol az összes fotó van: amit a felhasználók készítettek, és amit te töltesz fel (a fotós képei, a klub saját képei). Innen tölthetsz fel fotókat, adhatsz a feltöltöttekre **az esemény keretét**, hogy ugyanúgy nézzenek ki, mint a felhasználók fotói, és **egyszerre több fotót is kijelölhetsz** eltávolításhoz vagy kerethez.

**Tudnivalók**

- A galériának **saját menüpontja** van az esemény menüjében: **Gallery**. Az esemény áttekintő oldalán csak egy rövid kártya van a fotók számával és egy gombbal, amely megnyitja.
- Az oldal a **100 legújabb fotót** mutatja, és kiírja az összes számát.
- Keretet akkor tudsz adni a feltöltött fotókra, ha az eseménynek van kerete: a Frames oldalon feltöltött **teljes keret**, vagy az esemény generált kerete.

**1. Feltöltés.** A feltöltő dobozban válaszd ki a fájlokat (vagy húzd rá őket). Pipáld be: **Add the event's frame to the photos I upload**. A fotó **a keret alakjára vágódik** (a legtöbb történést tartalmazó rész marad, általában az emberek), és **rákerül a keret**, pontosan úgy, mint a felhasználó fotójára. **A sima feltöltés megmarad** eredetiként. Generált keretnél minden fotóra véletlenszerűen kiválasztódik az esemény egyik üzenete. Ha az eseménynek **még nincs kerete**, a doboz szürke, és ezt írja: előbb a Frames oldalon állíts be egyet. Ha a keretet valamiért nem sikerül lekérni, a fotó **keret nélkül kerül fel**, és a válasz ezt jelzi.

**2. Több fotó kijelölése.**

- **Shift + kattintás**: kattints egy fotó jelölőnégyzetére, majd Shift + kattints egy másikra: **a kettő közti összes** kijelölődik, bármelyik irányban.
- **Ctrl (Macen Cmd) + kattintás**: egy fotót hozzáad vagy elvesz.
- **Doboz húzása**: nyomd meg a képek **közti** helyet, és húzz: a doboz által érintett fotók kijelölődnek (Shift vagy Ctrl/Cmd lenyomásával a korábbi kijelölés megmarad). Az üres helyre kattintás elengedi a kijelölést.
- **Select mode** (a fotók fölötti gomb): a húzás **bárhol** indulhat, és az érintés **kijelöl, nem megnyit**. Ujjal, táblagépen vagy telefonon ezt használd.
- **Ctrl/Cmd + A** kijelöli a látható összes fotót (a galériában állva), az **Esc** törli a kijelölést.

**3. Mit lehet a kijelöléssel.**

- **Remove selected (N)**: megerősítést kér, majd eltávolítja a fotókat az eseményből.
- **Add the frame to N selected**: keretet ad a **korábban keret nélkül feltöltött** fotókra. Csak az **itt, szerkesztő által feltöltött**, **még keret nélküli** fotók változnak: a felhasználók fotói a készítésükkor megkapták a keretet, és egy fotó csak egyszer kap keretet, ezért a gomb kétszeri megnyomása nem csinál semmit. A válasz megmondja, hány fotó kapott keretet, és a többit miért hagyta ki. Egyszerre legfeljebb **25**; a sima feltöltés megmarad.

**Jó tudni**

- A galériába került fotóról a háttérben **képernyőméretű kép** is készül az óriáskivetítőnek.
- Az előzetes jóváhagyást igénylő felhasználók fotóit a **Vetting** fülön hagyod jóvá, nem itt.
- **Egy keretezett fotót nézz meg**, mielőtt százat keretezel: a vágás a legmozgalmasabb részt tartja meg, ami általában az emberek, de nem mindig.
- A kijelölés csak a látható fotókra vonatkozik: ha az eseménynek több mint 100 fotója van, jelöld ki, amit látsz, és a következők megjelennek.
- Húzás közben nincs automatikus görgetés: hosszú sávhoz használd a Shift + kattintást.
- Valódi telefonon a szerző nem próbálta ki: a **Select mode**-ot nézd meg az ujjaddal az esemény előtt.
