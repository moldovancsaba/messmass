# Tutorial: Which camera the photo page uses (camera app)
Status: Active
Last Updated: 2026-10-10T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code (camera#547)

> Audience: The people who set up a partner or an event in the Camera app (editors, operators) · Prerequisites: Your e-mail address has the **Manager** role for the partner (or you are a global admin) · Related: [The order of the pages, and Take photo + Submit](guides-tutorial-camera-journey-order.md) · [Camera app integration](guides-tutorial-camera-app.md) · Magyar változat: [lent / below](#magyar-valtozat)

## What it is & why it matters

The photo page can take the photo in two ways:

1. **The phone's own camera app** (the standard). The phone opens its own camera and gives the largest, best picture it can. On a computer the page shows a live view instead.
2. **The live camera with view buttons.** The page shows the live camera with four buttons on top: **Portrait | Landscape** and **Wide | Tight**. The user chooses the shape and how close the picture is before pressing the shutter. The picture the phone's own camera app takes in a square-sensor mode cannot be chosen from a page, so these buttons are the page's own way to offer the same four views.

You choose the way **once for a partner** (all its events follow it) and **per event** (an event can follow its partner or choose for itself). **Nothing changes for any event until you tick or choose something.**

## Step by step

### 1. For all events of a partner

1. Open the partner in the Camera app admin and press **Edit**.
2. In the section **Camera of the events** tick **Use the live camera with view buttons**, and press save.

Every event of that partner that has made no choice of its own now uses the live camera. Unticked (the default) means the phone's own camera app.

### 2. For one event

1. Open the event and press **Edit**; in **Customization** find the choice **Camera**.
2. Choose **Same as the partner** (it shows in brackets what that gives now), **The phone's own camera app (standard)** or **The live camera with view buttons**, and save.

The event's own choice wins over the partner's. Choose **Same as the partner** again to follow it.

## Managing it

- **Try it before you tick it.** Add `?views=1` to the event's capture link to see the live camera with the view buttons on a phone without changing anything for anybody.
- **A computer** always shows a live view; the view buttons appear there only when the event uses the live camera.
- **The live view is the raw camera picture**, so in low light it can look darker than the phone's own camera app's picture, which the phone processes.

## Gotchas & good practice

- Do not change the camera on the day of an event without testing the capture link on the phones that will be used.
- A partner's tick is only a default: an event that chose **The phone's own camera app** keeps it.

<a id="magyar-valtozat"></a>

## Magyar változat

### Melyik kamerát használja a fotóoldal (camera alkalmazás)

Annak szól, aki partnert vagy eseményt állít be a camera alkalmazásban. A fotóoldal kétféleképpen készítheti a fotót:

1. **A telefon saját kamera-alkalmazása** (alapértelmezett). A telefon megnyitja a saját kameráját, és a lehető legnagyobb, legjobb képet adja. Számítógépen az oldal élő képet mutat.
2. **Az élő kamera nézetgombokkal.** Az oldal az élő kamerát mutatja, felül négy gombbal: **Álló | Fekvő** és **Széles | Közeli**. A felhasználó a gombnyomás előtt kiválasztja a kép alakját és azt, milyen közel legyen. A telefon saját kamerájának négyzet alakú módjait egy oldal nem tudja kiválasztani, ezért ezek a gombok az oldal saját módja ugyanennek a négy nézetnek a felajánlására.

Az utat **egyszer egy partnerre** (az összes eseménye követi) és **eseményenként** is megadhatod (az esemény követheti a partnerét, vagy dönthet maga). **Amíg nem pipálsz vagy választasz, egyetlen esemény sem változik.**

**Egy partner összes eseményére.** Nyisd meg a partnert a camera admin felületen, nyomd meg az **Edit** gombot, és a **Camera of the events** szekcióban pipáld be a **Use the live camera with view buttons** négyzetet, majd mentsd. Minden olyan esemény, amelyik nem választott magának, mostantól az élő kamerát használja. A pipa nélküli (alapértelmezett) állapot a telefon saját kamera-alkalmazását jelenti.

**Egy eseményre.** Nyisd meg az eseményt, nyomd meg az **Edit** gombot, és a **Customization** részben keresd a **Camera** választót. Válaszd a **Same as the partner** (zárójelben megmutatja, mit ad most), a **The phone's own camera app (standard)** vagy a **The live camera with view buttons** lehetőséget, és mentsd. Az esemény saját választása erősebb a partnerénél; a **Same as the partner** újbóli kiválasztásával újra követi a partnert.

**Jó tudni**

- **Próbáld ki, mielőtt bepipálod.** Írd az esemény fotózó linkje után: `?views=1`, és telefonon láthatod az élő kamerát a nézetgombokkal anélkül, hogy bárkinek bármi változna.
- **Számítógépen** mindig élő kép van; a nézetgombok csak akkor jelennek meg, ha az esemény az élő kamerát használja.
- **Az élő kép a nyers kameraképet mutatja**, ezért gyenge fényben sötétebb lehet, mint a telefon saját kamera-alkalmazásának képe, amelyet a telefon feldolgoz.
- **Ne változtass kamerát az esemény napján**, mielőtt a fotózó linket a használt telefonokon kipróbáltad.
