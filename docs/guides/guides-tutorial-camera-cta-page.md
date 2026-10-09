# Tutorial: The CTA page with a picture (camera app)
Status: Active
Last Updated: 2026-10-09T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ 2bc1aee (camera#491, camera#490)

> Audience: The people who set up an event in the Camera app (editors, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner · Related: [Layouts, messages and the dark area](guides-tutorial-camera-layouts-messages.md), [The giant screen](guides-tutorial-camera-giant-screen.md), [Camera app integration](guides-tutorial-camera-app.md)

## What it is & why it matters

A **CTA page** (call to action) is a page of the user's journey that sends them somewhere: a club shop, a loyalty sign-up, a campaign. It can be a plain card with a title and a button, or a **picture page**: one picture over the whole screen, which can carry its own message. This guide is about the picture page.

## Before you start

1. Open the event in the Camera app admin and its pages editor, and add or open a **CTA** page.
2. Have the picture ready (PNG, JPEG, WebP or SVG). Design it knowing that the **whole picture is shown**: it is **fitted to the screen with its shape kept**, on the event's page colour, so on a phone held upright a wide picture is a band in the middle with colour above and below it. A picture made for the phone's shape (tall) fills it.

## Step by step

### 1. Choose the picture and the address

In **Picture page (optional)** choose the **Background picture** (from the event's pictures, or upload one). Set **URL to visit** above it: where the page leads.

### 2. Decide what is written over the picture

- **Hide the title and the text**: the picture shows alone (with its buttons). A screen reader still reads the title, so give it a plain title.
- **The whole picture is a link to the URL**: a tap anywhere on the picture goes to the address, like a big button. Use it when the picture already has its own "Join" button drawn on it.
- **Hide the buttons**: the visit button and the continue button go. This only works when the picture is the link, or when this is the last page (**Show Continue Button** off). Otherwise the buttons stay, so nobody is stuck on the page.

With nothing written over it, the picture is shown without the dark veil that makes writing readable.

### 3. What a tap does

On a page that is **not the last one**, a tap on a picture whose buttons are hidden opens the address in a **new tab and goes on to the next page** (there is no continue button to press). On the **last page** it goes to the address in the **same tab**. With the buttons shown, the visit button opens the address in a new tab and the continue button goes on, as before.

## Managing it

- A page with **no address** has no visit button and no link.
- The button colours (**Button colour**, **Button label colour**, **Button ring colour**) are for the round buttons that are written over the picture.
- Check the page **on a phone**, upright and sideways, before the event.

## Gotchas & good practice

- A page made before 2026-10-09 used to crop its picture to fill the phone; it now shows the whole picture. If an old picture was designed to be cropped, make a version for the phone's shape.
- All pages of the journey (welcome, who are you, CTA, restart) cannot be pinch-zoomed, like an app; the consent page can, because it is a text to read.

<a id="magyar-valtozat"></a>

## Magyar változat

### A CTA-oldal képpel (camera alkalmazás)

A **CTA-oldal** (felhívás cselekvésre) a felhasználó útjának egy oldala, amely valahová továbbküldi: klubshopba, hűségprogramba, kampányoldalra. Lehet egyszerű kártya címmel és gombbal, vagy **képes oldal**: egy kép az egész képernyőn, amely a saját üzenetét is hordozhatja. Ez az útmutató a képes oldalról szól.

**Lépések**

1. Az esemény oldalszerkesztőjében adj hozzá vagy nyiss meg egy **CTA** oldalt. A képet úgy tervezd, hogy **az egész kép látszik**: a kép **a képernyőhöz illesztve, az arányát megtartva** jelenik meg az esemény háttérszínén, tehát álló telefonon egy széles kép a közepén egy sáv, fölötte és alatta színnel; egy a telefon alakjára (álló) tervezett kép kitölti.
2. A **Picture page (optional)** részben válaszd ki a **Background picture** képet, és add meg a **URL to visit** címet, ahová az oldal vezet.
3. Döntsd el, mi legyen a kép fölé írva:
   - **Hide the title and the text**: csak a kép látszik (a gombokkal). A képernyőolvasó a címet továbbra is felolvassa, ezért adj neki egyszerű címet.
   - **The whole picture is a link to the URL**: a kép bármely pontjára koppintva a címre jutsz, mint egy nagy gombra. Akkor használd, ha a képre már rá van rajzolva a „Csatlakozom” gomb.
   - **Hide the buttons**: a megnyitás és a tovább gomb eltűnik. Csak akkor működik, ha a kép a link, vagy ez az utolsó oldal (**Show Continue Button** kikapcsolva); különben a gombok maradnak, hogy senki ne ragadjon az oldalon.
4. **Mit csinál a koppintás?** Ha az oldal **nem az utolsó**, és a gombok el vannak rejtve, a koppintás **új lapon megnyitja a címet, és a következő oldalra lép**. Az **utolsó oldalon** ugyanabban a lapon a címre visz. Látható gombokkal a megnyitás gomb új lapon nyitja a címet, a tovább gomb lép tovább, mint eddig.

**Jó tudni**

- Cím nélküli oldalnak nincs megnyitás gombja és linkje.
- Ha semmi nincs a kép fölé írva, a kép a sötét fátyol nélkül látszik.
- A 2026-10-09 előtt készült oldal levágta a képet a telefon kitöltéséhez; most az egész képet mutatja. Ha egy régi kép levágásra volt tervezve, készíts változatot a telefon alakjára.
- Az út minden oldala (üdvözlő, ki vagy, CTA, újrakezdés) alkalmazásként nem nagyítható csippentéssel; a hozzájárulási oldal igen, mert az olvasnivaló szöveg.
- Rendezvény előtt nézd meg az oldalt **telefonon**, álló és fekvő helyzetben is.
