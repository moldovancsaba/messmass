# Tutorial: Stadium backgrounds and QR texts for the stage of the default slideshow (camera app)
Status: Active
Last Updated: 2026-10-11T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app docs and code @ 80f5a394 (camera#326, camera#327; stadium backgrounds, QR texts and the redraw of the welcome page screen), read from the pages' own texts; not checked at a live event

> Audience: Global admins (the two general libraries), partner managers (their own stadium backgrounds), and the people who set up an event (the Default stage card and the slideshow editor) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner (a global admin can do everything here) · Related: [The giant screen (camera app slideshow)](guides-tutorial-camera-giant-screen.md), [Sample selfies and the photo window of the welcome page screen (camera app)](guides-tutorial-camera-sample-selfies.md)

## What it is & why it matters

Every event has a **default slideshow**, and that slideshow has a **stage**: the picture drawn under the photos of the giant screen. It holds the dark background, the panel with the QR code, the band with the written address, and a transparent window where the photos play. The system draws the stage for you, in the event's own colours. The welcome page of the Camera app shows the same stage as a picture above the Start button.

Two optional libraries now let you dress that stage:

1. **Stadium backgrounds.** Pictures of a stadium. If the event has one to use, the stage is drawn on it instead of the plain night-stadium drawing: the picture fills the stage, the event's colours lie over it, and the panels and the photo window are drawn on top.
2. **QR texts.** Short lines such as "Scan & smile". One is shown **above the QR code** on the default slideshow, as wide as the QR code.

Both are managed in the **Libraries** menu by the global admins. A partner can choose or upload its own stadium backgrounds, and so can an event, in the same panel as the logo (use the default, choose, upload, add more, replace, show nothing).

**Nothing changes until you use them.** Both libraries start empty, and with nothing in them every stage and every default slideshow is exactly what it was. Even after something is added, **an event that already exists keeps its stage** until one of its editors presses **Draw the stage again**, **Pick another**, or changes the choice on the event's own card. The system never changes an existing stage on its own.

## Before you start

- Only images **cleared for commercial use** go into the library. There is no tick to press: if a picture has a problem, switch it off or delete it and it is never used for a new stage again.
- A **wide picture of a stadium** works best. It fills a 16:9 stage and is cropped to fit, the event's colours lie over it, and the panels and the photo window sit on top, so look at the result before you rely on a picture.
- A QR text is **one short line, at most 40 characters**, in English or in Hungarian. It is scaled to the width of the QR code: a short line is big, a long one is small.
- The libraries (**Libraries > Stadium backgrounds** and **Libraries > QR texts**) are for **global admins**. Partner managers and event editors work from the partner's **Pictures** page and the event's **Slideshows** page.

## Step by step

### 1. The general stadium backgrounds (global admins)

Open **Libraries > Stadium backgrounds**. The list says how many there are and how many are active. **Upload a stadium background** (a name and a picture, PNG, JPEG, WebP or SVG up to 4 MB). On each card:

- **Switch off** takes it out of use for new stages without deleting it; **Switch on** brings it back. A stage that is already drawn keeps its picture until an editor draws it again.
- **Delete** asks on the card itself: *Delete it for good? Partners and events that chose it use the next one instead.* Press **Yes, delete it** or **Cancel**.

The active ones are the default of every partner: a partner uses them until it chooses or uploads its own, and an event uses its partner's until it chooses or uploads its own. The event's own choice always wins, then its partner's, then the general ones.

### 2. A partner's own (partner managers)

Open the partner, **Pictures**, and the card **Stadium backgrounds**. The partner **uses the default** (the general ones), picks some with **Use this one**, uploads its own with **Upload a new one**, or shows nothing here with **Show nothing here**. **Use the default again** goes back. Each picture says where it comes from. If more than one is used, one of them is picked at random for the stage.

### 3. The stage of one event: the Default stage card

Open the event, **Slideshows**, and the card **Default stage**. It shows the stage as it is now, which stadium background it is drawn on (or that it is drawn plainly, in the event's colours), and how many stadium backgrounds the event can use.

- **Draw the stage again** draws the stage on what the event uses now. It keeps the background that was picked for the event while it is still one of the ones it can use; otherwise it picks one at random; with none to use, the plain stage is drawn. If nothing would change, the card says *The stage is already drawn on what the event uses: nothing changed.*
- **Pick another** takes a different stadium background. It is greyed out unless the event can use at least two.
- Below, the **Stadium backgrounds** panel is the same as the partner's. **Choosing, uploading, replacing or removing a picture there draws the stage again in one press.**

When the stage changes, the card says *The stage was drawn again. Screens that are open reload to show it.* The giant screens that are open reload at their next picture, like after any save of the slideshow (see [the giant screen](guides-tutorial-camera-giant-screen.md)), so **do not press it while a goal is celebrated**. If the event already has its welcome page screen picture, that picture is drawn again after it; an event that has none is not given one.

**A stage picture that an editor chose is never touched.** If the slideshow's stage is a picture picked in the slideshow editor (the designers' picture of MTK x Vasas is one), the card says *This slideshow has a stage picture of its own (chosen in the slideshow editor), so a stadium background does not apply to it. Nothing here changes it.*

### 4. The general QR texts (global admins)

Open **Libraries > QR texts**. The list says *In the library (N, M active)*. Under **Add a QR text** type the **Text** (at most 40 characters, for example *Scan & smile*), choose the **Language** (English or Magyar (Hungarian)) and press **Add the text**. Each line shows its language and whether it is **Active** or **Switched off**:

- **Switch off** / **Switch on**: a text that is switched off is no longer picked for a new event; an event that has it keeps it.
- **Delete** asks on the row: *Delete it for good? Events that have it keep it on their stage.* Press **Yes, delete it** or **Cancel**.

The library holds up to 200 texts. Add several: the more there are, the more the events differ from each other.

### 5. What a new event gets, and how an editor changes it

When an event's default slideshow is **made** (a new event, or **Create the default slideshow** on the event's Slideshows page), the system:

1. picks **one active QR text in the event's language** (English when there is none in that language) at random, **once**, and puts it in the slideshow as a second text **above the QR code**. The written address stays under the photo window. With no QR text in the library there is only the written address, as before.
2. picks one of the stadium backgrounds the event can use at random, **once**, and draws the stage on it. With none, the plain stage is drawn.

After that, **the line is an ordinary text of the slideshow**. The editor changes it or removes it in the slideshow editor (**Screen design**, **Texts**), and that choice is the event's own and always wins. The library is never read again for that slideshow: switching a text off or deleting it changes no slideshow that already has it.

A default slideshow that **already exists** does not get a line from the library afterwards. If you want one on an older slideshow, type it as a text in the slideshow editor. A stage changes only as described in step 3.

## Managing it

| You do this | What happens to events that already have a stage |
|---|---|
| Upload a stadium background to the library | Nothing changes. New default slideshows can pick it. An existing event can use it after **Draw the stage again** (if it has no pick of its own yet) or **Pick another**. |
| Switch off or delete a stadium background | A stage already drawn keeps its picture. When it is drawn again it no longer uses that one. |
| Add, switch off or delete a QR text | Nothing changes for any slideshow that exists. |
| An editor chooses, uploads or removes a stadium background on the event's card | That event's stage is drawn again at once. Nobody else's changes. |
| **Show nothing here** on the event's card, or all stadium backgrounds are switched off, then **Draw the stage again** | The stage goes back to the plain one, the very picture the event had before the library existed. The remembered pick is dropped. |

- **Existing events and the backfill.** The backfill card **Welcome page screens for existing events** (see [the giant screen](guides-tutorial-camera-giant-screen.md)) makes a default slideshow for events that have none, in the same way as for a new event. **So it picks a stadium background and a QR text from the libraries as they are at that moment.** If you want those events to start with them, fill the libraries first.
- **Asking again is safe.** The same stage gives the same picture, so pressing **Draw the stage again** when nothing changed writes nothing.
- **Nothing is deleted from an event** by any of this; the file of an old stage picture is not removed.

## Gotchas & good practice

- Check the result: open the **Default stage** card for the picture, open the giant screen once, and open the event's capture link on a phone to see the welcome page.
- A new general stadium background does not change an event that already has its stage. Press **Draw the stage again** (or **Pick another**) on the events that matter.
- Draw the stage again **before** the event, not while the screen is in use: open screens reload when it changes.
- A picture the system cannot fetch is skipped for the next one, and with none that can be fetched the plain stage is drawn. Nobody sees an error.
- Keep a QR text short and friendly; the line is scaled to the width of the QR code, so a long one becomes hard to read from a distance.

<a id="magyar-valtozat"></a>

## Magyar változat

### Mi ez, és miért jó?

Minden eseménynek van **alapértelmezett vetítése**, annak pedig **színpada**: a nagy kijelző fotói alatt látható kép. Benne van a sötét háttér, a QR-kód panelje, a leírt cím sávja és egy átlátszó ablak, ahol a fotók játszanak. A színpadot a rendszer rajzolja meg az esemény saját színeiben. A Camera app kezdőoldala ugyanezt a színpadot mutatja képként a Start gomb fölött.

Két opcionális könyvtár segít feldíszíteni:

1. **Stadionhátterek (Stadium backgrounds).** Stadionképek. Ha az eseménynek van használható, a színpad a sima éjszakai stadionrajz helyett ezen készül: a kép kitölti a színpadot, az esemény színei rákerülnek, a panelek és a fotóablak pedig föléje rajzolódnak.
2. **QR-szövegek (QR texts).** Rövid sorok, például „Scan & smile”. Az egyik a **QR-kód fölött** látszik az alapértelmezett vetítésen, olyan szélesen, mint maga a QR-kód.

Mindkettőt a globális adminok kezelik a **Libraries** menüben. A partner és az esemény is választhat vagy tölthet fel saját stadionhátteret, ugyanabban a panelben, mint a logó (alapértelmezett használata, választás, feltöltés, hozzáadás, csere, semmi).

**Addig nem változik semmi, amíg nem használod őket.** Mindkét könyvtár üresen indul, és ha üres, minden színpad és minden alapértelmezett vetítés pontosan olyan, mint eddig. Ha később kerül bele valami, **a már létező esemény megtartja a színpadát**, amíg a szerkesztője meg nem nyomja a **Draw the stage again** vagy a **Pick another** gombot, vagy át nem állítja a választást az esemény saját kártyáján. A rendszer a meglévő színpadot soha nem változtatja meg magától.

### Mit kell előtte tudni?

- Csak **kereskedelmi felhasználásra szabad** képek kerülnek a könyvtárba. Nincs bepipálandó négyzet: ha egy képpel gond van, kapcsold ki vagy töröld, és új színpadhoz többé nem használjuk.
- Egy **széles stadionkép** a legjobb. Kitölti a 16:9 színpadot és szükség szerint körbevágódik, az esemény színei rákerülnek, a panelek és a fotóablak fölé rajzolódnak, ezért mielőtt egy képre építesz, nézd meg az eredményt.
- A QR-szöveg **egy rövid sor, legfeljebb 40 karakter**, angolul vagy magyarul. A QR-kód szélességére méreteződik: a rövid sor nagy, a hosszú kicsi.
- A könyvtárak (**Libraries > Stadium backgrounds** és **Libraries > QR texts**) **globális adminoknak** valók. A partner menedzserek és az esemény szerkesztői a partner **Pictures** oldaláról és az esemény **Slideshows** oldaláról dolgoznak.

### Lépésről lépésre

**1. Az általános stadionhátterek (globális adminok).** Nyisd meg a **Libraries > Stadium backgrounds** oldalt. A lista megmondja, hány van, és hány aktív. **Upload a stadium background** (név és kép, PNG, JPEG, WebP vagy SVG, legfeljebb 4 MB). Minden kártyán: a **Switch off** törlés nélkül kivonja az új színpadok köréből, a **Switch on** visszahozza; a már megrajzolt színpad megtartja a képét, amíg egy szerkesztő újra nem rajzolja. A **Delete** magán a kártyán kérdez: *Delete it for good? Partners and events that chose it use the next one instead.* Nyomd meg a **Yes, delete it** vagy a **Cancel** gombot. Az aktívak minden partner alapértelmezettjei: a partner ezeket használja, amíg sajátot nem választ vagy tölt fel, az esemény pedig a partnerét. Az esemény saját választása mindig erősebb, utána a partneré, utána az általános.

**2. A partner sajátjai (partner menedzserek).** Nyisd meg a partnert, a **Pictures** oldalt és a **Stadium backgrounds** kártyát. A partner **használja az alapértelmezettet** (az általánosakat), a **Use this one** gombbal választ, az **Upload a new one** gombbal feltölt, vagy a **Show nothing here** gombbal semmit nem mutat; a **Use the default again** visszaáll. Minden kép megmondja, honnan jön. Ha több használatos, a színpadhoz véletlenszerűen az egyik kerül.

**3. Egy esemény színpada: a Default stage kártya.** Nyisd meg az eseményt, a **Slideshows** oldalt és a **Default stage** kártyát. Mutatja a mostani színpadot, hogy melyik stadionháttéren készült (vagy hogy simán, az esemény színeiben), és hogy hány stadiumhátteret használhat az esemény.

- A **Draw the stage again** azon rajzolja meg a színpadot, amit az esemény most használ. Megtartja az eseménynek korábban kisorsolt hátteret, amíg az még használható; különben véletlenszerűen választ; ha nincs használható, a sima színpad készül. Ha nem változna semmi, a kártya ezt írja: *The stage is already drawn on what the event uses: nothing changed.*
- A **Pick another** másik stadionhátteret vesz. Szürke, amíg az esemény nem használhat legalább kettőt.
- Alatta a **Stadium backgrounds** panel megegyezik a partnerével. **Ha ott választasz, feltöltesz, lecserélsz vagy eltávolítasz egy képet, a színpad egy lépésben újra elkészül.**

Ha a színpad változik, a kártya ezt írja: *The stage was drawn again. Screens that are open reload to show it.* A nyitott óriáskijelzők a következő képnél újratöltenek, mint a vetítés bármely mentése után (lásd az [óriáskijelző útmutatóját](guides-tutorial-camera-giant-screen.md)), ezért **ne nyomd meg gól ünneplése közben**. Ha az eseménynek már van kezdőoldali képernyőképe, az ezután újra elkészül; akinek nincs, annak nem készül.

**A szerkesztő által választott színpadkép érintetlen marad.** Ha a vetítés színpada a vetítésszerkesztőben kiválasztott kép (az MTK x Vasas tervezői képe ilyen), a kártya ezt írja: *This slideshow has a stage picture of its own (chosen in the slideshow editor), so a stadium background does not apply to it. Nothing here changes it.*

**4. Az általános QR-szövegek (globális adminok).** Nyisd meg a **Libraries > QR texts** oldalt. A lista: *In the library (N, M active)*. Az **Add a QR text** alatt írd be a **Text** mezőbe a szöveget (legfeljebb 40 karakter, például *Scan & smile*), válaszd ki a **Language** mezőben a nyelvet (English vagy Magyar (Hungarian)), és nyomd meg az **Add the text** gombot. Minden sor mutatja a nyelvét és azt, hogy **Active** vagy **Switched off**. A **Switch off** / **Switch on**: a kikapcsolt szöveget új eseményhez már nem választjuk, de az az esemény, amelyik már megkapta, megtartja. A **Delete** a soron kérdez: *Delete it for good? Events that have it keep it on their stage.* Nyomd meg a **Yes, delete it** vagy a **Cancel** gombot. A könyvtár legfeljebb 200 szöveget tart. Adj hozzá többet: minél több van, annál inkább különböznek az események.

**5. Mit kap az új esemény, és hogyan változtat rajta a szerkesztő.** Amikor egy esemény alapértelmezett vetítése **elkészül** (új esemény, vagy a **Create the default slideshow** az esemény Slideshows oldalán), a rendszer: (1) kisorsol **egy aktív QR-szöveget az esemény nyelvén** (ha ezen a nyelven nincs, angolt), **egyszer**, és a vetítésbe második szövegként teszi **a QR-kód fölé**; a leírt cím a fotóablak alatt marad; ha nincs QR-szöveg a könyvtárban, csak a leírt cím van, mint eddig. (2) Kisorsol egyet az eseménynek használható stadionhátterek közül, **egyszer**, és azon rajzolja a színpadot; ha nincs, a sima színpad készül.

Ezután **a sor a vetítés közönséges szövege**: a szerkesztő a vetítésszerkesztőben (**Screen design**, **Texts**) megváltoztatja vagy törli, és ez az esemény saját döntése, ami mindig érvényes. A könyvtárat ennél a vetítésnél többé nem olvassuk: egy szöveg kikapcsolása vagy törlése nem változtat meg egyetlen meglévő vetítést sem. A **már létező** alapértelmezett vetítés utólag nem kap sort a könyvtárból; ha egy régebbi vetítésre kell, írd be szövegként a vetítésszerkesztőben. A színpad csak a 3. lépésben leírt módon változik.

### Kezelés

- **Új stadionháttér feltöltése:** semmi sem változik; az új alapértelmezett vetítések választhatják. A meglévő esemény a **Draw the stage again** (ha még nincs saját kisorsolt háttere) vagy a **Pick another** után használhatja.
- **Stadionháttér kikapcsolása vagy törlése:** a már megrajzolt színpad megtartja a képét; újrarajzoláskor már nem ezt használja.
- **QR-szöveg hozzáadása, kikapcsolása, törlése:** egyetlen meglévő vetítésen sem változik semmi.
- **A sima színpadhoz való visszatérés:** az esemény kártyáján a **Show nothing here**, vagy az összes stadionháttér kikapcsolása, majd **Draw the stage again**: a színpad pontosan azt a képet kapja vissza, ami a könyvtár előtt volt, és a megjegyzett választás törlődik.
- **A meglévő események és a pótlás.** A **Welcome page screens for existing events** kártya (lásd az [óriáskijelző útmutatóját](guides-tutorial-camera-giant-screen.md)) alapértelmezett vetítést készít azoknak az eseményeknek, amelyeknek nincs, ugyanúgy, mint egy új eseménynek. **Ezért a könyvtárak akkori állapotából stadionhátteret és QR-szöveget is választ.** Ha azt szeretnéd, hogy ezek az események ezekkel induljanak, előbb töltsd fel a könyvtárakat.
- Az újrakérés biztonságos: ugyanaz a színpad ugyanazt a képet adja, ezért a **Draw the stage again** semmit nem ír, ha nem változott semmi. Semmi sem törlődik az eseményből; a régi színpadkép fájlját nem távolítjuk el.

### Jó tudni

- Nézd meg az eredményt: a **Default stage** kártyán a képet, egyszer az óriáskijelzőt, és az esemény fotózó linkjét telefonon a kezdőoldalért.
- Az új általános stadionháttér nem változtatja meg azt az eseményt, amelynek már van színpada. A fontos eseményeknél nyomd meg a **Draw the stage again** vagy a **Pick another** gombot.
- A színpadot az esemény **előtt** rajzold újra, ne használat közben: a nyitott kijelzők újratöltenek, amikor változik.
- A képet, amelyet a rendszer nem tud letölteni, a következőre cseréli, és ha egyet sem tud letölteni, a sima színpad készül. Hibát senki nem lát.
- A QR-szöveg legyen rövid és barátságos: a sor a QR-kód szélességére méreteződik, a hosszú messziről nehezen olvasható.
