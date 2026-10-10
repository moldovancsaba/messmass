# Tutorial: Which camera the photo page uses (camera app)
Status: Active
Last Updated: 2026-10-10T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code (camera#547)

> Audience: The people who set up a partner or an event in the Camera app (editors, operators) · Prerequisites: Your e-mail address has the **Manager** role for the partner (or you are a global admin) · Related: [The order of the pages, and Take photo + Submit](guides-tutorial-camera-journey-order.md) · [Camera app integration](guides-tutorial-camera-app.md) · Magyar változat: [lent / below](#magyar-valtozat)

## What it is & why it matters

The photo page can take the photo in four ways. **You choose which one an event uses**, once for a partner (all its events follow it) and per event (an event can follow its partner or choose for itself):

1. **Automatic** (the standard). A phone opens its **own camera app** and gives the largest, best picture it can. A computer shows the live camera.
2. **The live camera with view buttons.** The page shows the live camera with four buttons on top: **Portrait | Landscape** and **Wide | Tight**. The user chooses the shape and how close the picture is before pressing the shutter. This is the page's own way to offer the views of the newest iPhones' front camera.
3. **The live camera, a real photo from the camera's sensor.** The page shows the live camera (no view buttons) and the shutter takes the sensor's own photo, usually larger than what is on the screen. A browser that cannot do it keeps the picture on the screen.
4. **The live camera, the picture as shown on the screen.** The live camera (no view buttons) and the shutter keeps the picture that is on the screen: the older way, and the way back if another way gives trouble on some phone.

**Nothing changes for any event until you choose something.**

## Step by step

### 1. For all events of a partner

1. Open the partner in the Camera app admin and press **Edit**.
2. In the section **Camera of the events** choose the way in the list **Camera**, and press save.

Every event of that partner that has made no choice of its own now uses it. **Automatic** is the default.

### 2. For one event

1. Open the event and press **Edit**; in **Customization** find the choice **Camera**.
2. Choose **Same as the partner** (it shows in brackets what that gives now) or one of the four ways, and save.

The event's own choice wins over the partner's. Choose **Same as the partner** again to follow it.

## Managing it

- **Try it before you tick it.** Add `?views=1` to the event's capture link to see the live camera with the view buttons on a phone without changing anything for anybody (`?capture=still` or `?capture=frame` tries the other two live ways the same way).
- **A computer** always shows a live view; the view buttons appear there only when the event uses the live camera with view buttons.
- **The live view is the raw camera picture**, so in low light it can look darker than the phone's own camera app's picture, which the phone processes.

## Gotchas & good practice

- Do not change the camera on the day of an event without testing the capture link on the phones that will be used.
- A partner's choice is only a default: an event that chose its own way keeps it.

<a id="magyar-valtozat"></a>

## Magyar változat

### Melyik kamerát használja a fotóoldal (camera alkalmazás)

Annak szól, aki partnert vagy eseményt állít be a camera alkalmazásban. A fotóoldal négyféleképpen készítheti a fotót. **Te választod ki, melyiket használja egy esemény**, egyszer egy partnerre (az összes eseménye követi) és eseményenként is (az esemény követheti a partnerét, vagy dönthet maga):

1. **Automatikus** (alapértelmezett). A telefon megnyitja a **saját kamera-alkalmazását**, és a lehető legnagyobb, legjobb képet adja. Számítógépen az oldal az élő kamerát mutatja.
2. **Az élő kamera nézetgombokkal.** Az oldal az élő kamerát mutatja, felül négy gombbal: **Álló | Fekvő** és **Széles | Közeli**. A felhasználó a gombnyomás előtt kiválasztja a kép alakját és azt, milyen közel legyen. Ez az oldal saját módja a legújabb iPhone-ok előlapi kamerája nézeteinek felajánlására.
3. **Az élő kamera, valódi fotó a kamera érzékelőjéből.** Az oldal az élő kamerát mutatja (nézetgombok nélkül), és a zár a kamera érzékelőjének saját fotóját készíti el, ami általában nagyobb, mint ami a képernyőn látszik. Ahol a böngésző ezt nem tudja, a képernyőn látható kép marad.
4. **Az élő kamera, a képernyőn látható kép.** Az élő kamera (nézetgombok nélkül), és a zár a képernyőn látható képet tartja meg: a régebbi mód, és a visszaút, ha egy másik mód gondot okoz valamelyik telefonon.

**Amíg nem választasz, egyetlen esemény sem változik.**

**Egy partner összes eseményére.** Nyisd meg a partnert a camera admin felületen, nyomd meg az **Edit** gombot, és a **Camera of the events** szekcióban válaszd ki a módot a **Camera** listában, majd mentsd. Minden olyan esemény, amelyik nem választott magának, mostantól ezt használja. Az **Automatic** az alapértelmezett.

**Egy eseményre.** Nyisd meg az eseményt, nyomd meg az **Edit** gombot, és a **Customization** részben keresd a **Camera** választót. Válaszd a **Same as the partner** (zárójelben megmutatja, mit ad most) vagy a négy mód egyikét, és mentsd. Az esemény saját választása erősebb a partnerénél; a **Same as the partner** újbóli kiválasztásával újra követi a partnert.

**Jó tudni**

- **Próbáld ki, mielőtt kiválasztod.** Írd az esemény fotózó linkje után: `?views=1`, és telefonon láthatod az élő kamerát a nézetgombokkal anélkül, hogy bárkinek bármi változna (a `?capture=still` vagy `?capture=frame` ugyanígy próbálja ki a másik két élő módot).
- **Számítógépen** mindig élő kép van; a nézetgombok csak akkor jelennek meg, ha az esemény az élő kamerát használja nézetgombokkal.
- **Az élő kép a nyers kameraképet mutatja**, ezért gyenge fényben sötétebb lehet, mint a telefon saját kamera-alkalmazásának képe, amelyet a telefon feldolgoz.
- **Ne változtass kamerát az esemény napján**, mielőtt a fotózó linket a használt telefonokon kipróbáltad.
