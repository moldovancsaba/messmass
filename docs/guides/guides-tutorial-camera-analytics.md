# Tutorial: The Analytics view of an event (camera app)
Status: Active
Last Updated: 2026-10-12T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ c40aad85 (camera#521, phase 1: the numbers of the existing data; phase 2: the Journey tab and its anonymous recording); the decline reasons from the list and the vetting words @ a991758c (camera#628, camera pull request 629, not merged yet)

> Audience: The people who run an event in the Camera app (event managers, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner (or you are a global admin) · Related: [Approving photos at an event](guides-tutorial-approving-photos.md) · Magyar változat: [lent / below](#magyar-valtozat)

## What it is & why it matters

The **Analytics** view of an event says what the data **that already exists** says: how many photos were taken, approved and declined, how fast they were decided and by whom, how many different users came, which devices and frames they used, what the people in the photos look like (the marks of the reviewers), what the screens played, which links and QR codes were opened, which e-mails were sent and which consents were given. Everything on it except the **Journey** tab only reads data that already exists and records nothing new. The **Journey** tab (how many users opened the capture link, where they got to, how many saved a photo) comes from an **anonymous recording of the capture pages**, described under "The journey recording" below.

## Where to find it

1. **One event:** open the event in the Camera app admin and choose **Analytics** in its menu (event managers and global admins).
2. **All events together** (global admins): **Analytics** in the Operations menu: the same numbers over every event, with one row per event; the name of an event opens that event's Analytics.

The old **Try-On Analytics** report is gone with the try-on integration; its old address now leads to the Operations **Analytics** (all events).

## What you see

The tabs are **Overview** (the key figures, photos per day and per hour of the day, and the list **Not measured yet**), **Journey** (one event only: visits, the steps reached, photos saved, camera permission, retakes, consent left, shares and downloads), **Photos and users** (different users, signed in or gave an e-mail, devices, frames, messages and layouts chosen), **Vetting and people** (waiting, approved, declined, time to the first decision, who decided, why photos were declined (the reasons the reviewer chose from the list, and the words written beside them), and the people marked: gender, age, emotion, items and who marked how many photos), **Screens** (plays and photos shown), **Sources** (visits by link, phone kind and day; one event only), **E-mails and consent** (the e-mails by type and the consents by their exact wording, including the public gallery permission), and for global admins on one event **Messmass** (a read-only preview of the counters that could be sent to messmass).

**The filters:** choose the **days** (both the first and the last day are included) and the **clock** (Budapest or UTC; Budapest is the default for a Hungarian event). The tab, the days and the clock are in the address, so you can send the report as a link. **Download CSV** gives every figure of every tab (`section, item, value`) for the same days and clock.

## Managing it

- **A figure that is not counted yet is never shown as a zero.** The list **Not measured yet** says what is missing and why: country and city, plays per hour or per screen, sign-ins by provider, e-mail opens and clicks, and which QR code or poster a photo came from.
- **The numbers for messmass are prepared and switched off.** The Messmass tab shows what would be sent (counters only, never a person, and including the journey counters once there is a recording); nothing is sent to messmass until the owner decides.
- **Time to the first decision** counts from the moment the photo was saved to the first decision of an approver; a later change of mind does not count again.
- **The people and the decline reasons use the event's vetting words.** The lists are in the words the event's vetting screen offers (see [Approving photos at an event](guides-tutorial-approving-photos.md), "The words on the screen"). An option that was hidden or deleted later still counts, and a photo declined before the list of reasons existed has no reason from the list (the panel says how many).
- **Very large events** can take a moment to load, because every photo of the event is read once.

### The journey recording

The **Journey** tab is filled by an **anonymous record of the steps users take** through the capture pages of the event. For each step the page sends only a fixed name (for example *consent shown*, *camera refused*, *photo saved*), how many milliseconds after the page opened, and the kind of device in one word (iPhone or iPad, Android, desktop). It **never** records an IP address, a cookie, a device string, a name, an e-mail address, a photo or the address of a page, and a visit is not a person: a user who opens the link twice is two visits.

- **How long it is kept.** The single records are removed after **30 days**; the daily counts, which are numbers about no person, are kept.
- **From when.** Only from the day the recording started. Before that nothing exists and cannot be added afterwards. An event with no record shows **Nothing recorded for this event yet**, never zeros; the tab fills when the first user opens the capture page of the event after the recording was released.
- **The switch.** The top of the tab says whether the recording is on for every event. A **global admin** can switch it off and on there (the button asks first); off, the capture pages send nothing and the server writes nothing, within about half a minute, and what was recorded stays.
- **Days are UTC days** on this tab, and the days chosen on the page are read as UTC days there. The recording is built never to slow or block the capture: a record that fails is simply lost, and the user does not notice.
- **What the figures mean.** **Visits** are loads of the capture page (a return from a Google or Facebook sign-in is not a new visit); **Saved a photo** counts the visits that saved at least one photo; **Camera denied** counts only the live camera of a **desktop** (a phone takes the photo with its own camera app and asks nothing on the page); **Consent left** is the consent shown and not accepted, for the consent page and for the box on the Who-are-you page separately; **Shares**, **photo page views** and **Downloads** come from the buttons and the public photo page after the photo was saved.

## Gotchas & good practice

- The Analytics view reads the data; it never changes a photo or a setting (the one switch is the recording's, on the Journey tab, for global admins).
- Photos removed from the event by an admin, and photos whose picture is gone, are not counted.
- Try-on results are not photos of this report, and the camera app has no try-on report any more.

<a id="magyar-valtozat"></a>

## Magyar változat

### Egy esemény Analytics nézete (camera alkalmazás)

Az esemény **Analytics** nézete azt mondja el, amit a **már meglévő adatok** mondanak: hány fotó készült, hányat hagytak jóvá és utasítottak el, milyen gyorsan és ki döntött, hány különböző felhasználó jött, milyen eszközöket és kereteket használtak, hogyan néznek ki a fotókon lévő emberek (a jóváhagyók jelölései), mit játszottak a képernyők, mely linkeket és QR-kódokat nyitották meg, mely e-maileket küldtük ki, és milyen hozzájárulásokat adtak. A **Journey** fül kivételével minden szám már meglévő adatokból készül, és semmi újat nem rögzít. A **Journey** fül (hányan nyitották meg a fotózó linket, meddig jutottak el, hányan mentettek fotót) a fotózó oldalak **névtelen rögzítéséből** épül fel, lásd lent, „Az útvonal rögzítése” alatt.

**Hol találod.** Egy eseménynél: nyisd meg az eseményt a camera admin felületen, és válaszd a menü **Analytics** pontját (esemény-menedzserek és globális adminok). Az összes eseményre együtt (globális adminoknak): az Operations menü **Analytics** pontja, eseményenként egy sorral; az esemény nevére kattintva annak az eseménynek az Analytics nézete nyílik meg. A régi **Try-On Analytics** jelentés a try-on integrációval együtt megszűnt; a régi címe az Operations **Analytics** (az összes esemény) oldalra vezet.

**Mit látsz.** A fülek: **Overview** (a fő számok, a fotók száma naponta és a nap óráiban, és a **Not measured yet** lista), **Journey** (csak egy eseménynél: látogatások, elért lépések, mentett fotók, kameraengedély, újrafotózások, a hozzájárulás elhagyása, megosztások és letöltések), **Photos and users** (különböző felhasználók, belépett vagy e-mailt adott meg, eszközök, választott keretek, üzenetek és elrendezések), **Vetting and people** (várakozó, jóváhagyott, elutasított, az első döntésig eltelt idő, ki döntött, miért utasítottak el fotókat (azok az indokok, amelyeket a jóváhagyó a listából választott, és a mellé írt szavak), és a megjelölt emberek: nem, kor, érzelem, kellékek, valamint hogy ki hány fotót jelölt meg), **Screens** (lejátszások és megjelent fotók), **Sources** (látogatások link, telefontípus és nap szerint; csak egy eseménynél), **E-mails and consent** (az e-mailek típus szerint és a hozzájárulások pontos szövegük szerint, a nyilvános galéria engedélyével együtt), globális adminoknak egy eseménynél pedig a **Messmass** (a messmassnak küldhető számlálók csak olvasható előnézete).

**A szűrők.** Válaszd ki a **napokat** (az első és az utolsó nap is benne van) és az **órát** (budapesti vagy UTC; magyar eseménynél a budapesti az alapértelmezett). A fül, a napok és az óra benne vannak a címben, ezért a jelentést linkként is elküldheted. A **Download CSV** az összes fül minden számát letölti (`section, item, value`) ugyanarra a időszakra és órára.

**Jó tudni**

- **Ami még nincs számolva, azt soha nem mutatjuk nullaként.** A **Not measured yet** lista megmondja, mi hiányzik és miért: az ország és a város, a lejátszások óránként vagy kijelzőnként, a belépések szolgáltató szerint, az e-mail megnyitások és kattintások, és hogy egy fotó melyik QR-kódból vagy plakátról jött.
- **A messmassnak szánt számok elő vannak készítve, de ki vannak kapcsolva.** A Messmass fül megmutatja, mi menne el (csak számlálók, soha nem személy, és ha van rögzítés, az útvonal számlálói is); a messmassnak semmi nem megy el, amíg a tulajdonos nem dönt.
- **Az első döntésig eltelt idő** a fotó mentésétől az első jóváhagyói döntésig tart; egy későbbi meggondolás nem számít újra.
- **Az emberek és az elutasítási indokok az esemény vetting szavait használják.** A listák azokkal a szavakkal készülnek, amelyeket az esemény vetting képernyője kínál (lásd: [Fotók jóváhagyása egy eseményen](guides-tutorial-approving-photos.md), „A képernyő szavai”). Egy később elrejtett vagy törölt lehetőség is tovább számít, a még az indoklista bevezetése előtt elutasított fotónak pedig nincs a listából választott indoka (a panel megmondja, hány ilyen van).
- **A nagyon nagy események** betöltése egy kis ideig tarthat, mert az esemény minden fotóját egyszer beolvassuk.
- A try-on eredmények nem tartoznak ennek a jelentésnek a fotói közé, és a camera alkalmazásnak már nincs try-on jelentése.

**Az útvonal rögzítése.** A **Journey** fület a fotózó oldalak lépéseinek **névtelen rögzítése** tölti fel. Egy lépésről az oldal csak egy rögzített nevet küld (például *hozzájárulás megjelent*, *kamera megtagadva*, *fotó mentve*), azt, hány ezredmásodperccel az oldal megnyitása után történt, és az eszköz fajtáját egy szóban (iPhone vagy iPad, Android, számítógép). **Soha** nem rögzít IP-címet, sütit, eszközleírást, nevet, e-mail-címet, fotót vagy oldalcímet, és egy látogatás nem személy: aki kétszer nyitja meg a linket, az két látogatás.

- **Meddig őrizzük.** Az egyes rekordokat **30 nap** után töröljük; a napi összesítések, amelyek senkiről nem szóló számok, megmaradnak.
- **Mikortól.** Csak a rögzítés kezdetének napjától. Előtte semmi nem létezik, és utólag sem pótolható. Egy eseménynél, amelyhez nincs rekord, a fül azt írja: **Nothing recorded for this event yet**, soha nem nullákat; a fül akkor telik meg, amikor a rögzítés kiadása után az első felhasználó megnyitja az esemény fotózó oldalát.
- **A kapcsoló.** A fül tetején látszik, hogy a rögzítés be van-e kapcsolva minden eseményre. Egy **globális admin** itt ki- és bekapcsolhatja (a gomb előbb rákérdez); kikapcsolva a fotózó oldalak nem küldenek semmit, a szerver nem ír semmit, nagyjából fél percen belül, és ami addig rögzült, megmarad.
- **A napok UTC-napok** ezen a fülön, és az oldalon választott napokat itt UTC-napként olvassa. A rögzítés úgy készült, hogy a fotózást soha ne lassítsa és ne akassza meg: ha egy rekord nem sikerül, egyszerűen elvész, és a felhasználó nem veszi észre.
- **Mit jelentenek a számok.** A **Visits** (látogatások) a fotózó oldal betöltései (a Google- vagy Facebook-belépésből való visszatérés nem új látogatás); a **Saved a photo** azokat a látogatásokat számolja, amelyek legalább egy fotót mentettek; a **Camera denied** csak a **számítógép** élő kameráját számolja (a telefon a saját kamera-alkalmazásával készíti a fotót, és az oldalon semmit nem kér); a **Consent left** a megjelent és el nem fogadott hozzájárulás, a hozzájárulás oldalra és a Ki vagy te? oldali négyzetre külön; a **Shares**, a nyilvános fotóoldal megtekintései és a **Downloads** a fotó mentése utáni gombokból és a nyilvános fotóoldalról jönnek.
