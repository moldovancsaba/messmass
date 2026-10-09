# Tutorial: Frame slots, composing the frame of an event (camera app)
Status: Active
Last Updated: 2026-10-09T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ 5128f75 (camera#502)

> Audience: The people who set up an event in the Camera app (editors, designers) · Prerequisites: The event exists in the Camera app, your e-mail address has the **Manager** role for its partner, and the pictures you want to use are in the event's Images (or you upload them on the way) · Related: [Layouts, messages and the dark area](guides-tutorial-camera-layouts-messages.md), [The event gallery](guides-tutorial-camera-event-gallery.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

The frame that goes over the users' photos can be **composed from up to twelve optional slots**: at each of **six positions** (top left, top centre, top right, bottom left, bottom centre, bottom right) there can be a **text** and a **picture**. Every slot is optional. The **default frame** is four slots: the team names top left (team 1 over team 2), the fan supporter message bottom centre, the partner logo top right, and the generated message background (the coloured bar) bottom centre. You change a slot, add one, or switch one off, and look at the result before you save.

The slots are about the **generated frame** of the event. A frame you uploaded to the library and chose for a message (see Layouts, messages and the dark area) is used as it is: it wins over the slots for that message.

## Before you start

1. Open the event in the Camera app admin and its **Frames** page: the panel is **Frame slots**, under the generated frame and above the selection settings.
2. Have the pictures ready as **PNG, JPEG or WebP**. A **bar** (a picture at the top or bottom centre) is drawn **full width of the frame at its own shape**: a strip made 1920 pixels wide lands at its natural size on the very edge. A taller picture is shrunk to at most **30 %** of the frame height. A **corner picture** fits a box of 15 % of the frame (you can change the size) and keeps its shape; a transparent PNG is best.
3. The frame is a **landscape 1920 × 1080** picture; the photo of the user is cut to its shape.

## Step by step

### 1. Look at what the event has

An event that has never used slots shows the **four slots of the default frame**. The cards, one for each position, say in a line what is in them. The preview beside them is the frame drawn by the same code that draws the real images.

### 2. The text of a position

Choose the **Text** of a card:

- **Team 1 over team 2**: the two teams, one above the other (the event name split at "x", "vs" or a dash when the teams are not known);
- **Team 1**, **Team 2**: one team;
- **Event title**: the name of the event;
- **Fan supporter message**: the message the user has (picked from the event's message list on the Messages panel above, random or chosen by the user);
- **Own text**: your words, up to 120 characters (a hashtag, a slogan).

Optional **Text colour** as `#rrggbb`; empty means the heading colour of the event's messmass style. The teams, the title and the fan message can each be in **one** place only; an own text can be used as often as you like. A corner text wraps to its box and becomes smaller down to a smallest size; if it still does not fit it is **cut with three dots** and the preview says so: shorten it. A text in a **centre** position is **one line**.

### 3. The picture of a position

Choose the **Picture** of a card. In a **corner**: the **partner logo**, or **a picture**. At the **top or bottom centre** (a bar across the frame): the **generated message background** (the coloured bar of the messmass style, with its thin line), or **a picture**.

With **a picture**, choose it from the event's images, or upload it right there (**Choose from the library**, **Upload here**). A corner picture has a **Size** (percent of the frame, 5 to 40, empty means 15).

### 4. Several pictures and which message uses which

A picture slot can hold **up to six pictures** (**Add another picture**). Then a list shows **which picture each message uses**: choose picture 2 for the messages that should have the pink strip, leave the others on picture 1. A message with no choice uses the first picture. One image is drawn for each message, so this costs no more than a single picture.

### 5. How the slots lie on the frame

- **Pictures first, texts on top.** A **text in a centre position lies in the bar of its edge** when that edge has a bar (so the message is written in the bottom strip).
- A **top text or picture moves below a bar on the top edge**; a **bottom text or picture moves above a bar on the bottom edge**.
- Slots at **different positions may overlap** (a hashtag on a bar can be meant); the preview then says "Worth a look" and names them. A text on the picture of **its own position** is by design.
- The dark areas the users see in the live view (where the frame will cover the photo) follow the slots.

### 6. Preview and save

The preview is drawn a moment after your last change; choose **With the message** to see another message on it. Nothing is stored until you press **Save the slots and draw the images**: the images of the event are drawn (a few seconds), the notice says how many were drawn and how many reused. **Back to the default frame** removes the slots. If the images cannot be drawn (a picture cannot be fetched, say), the notice says the **slots are saved but the images are not**: press the button again; the images the event had stay as they were until it works.

## Defaults for a partner and for everybody

Slots can also be set as a **default**, so that events do not have to be set up one by one:

- **For a partner:** at the end of the partner's **Frames** page, the section **Default frame slots**. Every event of the partner follows it.
- **For everybody:** **Settings, Frame slots** (global admins). Every event follows it until its partner has a default or the event has slots of its own.

The order is always **the event's own slots, else the partner's default, else the general default, else the default frame** (four slots). **Nothing is copied** into the events: a change of a default is read by every event that follows it, and it never touches the slots an event set itself. On the event's own page you see what it follows ("This event follows its partner's default slots"); change a slot there to make slots of its own, and **Use the default again** takes them away. Slots you save on an event that are exactly what it follows are stored as none, so it keeps following.

When you save a default, the images of the events that follow it are **drawn again one after another** (the editor shows which one, and says which event could not be redrawn; open that event's Frames page and save the messages to draw it). An event with no images yet reads the default when its images are first drawn. The preview of a default is drawn on a real event of the partner (the most recently changed one), so the messages and names are real; with no event it is drawn on a made-up one. Pictures of a default are chosen from the partner's (or the general) images. A frame you uploaded and chose for a message still wins over slots for that message.

## Example: the MTK x Vasas pink month frame

With the club's files (1920 × 100 strips, the crest, the ribbon):

1. Upload the files to the event's **Images** (or from the picker in the panel).
2. **Top centre**: Picture, **A picture**: the strip with the crest, "#pinkmonth" and the seyu logo.
3. **Top left**: Text, **Team 1 over team 2** (it sits just below the top strip). **Top right**: Picture, **Partner logo**.
4. **Bottom right**: Picture, **A picture**: the ribbon, Size 20.
5. **Bottom centre**: Text, **Fan supporter message**; Picture, **A picture**: the empty blue strip and the empty pink strip; choose the **pink strip for the pink-month messages** ("MTK SZÍV!", "MINDEN NŐ SZÁMÍT!").
6. Look at the preview with each message, then **Save the slots and draw the images**.

## Managing it

- A change of a **message** on the Messages panel above redraws its image; the pictures chosen for a message go with the message text, so a message you remove takes its choice with it.
- At most **40 images** per event (one for each message on each design).
- The frame follows the **messmass style** (fonts and colours) when it changes; your slots stay.

## Gotchas & good practice

- Look at the preview with the **longest** message and the **longest** team names.
- A bar picture taller than 30 % of the frame is shrunk, and then does not reach the sides.
- A text colour that is the same as the bar's colour is not visible: the preview shows it.
- The slots do not reach a **frame you uploaded** and chose for a message: that frame is drawn as it is.
- Check the capture flow once **on a phone** with the new frame before the event.

<a id="magyar-valtozat"></a>

## Magyar változat

### Frame slotok: az esemény keretének összeállítása (camera alkalmazás)

A felhasználók fotójára kerülő keret **legfeljebb tizenkét, választható „slotból” állítható össze**: **hat helyen** (bal fent, középen fent, jobb fent, bal lent, középen lent, jobb lent) lehet egy **szöveg** és egy **kép**. Minden slot elhagyható. Az **alap keret** négy slot: a csapatok neve bal fent (az 1. csapat a 2. fölött), a szurkolói üzenet középen lent, a partner logója jobb fent és a generált üzenet-háttér (a színes sáv) középen lent. A slotot módosíthatod, hozzáadhatsz vagy kikapcsolhatsz, és mentés előtt megnézed az eredményt.

A slotok az esemény **generált keretére** vonatkoznak. Az a könyvtári keret, amelyet egy üzenethez kiválasztottál (lásd: Elrendezések, üzenetek és a sötét terület), **úgy marad, ahogy van**: arra az üzenetre az előnyben van a slotokkal szemben.

**Előkészületek**

1. Nyisd meg az eseményt és a **Frames** oldalát: a **Frame slots** panel a generált keret alatt és a kiválasztási beállítások fölött van.
2. Készítsd elő a képeket **PNG, JPEG vagy WebP** formátumban. A **sáv** (kép fent vagy lent középen) **a keret teljes szélességében, a saját arányával** rajzolódik: egy 1920 pixel széles csík természetes méretben, a szélre simul. Egy magasabb kép a keret magasságának legfeljebb **30 %-ára** zsugorodik. A **sarokkép** a keret 15 %-os dobozába illeszkedik (a méret állítható), az arányát megtartja; átlátszó PNG a legjobb.
3. A keret **fekvő 1920 × 1080**; a felhasználó fotója erre az alakra van vágva.

**Lépések**

1. **Nézd meg, mi van az eseményen.** Ha még nem használt slotokat, az alap keret **négy slotját** mutatja. Minden helyhez egy kártya tartozik, amely egy sorban megmondja, mi van benne; mellette az előnézet, amelyet ugyanaz a kód rajzol, mint a valódi képeket.
2. **A hely szövege.** Válaszd ki a kártya **Text** mezőjét: **Team 1 over team 2** (két csapat egymás alatt), **Team 1**, **Team 2**, **Event title** (az esemény neve), **Fan supporter message** (a felhasználó üzenete a Messages panel listájából), **Own text** (saját szöveg, legfeljebb 120 karakter, pl. hashtag). Választható **Text colour** `#rrggbb` formában; üres: a messmass stílus címszíne. A csapatok, a cím és a szurkolói üzenet **egy helyen** szerepelhet; a saját szöveg annyiszor, ahányszor kell. A sarokszöveg a dobozához törik, és egy legkisebb méretig kisebb lesz; ha így sem fér el, **három ponttal levágódik**, és az előnézet jelzi. A **középső** helyen a szöveg **egy sor**.
3. **A hely képe.** Sarokban: **partner logo** vagy **A picture** (egy kép). Fent vagy lent középen (a keretet átérő sáv): **Generated message background** (a messmass stílus színes sávja a vékony vonallal) vagy **A picture**. A képet az esemény képei közül választod, vagy ott helyben feltöltöd. A sarokképnek van **Size** értéke (a keret százalékában, 5–40, üresen 15).
4. **Több kép és melyik üzenet melyiket használja.** Egy képslotba **legfeljebb hat kép** kerülhet (**Add another picture**). Ekkor egy lista mutatja, **melyik üzenet melyik képet használja**: a rózsaszín csíkot kapó üzeneteknél válaszd a 2. képet, a többi maradjon az 1.-en. Választás nélkül az első kép érvényes. Minden üzenethez egy kép készül, ezért ez nem jelent többletet.
5. **Hogyan fekszenek a slotok.** Előbb a képek, rajtuk a szövegek. Ha egy szélen van sáv, a **középső szöveg a sávban** van (így az üzenet az alsó csíkba kerül). A **felső szöveg vagy kép a felső sáv alá**, az **alsó az alsó sáv fölé** kerül. A **különböző helyeken lévő slotok átfedhetik egymást** (egy hashtag lehet a sávon); ilyenkor az előnézet „Worth a look” felirattal jelzi. A felhasználók élő nézetében látszó sötét területek követik a slotokat.
6. **Előnézet és mentés.** Az előnézet az utolsó módosítás után egy pillanattal rajzolódik; a **With the message** mezővel másik üzenettel is megnézheted. Addig semmi sem tárolódik, amíg meg nem nyomod a **Save the slots and draw the images** gombot: ekkor az esemény képei elkészülnek (néhány másodperc), és az értesítés megmondja, hány készült és hány maradt meg. A **Back to the default frame** gomb törli a slotokat. Ha a képeket nem sikerül elkészíteni (például egy képet nem lehet letölteni), az értesítés azt mondja, hogy **a slotok mentődtek, de a képek nem**: nyomd meg újra a gombot; az eseménynek addig a korábbi képei maradnak.

**Alapértelmezés partnerhez és mindenkihez.** A slotok **alapértelmezésként** is beállíthatók, hogy ne kelljen eseményenként beállítani: **partnerhez** a partner **Frames** oldalának végén, a **Default frame slots** részben; **mindenkihez** a **Settings, Frame slots** oldalon (globális adminoknak). A sorrend mindig: **az esemény saját slotjai, különben a partner alapértelmezése, különben az általános alapértelmezés, különben az alap keret** (négy slot). **Semmi sem másolódik** az eseményekre: az alapértelmezés módosítását minden követő esemény olvassa, és soha nem érinti az esemény saját slotjait. Az esemény oldalán látod, mit követ („This event follows its partner's default slots”); egy slot módosításával saját slotokat készítesz, a **Use the default again** gomb visszaadja a követést. Az alapértelmezés mentésekor a követő események képei **egymás után újrarajzolódnak** (a szerkesztő mutatja, melyik épp, és jelzi, ha egy eseményt nem sikerült; nyisd meg annak a Frames oldalát, és mentsd az üzeneteket). Az előnézet egy valódi eseményen készül (a partner legutóbb módosított eseményén). Az üzenethez választott feltöltött keret a slotokkal szemben továbbra is előnyben van.

**Példa: az MTK x Vasas rózsaszín hónap kerete.** A klub fájljaival (1920 × 100 csíkok, a címer, a szalag): töltsd fel a fájlokat az esemény **Images** részébe. **Top centre**: Picture, A picture: a címeres, „#pinkmonth”-os, seyu logós csík. **Top left**: Text, Team 1 over team 2. **Top right**: Picture, Partner logo. **Bottom right**: Picture, A picture: a szalag, Size 20. **Bottom centre**: Text, Fan supporter message; Picture, A picture: az üres kék és az üres rózsaszín csík, a **rózsaszín csíkot a rózsaszín hónap üzeneteihez** ("MTK SZÍV!", "MINDEN NŐ SZÁMÍT!") rendeld. Nézd meg az előnézetet minden üzenettel, majd **Save the slots and draw the images**.

**Jó tudni**

- Egy üzenet módosítása a Messages panelen újrarajzolja a képét; az üzenethez választott képek az üzenet szövegével együtt mennek, ezért a törölt üzenet választása is törlődik.
- Eseményenként legfeljebb **40 kép** (minden üzenet minden elrendezésen egy).
- A keret követi a **messmass stílust** (betűk, színek), ha az változik; a slotjaid megmaradnak.
- A leghosszabb üzenettel és a leghosszabb csapatnévvel nézd meg az előnézetet. A sáv színével megegyező szövegszín nem látszik. A **feltöltött keretre**, amelyet egy üzenethez választottál, a slotok nem hatnak.
- Az esemény előtt próbáld ki a felvételi folyamatot **telefonon** az új kerettel.
