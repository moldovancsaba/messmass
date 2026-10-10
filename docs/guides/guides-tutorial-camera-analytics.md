# Tutorial: The Analytics view of an event (camera app)
Status: Active
Last Updated: 2026-10-10T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ eb9a9ce0 (camera#521, phase 1)

> Audience: The people who run an event in the Camera app (event managers, operators) · Prerequisites: The event exists in the Camera app, and your e-mail address has the **Manager** role for its partner (or you are a global admin) · Related: [Approving photos at an event](guides-tutorial-approving-photos.md) · Magyar változat: [lent / below](#magyar-valtozat)

## What it is & why it matters

The **Analytics** view of an event says what the data **that already exists** says: how many photos were taken, approved and declined, how fast they were decided and by whom, how many different users came, which devices and frames they used, what the people in the photos look like (the marks of the reviewers), what the screens played, which links and QR codes were opened, which e-mails were sent and which consents were given. Nothing new is recorded for it and nothing about how photos are taken or shown changed.

## Where to find it

1. **One event:** open the event in the Camera app admin and choose **Analytics** in its menu (event managers and global admins).
2. **All events together** (global admins): **Analytics** in the Operations menu: the same numbers over every event, with one row per event; the name of an event opens that event's Analytics.

## What you see

The tabs are **Overview** (the key figures, photos per day and per hour of the day, and the list **Not measured yet**), **Photos and users** (different users, signed in or gave an e-mail, devices, frames, messages and layouts chosen), **Vetting and people** (waiting, approved, declined, time to the first decision, who decided, the decline reasons as written, and the people marked: who, age, emotion, merchandise), **Screens** (plays and photos shown), **Sources** (visits by link, phone kind and day; one event only), **E-mails and consent** (the e-mails by type and the consents by their exact wording, including the public gallery permission), and for global admins on one event **Messmass** (a read-only preview of the counters that could be sent to messmass).

**The filters:** choose the **days** (both the first and the last day are included) and the **clock** (Budapest or UTC; Budapest is the default for a Hungarian event). The tab, the days and the clock are in the address, so you can send the report as a link. **Download CSV** gives every figure of every tab (`section, item, value`) for the same days and clock.

## Managing it

- **A figure that is not counted yet is never shown as a zero.** The list **Not measured yet** says what is missing and why: the journey (how many opened it, finished it, refused the camera, retook, left the consent), the shares and downloads of the photo link, the counts per decline reason (the reason is free text today), country and city, e-mail opens and clicks, and which QR code or poster a photo came from.
- **The numbers for messmass are prepared and switched off.** The Messmass tab shows what would be sent (counters only, never a person); nothing is sent to messmass until the owner decides.
- **Time to the first decision** counts from the moment the photo was saved to the first decision of an approver; a later change of mind does not count again.
- **Very large events** can take a moment to load, because every photo of the event is read once.

## Gotchas & good practice

- The Analytics view reads the data; it never changes a photo or a setting.
- Photos removed from the event by an admin, and photos whose picture is gone, are not counted.
- The numbers of the try-on report are gone with the try-on: the camera app has no try-on any more.

<a id="magyar-valtozat"></a>

## Magyar változat

### Egy esemény Analytics nézete (camera alkalmazás)

Az esemény **Analytics** nézete azt mondja el, amit a **már meglévő adatok** mondanak: hány fotó készült, hányat hagytak jóvá és utasítottak el, milyen gyorsan és ki döntött, hány különböző felhasználó jött, milyen eszközöket és kereteket használtak, hogyan néznek ki a fotókon lévő emberek (a jóváhagyók jelölései), mit játszottak a képernyők, mely linkeket és QR-kódokat nyitották meg, mely e-maileket küldtük ki, és milyen hozzájárulásokat adtak. Semmi új adat nem keletkezik hozzá, és semmi nem változott abban, ahogy a fotók készülnek vagy megjelennek.

**Hol találod.** Egy eseménynél: nyisd meg az eseményt a camera admin felületen, és válaszd a menü **Analytics** pontját (esemény-menedzserek és globális adminok). Az összes eseményre együtt (globális adminoknak): az Operations menü **Analytics** pontja, eseményenként egy sorral; az esemény nevére kattintva annak az eseménynek az Analytics nézete nyílik meg.

**Mit látsz.** A fülek: **Overview** (a fő számok, a fotók száma naponta és a nap óráiban, és a **Not measured yet** lista), **Photos and users** (különböző felhasználók, belépett vagy e-mailt adott meg, eszközök, választott keretek, üzenetek és elrendezések), **Vetting and people** (várakozó, jóváhagyott, elutasított, az első döntésig eltelt idő, ki döntött, az elutasítás indokai úgy, ahogy megírták, és a megjelölt emberek: ki, kor, érzelem, kellék), **Screens** (lejátszások és megjelent fotók), **Sources** (látogatások link, telefontípus és nap szerint; csak egy eseménynél), **E-mails and consent** (az e-mailek típus szerint és a hozzájárulások pontos szövegük szerint, a nyilvános galéria engedélyével együtt), globális adminoknak egy eseménynél pedig a **Messmass** (a messmassnak küldhető számlálók csak olvasható előnézete).

**A szűrők.** Válaszd ki a **napokat** (az első és az utolsó nap is benne van) és az **órát** (budapesti vagy UTC; magyar eseménynél a budapesti az alapértelmezett). A fül, a napok és az óra benne vannak a címben, ezért a jelentést linkként is elküldheted. A **Download CSV** az összes fül minden számát letölti (`section, item, value`) ugyanarra a időszakra és órára.

**Jó tudni**

- **Ami még nincs számolva, azt soha nem mutatjuk nullaként.** A **Not measured yet** lista megmondja, mi hiányzik és miért: az útvonal (hányan nyitották meg, fejezték be, tagadták meg a kamerát, csináltak újat, hagyták ott a hozzájárulást), a fotólink megosztásai és letöltései, az elutasítási indokok szerinti darabszám (az indok ma szabad szöveg), az ország és a város, az e-mail megnyitások és kattintások, és hogy egy fotó melyik QR-kódból vagy plakátról jött.
- **A messmassnak szánt számok elő vannak készítve, de ki vannak kapcsolva.** A Messmass fül megmutatja, mi menne el (csak számlálók, soha nem személy); a messmassnak semmi nem megy el, amíg a tulajdonos nem dönt.
- **Az első döntésig eltelt idő** a fotó mentésétől az első jóváhagyói döntésig tart; egy későbbi meggondolás nem számít újra.
- **A nagyon nagy események** betöltése egy kis ideig tarthat, mert az esemény minden fotóját egyszer beolvassuk.
- **A try-on jelentés számai** a try-onnal együtt megszűntek: a camera alkalmazásnak már nincs try-on része.
