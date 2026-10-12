# Tutorial: Approving photos at an event (camera app)
Status: Active
Last Updated: 2026-10-12T00:00:00.000Z
Canonical: Yes
Owner: Documentation
Verified against the Camera app code @ a991758c (camera#628, camera pull request 629, not merged yet: one photo at a time on one screen, the vetting words at three levels; this guide describes the screen as it will be after that merge); the lists of cards and the access @ 75c595b (camera#373)

> Audience: The person who approves photos live at an event, and the operators who give them access and set the words of the vetting screen · Prerequisites: The event exists in the Camera app with photo approval switched on, and your e-mail address has the **Manager** role for Events on the event's partner · Related: [Camera app integration](guides-tutorial-camera-app.md) · [Events](guides-tutorial-events.md) · [Partners](guides-tutorial-partners.md) · [Authentication, roles & SSO](guides-tutorial-authentication-sso.md) · [The Analytics view of an event](guides-tutorial-camera-analytics.md) · Magyar változat: [lent / below](#magyar-valtozat)

## What it is & why it matters

At events where **photo approval** is switched on, a photo taken in the Camera app is not shown to anyone until a person approves it. The person who took it sees "Thank you! Your photo is waiting for approval" and gets an e-mail with the link to the finished photo (the photo in its frame) as soon as it is approved. So at a live event, the speed of the approver decides how long people wait.

This guide is for the **approver**: the member of the event's staff who decides, photo by photo, what goes out. It also tells the operator who sets the access up what to check, and who can change the words of the vetting screen. Approval happens in the Camera app's admin, not in messmass, on the event's **Vetting** tab. The photos come **one at a time, on one screen**: on the same screen you say who is in the photo, and that feeds the event's analytics.

A **Manager** (or a global admin) can approve and reject. A **Viewer** can open the event but cannot decide.

## Before the event

Do this once, at least a day before.

1. **Give the approver access (operator).** In the Camera app's admin open the partner of the event, find the **Partner User Access** panel, and add the approver's e-mail address with the app **Events** and the role **Manager**.
2. **Sign in (approver).** Open the Camera app admin (`/admin` on the Camera app's address) and sign in with that e-mail address, through the same single sign-on the other seyu tools use.
3. **Find the tab.** Open **Events**, choose the event, then the **Vetting** tab. (The event menu also has Overview, Edit and pages, **Vetting words**, Gallery, Analytics and the other editors; an approver only needs Vetting. There is no Queue tab: the photos wait on the Vetting tab, in the list **Waiting**.)
4. **Look at the words (operator, if the standard ones do not fit).** The choices on the screen and the reasons for a rejection come from a list of words that a partner or an event can change (see "The words on the screen" below). Change them before the event: a screen that is already open shows new words only the next time it loads.

The Vetting tab opens on **Waiting** and shows the first waiting photo straight away. At the top you should see three lists, each with a count: **Waiting**, **Rejected**, **Approved**.

If you cannot find the event, or the Vetting tab sends you back to the event overview, the account does not have the Manager role for that partner yet: ask the operator.

> Note: Rehearse once on a throw-away event under the same partner (not linked to messmass), with a test photo and an e-mail address you can read. Delete the test event afterwards. Do not rehearse on a live event: an approved test photo is a real photo.

## At the event

Keep the Vetting tab open on **Waiting**. It opens the **oldest waiting photo** straight away, one photo at a time, as big as your window allows. The screen looks for new photos by itself every 10 seconds, only while the page is on screen and never while a decision is being saved. If it ever looks stuck, reload the page. With nothing waiting it says **Nothing is waiting**.

At the top it says, for example, **Photo 3 of 12 waiting**, and, when there is one, the e-mail address of the person who took the photo. The photo is on the left. Beside it (under it on a phone or in a narrow window) is the panel: **People in this photo**, the choices for the selected person, **Nobody in this photo**, and at the bottom the buttons **Approve**, **Reject** and **Skip for now**, which stay in view while you work. There are no steps and no pages: you draw, choose and decide on the same screen. The buttons carry plain words, no pictures; they are the words of the event's list (see "The words on the screen"), so your event may show others than the ones below.

### Marking the people, then deciding

With marking on (it is on for every event; a global admin can switch it off for one event, see "Marking switched off"), do this for every photo:

1. **Draw a rectangle around a person.** Press on the photo, drag and let go (a mouse or a finger). The person is added to the list **People in this photo** as **Person 1**, **Person 2**, ... and is selected; its rectangle on the photo carries the same number and a colour. A tap, or a very small drag, makes nothing; a tap inside a rectangle selects that person. At most 40 people can be marked in one photo.
2. **Choose the gender and the age** of the selected person (both are needed): press one button under **Gender, as the person looks in the photo** and one under **Age, as the person looks in the photo**. The rectangle of a person who still misses one is dashed, and the list says what is missing, in red (**needs gender and age**).
3. **If you can, add the emotion and the items.** Under **How the person looks (optional)** one choice is possible; press it again to clear it. Under **What the person wears or holds (optional)** as many as apply. If you are not sure about someone, leave the emotion empty, choose the closest age and, if the list has it, **Not sure** for the gender.
4. **Next person.** Draw the next rectangle: it is added and selected. To change someone, press their row in the list, or tap their rectangle. **Remove person** takes the selected one away.
5. **Nobody there?** Press **Nobody in this photo**. It is only possible while no rectangle is drawn, and drawing one switches it off again. If you remove the last person, press it again.
6. **Decide.** The line above the buttons says what is still missing ("Draw a rectangle around each person, or choose Nobody in this photo.", "2 people need gender and age."). **Approve** opens when every person has gender and age, or **Nobody in this photo** is pressed.

| You want to | Do this | What happens |
| --- | --- | --- |
| Approve the photo | Mark the people (or press **Nobody in this photo**), then press **Approve** | The people are saved with the photo, the photo is approved, and the next waiting photo opens. The person gets an e-mail with the link to their finished photo. |
| Reject the photo | Mark the people the same way, press **Reject**, choose at least one reason under **Why is it rejected? Choose one or more.**, write a note if you want to (**Note (optional)**), then press **Confirm reject** (or **Cancel**) | The next waiting photo opens. The person gets a short note by e-mail and can take another photo. The photo stays private. The reasons and the note are kept for your records and the analytics and are not sent to the person. |
| Leave a photo for later | Press **Skip for now** | The photo goes to the back of the waiting photos and comes round again. It does not work when only one photo is waiting. |

A rejected photo is marked too, exactly like an approved one: the analytics count the people in every photo that was looked at. If the people cannot be saved, the photo is not approved or rejected, and a red message says so: press the button again.

Approve by default and reject only what you would not want next to the organiser's name. The organiser sets the rules, so agree them before the event, including which reasons the list should offer.

**What the person sees while they wait:** "Thank you! Your photo is waiting for approval. We will email you the link as soon as it is approved." (in the language of the event).

Drawing needs a mouse or a finger. There is no keyboard way to draw a rectangle yet.

### Marking switched off for an event

A global admin can switch marking off for one event (on the Vetting tab, under the photos: **Marking the people is on for this event**, button **Turn marking off**). The screen is then only the photo, the reasons and the decision: no list of people and no drawing, **Approve** is open at once, and **Reject** still needs a reason. The line at the top says "Look at the photo, then approve or reject it. A rejection needs a reason."

### The list of cards (Show the list), Rejected and Approved

**Show the list** (at the right end of the line with the three lists) gives the waiting photos as cards instead; **Back to one at a time** returns. **Rejected** and **Approved** are always lists of cards. A card has the picture, the name of the person, the e-mail address, when it was taken (**Taken**), which frame it will get (**Frame**: **Generated frame**, **Own frame** or **No frame**), **Wall** (whether the person agreed to be shown), and, once decided, who decided. A rejected card also says **Why**, with the reasons.

With marking on, a **Waiting** card has one button, **Review**. It opens that photo big, on a page of its own (**Vetting / Review**), the same screen as above; the other waiting photos follow, oldest first. There is no quick **Approve** or **Reject**, no checkbox and no **Approve selected**, and the server refuses a first decision that skips the marking. The **Rejected** list keeps its **Approve** (a photo rejected before can be approved again, without new marking). An event with marking switched off keeps the quick buttons:

| You want to | Do this | What happens |
| --- | --- | --- |
| Approve one photo | Press **Approve** on the card | The card leaves the list. The person gets an e-mail with the link to their finished photo. |
| Reject one photo | Press **Reject**, choose at least one reason, write a note if you want to, then **Confirm reject** (or **Cancel**) | The person gets a short note by e-mail and can take another photo. The photo stays private. The reasons and the note are kept for your records and are not sent. |
| Approve many | Tick the cards, or press **Select all**, then **Approve selected** | The button shows how far it is ("Approving 3 of 20…"). It works through the photos two at a time, so leave the page open until it says **Approve selected** again. |
| Change a decision | Open **Rejected** and press **Approve** | A rejected photo can still be approved. An approved photo cannot be taken back on this page, so look before you press **Approve**. |

The list of cards looks for new photos by itself every 10 seconds too, and it pauses while you are deciding or choosing the reasons of a rejection.

## The words on the screen (Vetting words)

The choices you press (gender, age, emotion, items) and the reasons for a rejection are a **list of words**, not fixed buttons. The list can be set at three levels, with the same editor on each (the editor is in English; the words you set are shown as you wrote them):

| Level | Where | Who |
| --- | --- | --- |
| **General**: every partner and event | **Settings > Vetting words** | Global admins |
| **Partner**: all its events | The partner's menu, **Vetting words** | A Manager of the partner, or a global admin |
| **Event**: this event | The event's menu, **Vetting words** (next to Vetting) | A Manager of the event's partner, or a global admin |

The nearest level wins: the event's choice beats the partner's, which beats the general one, and the standard list lies under all of them. A level stores only what it changes; everything else follows the level above, so a change at the general level reaches every event that has not changed that option itself.

For each group (**Gender**, **Age**, **Emotion**, **Items**, **Reason**) the editor lists every option and where its words come from (Standard, General, Partner, Event, Added here). You can:

- **hide or show** an option (**Offered** or **Hidden**);
- **change its words** (1 to 60 characters, plain text: no emoji, no `<` or `>`);
- **move it Up or Down**: this is the order on the screen;
- **add your own option**: write its words under **Add an option to ...** and press **Add option** (for example "Club scarf");
- **delete** an option you added: it is only hidden, never erased (**Show deleted**, then **Restore**);
- **Follow the level above**: drops this level's change.

Then press **Save** (or **Discard the changes**). A vetting screen that is already open shows the new words the next time it loads.

What does not change:

- The standard options can be hidden and given other words, never deleted.
- Every option has a **key** that never changes meaning. The editor shows the counter name of each option under its words (for example `camera_gender_female`). A photo stores the key, not the words. So **hiding or deleting an option never touches the photos that have it**: they keep their marks and still count. A new wording shows on old photos too, so change the words, not the meaning.
- **Gender**, **Age** and **Reason** must keep at least one option offered ("At least one option of Gender must stay offered."). If a group still ends up with nothing offered for an event, the screen says "No gender is offered for this event, so a person cannot be completed. Ask an admin to switch one on." (and "No reasons are offered for this event, so a photo cannot be rejected here. Ask an admin to switch one on.").

The **standard list** (what an event has when nobody changed anything):

| Group | Needed | Standard options |
| --- | --- | --- |
| **Gender** | One, for every person | Female, Male, Not sure |
| **Age** | One, for every person | Child (about 0 to 12), Young (about 13 to 24), Adult (about 25 to 59), Senior (about 60 and over) |
| **Emotion** | No, one | Happy, Neutral, Sad, Angry, Unamused. Off until switched on: Excited, cheering; Surprised |
| **Items** | No, several | Jersey or shirt, Scarf, Cap or hat, Flag. Off until switched on: Face paint, Banner or sign |
| **Reason** | At least one, to reject | Offensive hand gesture, Nudity or sexual content, Alcohol, Other forbidden content, Violence or weapons, Hate symbol or offensive text, Drugs or smoking, Competitor or unwanted brand, Political message, Unusable: blurry, dark or no face, Test, spam or not a selfie, Other (write it in the note) |

"Not sure" and "Neutral" are real choices: a blank means "not marked", never "neutral".

## What the marks are for

Each mark is saved with the photo: the people with their rectangles, the options chosen, who marked and when, and which version of the list of words was in use, so marks made with different lists can be told apart. They are used for:

- **Counts.** The card **People marked in the photos** under the photos on the Vetting tab and the **Vetting and people** tab of the event's Analytics (see [The Analytics view of an event](guides-tutorial-camera-analytics.md)), and the counters for messmass. A counter is named `camera_`, the group and the key: `camera_gender_female`, `camera_age_kid`, `camera_emotion_happy`, `camera_merch_scarf`, and for the reasons of rejections `camera_rejected_nudity`. Each one is a **running total over all annotated photos of the event** (approved, rejected or still waiting), never a day's change. **No average is ever sent**, only totals and counts, because reports that add events together would add an average up too: an average is made in a messmass formula, for example people per image is `camera_people_total` divided by `camera_images_annotated`, and the average time to decide is `camera_vetting_seconds_total` divided by `camera_images_decided`. The counters are sent to messmass only when the owner switches the push on; it is **off today**, so nothing is sent yet.
- **Later, examples for software.** The photos and their marks are kept so that software could one day learn to do the marking itself. Nothing is exported for that today, and what may be used is for legal to decide.

## Managing it

- **Nobody can approve for a while.** Nothing is lost. The photos wait, and people keep seeing the waiting message. Only a global admin can switch approval off for the event (the setting on the Vetting tab).
- **Counts.** The three lists show how many photos are waiting, rejected and approved. **Approved** lists are view-only.
- **Who can do what.** Approving and rejecting needs the Manager role for the event's partner (or a global admin). The settings that switch approval, and marking the people, on or off for an event are for global admins only. Who can change the vetting words is in the table above.

## Gotchas & good practice

- **A red message says the photo was not approved or rejected, or that the people could not be saved.** The photo stays on the screen (or the card stays in the list). Press the button again; if it fails again, tell the operator what the message says.
- **An e-mail could not be sent.** The photo is decided, but the person did not get the e-mail. The one-photo screen says so in an orange line after the decision (for example "Photo approved, but the e-mail with the link to the user could not be sent."); on the list of cards a message says it too. If someone says no e-mail arrived, tell the operator the time and the e-mail address you saw at the top of the photo.
- **The message says "No answer arrived from the server".** The decision may have gone through anyway. Reload the page, which shows what the server holds now, and check **Approved** and **Rejected** before you try again.
- **A choice is missing.** If the screen says no gender, age or reason is offered, or a word you need is not on the list, ask the operator to change the vetting words of the event or the partner.
- **The page asks you to sign in again.** Sign in with the same e-mail address and open the Vetting tab again.
- **Rehearse and keep a second approver.** One person with a phone battery is a single point of failure.

<a id="magyar-valtozat"></a>

## Magyar változat

### Fotók jóváhagyása egy eseményen (camera alkalmazás)

Annak szól, aki egy eseményen élőben jóváhagyja a fotókat. Telefon vagy laptop kell hozzá, internettel. Nem kell semmit telepíteni.

**Az esemény előtt (egyszer, legalább egy nappal korábban)**

1. Az operátor az esemény partnerének oldalán, a **Partner User Access** panelen felveszi az e-mail-címedet az **Events** alkalmazáshoz **Manager** (menedzser) szereppel.
2. Nyisd meg a camera alkalmazás admin felületét (`/admin`), és jelentkezz be ezzel az e-mail-címmel.
3. Nyisd meg az **Events** menüt, válaszd ki az eseményt, majd a **Vetting** fület.
4. (Az operátornak, ha a standard szavak nem megfelelőek.) A képernyő választási lehetőségei és az elutasítás okai egy szólistából jönnek, amelyet a partner vagy az esemény megváltoztathat (lásd lent: „A képernyő szavai”). Az esemény előtt változtass: egy már megnyitott képernyő az új szavakat csak legközelebb betöltéskor mutatja.

A Vetting fül a **Waiting** listán nyílik, és rögtön megmutatja az első várakozó fotót. Felül három listát kell látnod, mindegyik mellett egy számmal (az oldal feliratai angolok): **Waiting** (várakozik), **Rejected** (elutasított), **Approved** (jóváhagyott). Ha nem találod az eseményt, vagy a Vetting fül visszadob az esemény áttekintőjére, akkor a fiókodnak még nincs Manager szerepe: szólj az operátornak.

**Az eseményen**

A Vetting fület tartsd nyitva a **Waiting** listán. A legrégebbi várakozó fotót nyitja meg rögtön, egyesével, akkorában, amekkorát az ablak enged. A képernyő 10 másodpercenként magától megnézi, jött-e új fotó, de csak amíg az oldal látszik, és soha nem akkor, amikor éppen egy döntést mentesz. Ha valaha elakadni látszik, töltsd újra az oldalt. Ha nem vár fotó, azt írja: **Nothing is waiting**.

Felül például ez áll: **Photo 3 of 12 waiting** (a 12 várakozó fotóból a 3.), mellette, ha van, a fotós e-mail-címe. A fotó balra van; mellette (telefonon vagy keskeny ablakban alatta) a panel: **People in this photo** (az emberek a fotón), a kijelölt személy választási lehetőségei, a **Nobody in this photo** gomb, legalul pedig az **Approve**, a **Reject** és a **Skip for now** gomb, amelyek munka közben is látszanak. Nincsenek lépések és külön oldalak: rajzolsz, választasz és döntesz ugyanazon a képernyőn. A gombokon sima szöveg van, képek nélkül; ezek az esemény szólistájának szavai (lásd „A képernyő szavai”), ezért az eseményeden mások is lehetnek, mint lent.

**Az emberek megjelölése, aztán a döntés**

Bekapcsolt jelölésnél (minden eseményen be van kapcsolva; egy globális admin egy eseményre kikapcsolhatja, lásd „Kikapcsolt jelölés”) minden fotónál ezt tedd:

1. **Rajzolj egy téglalapot egy személy köré.** Nyomd le a fotón, húzd, és engedd el (egérrel vagy ujjal). A személy felkerül a **People in this photo** listára (**Person 1**, **Person 2**, ...), és ki van jelölve; a téglalapja a fotón ugyanazt a számot és egy színt kap. Egy koppintás vagy egy nagyon kicsi húzás nem csinál semmit; ha egy téglalapba koppintasz, azt a személyt jelölöd ki. Egy fotón legfeljebb 40 ember jelölhető meg.
2. **Válaszd ki a nemet és a kort** a kijelölt személynek (mindkettő kell): nyomj meg egy gombot a **Gender, as the person looks in the photo** (a nem, ahogy a fotón látszik) alatt, és egyet az **Age, as the person looks in the photo** (a kor, ahogy a fotón látszik) alatt. Annak a téglalapja, akinek még hiányzik valamelyik, szaggatott vonalú, és a lista pirosan írja, mi hiányzik (**needs gender and age**).
3. **Ha tudod, add meg az érzelmet és a kellékeket.** A **How the person looks (optional)** alatt egy választás lehet; újra megnyomva törlődik. A **What the person wears or holds (optional)** alatt annyi, amennyi igaz. Ha nem vagy biztos valakiben, hagyd üresen az érzelmet, válaszd a legközelebbi kort, a nemnél pedig, ha a lista kínálja, a **Not sure** gombot.
4. **Következő személy.** Rajzold meg a következő téglalapot: felkerül, és ki van jelölve. Ha valakin változtatni akarsz, nyomd meg a sorát a listán, vagy koppints a téglalapjára. A **Remove person** a kijelöltet leveszi.
5. **Senki sincs a fotón?** Nyomd meg a **Nobody in this photo** gombot. Csak akkor lehet, ha nincs megrajzolt téglalap, és ha rajzolsz egyet, kikapcsol. Ha az utolsó személyt is levetted, nyomd meg újra.
6. **Dönts.** A gombok fölötti sor megmondja, mi hiányzik még (például: „2 people need gender and age.”). Az **Approve** akkor nyílik meg, ha mindenkinek van neme és kora, vagy megnyomtad a **Nobody in this photo** gombot.

- **Approve (jóváhagyás):** jelöld meg az embereket (vagy nyomd meg a **Nobody in this photo** gombot), majd nyomd meg az **Approve** gombot. Az emberek mentődnek a fotóval, a fotó jóvá van hagyva, és megnyílik a következő várakozó fotó. A fotós e-mailben megkapja a linket a kész fotójához.
- **Reject (elutasítás):** jelöld meg az embereket ugyanígy, nyomd meg a **Reject** gombot, válassz legalább egy okot a **Why is it rejected? Choose one or more.** alatt, ha szeretnél, írj megjegyzést (**Note (optional)**), majd nyomd meg a **Confirm reject** gombot (vagy a **Cancel** gombot). Megnyílik a következő fotó. A fotós rövid értesítést kap e-mailben, a fotó pedig privát marad. Készíthet másikat. Az okok és a megjegyzés a saját nyilvántartásodnak és az elemzésnek szólnak, nem mennek ki a fotósnak.
- **Későbbre hagyás:** a **Skip for now** a fotót a várakozók végére teszi, és újra előjön. Ha csak egy fotó vár, nem működik.

Az elutasított fotót is meg kell jelölni, pontosan úgy, mint a jóváhagyottat: az elemzés minden megnézett fotó embereit számolja. Ha az emberek mentése nem sikerül, a fotót nem hagyja jóvá és nem utasítja el, és egy piros üzenet ezt jelzi: nyomd meg újra a gombot.

Alapból hagyd jóvá, és csak azt utasítsd el, amit nem szeretnél a szervező neve mellett látni. A szabályokat a szervező határozza meg, ezért az esemény előtt egyeztesd vele, azt is, hogy a lista mely okokat kínálja.

**Mit lát a fotós, amíg vár:** „Köszönjük! A fotód jóváhagyásra vár. Amint jóváhagyták, e-mailben elküldjük neked a linkjét.” (az esemény nyelvén).

A rajzoláshoz egér vagy ujj kell. Téglalapot billentyűzettel még nem lehet rajzolni.

**Kikapcsolt jelölés.** Egy globális admin egy eseményre kikapcsolhatja a jelölést (a Vetting fülön, a fotók alatt: **Marking the people is on for this event**, gomb: **Turn marking off**). A képernyő ilyenkor csak a fotó, az okok és a döntés: nincs emberlista és nincs rajzolás, az **Approve** azonnal nyitva van, a **Reject** pedig továbbra is okot kér. A felső sor ezt írja: „Look at the photo, then approve or reject it. A rejection needs a reason.”

**A kártyák listája (Show the list), a Rejected és az Approved**

A **Show the list** (a három listát tartalmazó sor jobb szélén) a várakozó fotókat kártyákként mutatja; a **Back to one at a time** visszavisz az egyesével nézethez. A **Rejected** és az **Approved** mindig kártyalista. Egy kártyán: a fotó, a név, az e-mail-cím, a **Taken** (mikor készült), a **Frame** (milyen keretet kap: **Generated frame**, **Own frame** vagy **No frame**), a **Wall** (hozzájárult-e a fotós a megjelenéséhez), döntés után pedig az is, hogy ki döntött. Az elutasított kártyán ott van a **Why** is, az okokkal.

Bekapcsolt jelölésnél a **Waiting** kártyákon egyetlen gomb van, a **Review**: ez az adott fotót nyitja meg nagyban, külön oldalon (**Vetting / Review**), ugyanazon a képernyőn, mint fent; a többi várakozó fotó utána következik, a legrégebbitől. Nincs gyors **Approve** vagy **Reject**, nincsenek jelölőnégyzetek és **Approve selected**, a szerver pedig elutasítja a jelölést kihagyó első döntést. A **Rejected** lista megtartja az **Approve** gombot (egy korábban elutasított fotót újra jóvá lehet hagyni, új jelölés nélkül). A kikapcsolt jelölésű esemény megtartja a gyors gombokat:

- **Egy fotó jóváhagyása:** nyomd meg a kártyán az **Approve** gombot. A kártya eltűnik a listából, és a fotós e-mailben megkapja a linket.
- **Egy fotó elutasítása:** nyomd meg a **Reject** gombot, válassz legalább egy okot, ha szeretnél, írj megjegyzést, majd **Confirm reject** (vagy **Cancel**). A fotós rövid értesítést kap, a fotó privát marad, az okok és a megjegyzés nem mennek ki.
- **Egyszerre sok fotó:** pipáld be a kártyákat, vagy nyomd meg a **Select all** gombot, majd az **Approve selected** gombot. A gomb mutatja, hol tart. Egyszerre két fotót dolgoz fel, ezért hagyd nyitva az oldalt, amíg újra az Approve selected felirat nem áll rajta.
- **Meggondoltad magad:** a **Rejected** listán lévő fotót még jóváhagyhatod. A jóváhagyott fotót ezen az oldalon nem lehet visszavonni, ezért nézd meg, mielőtt az Approve gombra nyomsz.

A kártyák listája is 10 másodpercenként magától megnézi, jött-e új fotó, és megáll, amíg döntesz vagy egy elutasítás okait választod.

**A képernyő szavai (Vetting words)**

A gombok, amelyeket megnyomsz (nem, kor, érzelem, kellékek), és az elutasítás okai egy **szólista**, nem rögzített gombok. A lista három szinten állítható, mindenhol ugyanazzal a szerkesztővel (a szerkesztő angol nyelvű; a beállított szavak úgy jelennek meg, ahogy beírtad őket):

- **General** (minden partner és esemény): **Settings > Vetting words**, globális adminoknak.
- **Partner** (minden eseménye): a partner menüjében a **Vetting words**; a partner Manager-ének vagy globális adminnak.
- **Event** (ez az esemény): az esemény menüjében a **Vetting words** (a Vetting mellett); az esemény partnerének Manager-ének vagy globális adminnak.

A legközelebbi szint nyer: az esemény választása erősebb a partnerénél, az pedig az általánosnál, és mindegyik alatt ott a standard lista. Egy szint csak azt tárolja, amit megváltoztattál; minden más a fölötte lévő szintet követi, ezért az általános szint változása minden olyan eseményhez eljut, amely az adott lehetőséget nem módosította maga.

Csoportonként (**Gender**, **Age**, **Emotion**, **Items**, **Reason**) a szerkesztő felsorolja a lehetőségeket, és megmutatja, honnan jön a szavuk (Standard, General, Partner, Event, Added here). Amit tehetsz:

- **elrejtheted vagy megmutathatod** a lehetőséget (**Offered** vagy **Hidden**);
- **átírhatod a szavát** (1 és 60 karakter között, sima szöveg: nem lehet benne emoji, `<` vagy `>`);
- **feljebb vagy lejjebb teheted** (**Up** vagy **Down**): a képernyőn ez a sorrend;
- **felvehetsz saját lehetőséget**: írd be a szavát az **Add an option to ...** mezőbe, és nyomd meg az **Add option** gombot (például „Klubsál”);
- **törölheted** a magad felvette lehetőséget: csak elrejtődik, soha nem törlődik végleg (**Show deleted**, majd **Restore**);
- **Follow the level above**: eldobja ennek a szintnek a módosítását.

Végül nyomd meg a **Save** gombot (vagy a **Discard the changes** gombot). Egy már megnyitott vetting képernyő az új szavakat legközelebb betöltéskor mutatja.

Ami nem változik:

- A standard lehetőségeket el lehet rejteni és át lehet írni, de törölni nem.
- Minden lehetőségnek van egy **kulcsa**, amelynek a jelentése soha nem változik. A szerkesztő a szavai alatt megmutatja a lehetőség számlálójának nevét (például `camera_gender_female`). A fotó a kulcsot tárolja, nem a szavakat. Ezért **egy lehetőség elrejtése vagy törlése soha nem érinti azokat a fotókat, amelyeken rajta van**: megtartják a jelöléseiket, és tovább számítanak. Az új szöveg a régi fotókon is az új szöveggel látszik, ezért a szavakat változtasd, ne a jelentést.
- A **Gender**, az **Age** és a **Reason** csoportban legalább egy lehetőségnek kínálva kell maradnia („At least one option of Gender must stay offered.”). Ha egy csoportnál mégis egy sem marad kínálva egy eseményre, a képernyő ezt írja: „No gender is offered for this event, so a person cannot be completed. Ask an admin to switch one on.” (illetve: „No reasons are offered for this event, so a photo cannot be rejected here. Ask an admin to switch one on.”).

A **standard lista** (amit az esemény kap, ha senki nem változtatott semmit):

- **Gender (nem)**, mindenkinek egy kell: Female, Male, Not sure.
- **Age (kor)**, mindenkinek egy kell: Child (about 0 to 12), Young (about 13 to 24), Adult (about 25 to 59), Senior (about 60 and over).
- **Emotion (érzelem)**, nem kötelező, egy választható: Happy, Neutral, Sad, Angry, Unamused. Alapból kikapcsolva, bekapcsolható: Excited, cheering; Surprised.
- **Items (kellékek)**, nem kötelező, több is választható: Jersey or shirt, Scarf, Cap or hat, Flag. Alapból kikapcsolva, bekapcsolható: Face paint, Banner or sign.
- **Reason (az elutasítás oka)**, az elutasításhoz legalább egy kell: Offensive hand gesture, Nudity or sexual content, Alcohol, Other forbidden content, Violence or weapons, Hate symbol or offensive text, Drugs or smoking, Competitor or unwanted brand, Political message, Unusable: blurry, dark or no face, Test, spam or not a selfie, Other (write it in the note).

A „Not sure” és a „Neutral” valódi választás: az üres azt jelenti, hogy nincs megjelölve, soha nem azt, hogy semleges.

**Mire valók a jelölések**

Minden jelölés a fotóval együtt mentődik: az emberek a téglalapjaikkal, a választott lehetőségek, ki jelölte és mikor, és hogy a szólistának melyik változata volt használatban, így a különböző listákkal készült jelölések megkülönböztethetők. Ezekre kellenek:

- **Számolásra.** A Vetting fülön a fotók alatti **People marked in the photos** kártya és az esemény Analytics nézetének **Vetting and people** füle (lásd: [Egy esemény Analytics nézete](guides-tutorial-camera-analytics.md)), valamint a messmassnak szánt számlálók. A számláló neve a `camera_`, a csoport és a kulcs: `camera_gender_female`, `camera_age_kid`, `camera_emotion_happy`, `camera_merch_scarf`, az elutasítások okainál pedig `camera_rejected_nudity`. Mindegyik az esemény **összes jelölt fotójára vett folyamatos végösszeg** (jóváhagyott, elutasított vagy még várakozó), soha nem egy nap változása. **Átlag soha nem megy el**, csak végösszeg és darabszám, mert az eseményeket összeadó riportok az átlagot is összeadnák: az átlagot a messmass képlete számolja ki, például a fotónkénti emberek száma a `camera_people_total` osztva a `camera_images_annotated` értékkel, a döntéshez szükséges átlagos idő pedig a `camera_vetting_seconds_total` osztva a `camera_images_decided` értékkel. A számlálók csak akkor mennek el a messmassnak, ha a tulajdonos bekapcsolja a küldést; ez **ma ki van kapcsolva**, tehát egyelőre semmi nem megy el.
- **Később: példák szoftvernek.** A fotókat és a jelöléseket azért őrizzük meg, hogy egy szoftver egyszer megtanulhassa maga elvégezni a jelölést. Ma semmit nem exportálunk erre, és hogy mit szabad felhasználni, azt a jogi oldalnak kell eldöntenie.

**Ha valami elromlik**

- **Piros üzenet jelzi, hogy a fotó nincs jóváhagyva vagy elutasítva, vagy hogy az embereket nem sikerült menteni.** A fotó a képernyőn marad (a kártya a listán). Nyomd meg újra a gombot. Ha megint nem sikerül, mondd el az operátornak, mit ír az üzenet.
- **Egy e-mailt nem sikerült elküldeni.** A fotó el van döntve, de a fotós nem kapta meg az e-mailt. Az egyesével nézet a döntés után narancssárga sorban jelzi (például: „Photo approved, but the e-mail with the link to the user could not be sent.”), a kártyák listáján is üzenet szól erről. Ha valaki azt mondja, nem kapott e-mailt, mondd meg az operátornak az időpontot és a fotó tetején látott e-mail-címet.
- **Az üzenet szerint nem érkezett válasz a szervertől (No answer arrived).** A döntés lehet, hogy mégis megtörtént. Töltsd újra az oldalt, az azt mutatja, amit a szerver most tárol, és nézd meg az Approved és a Rejected listát, mielőtt újra próbálkozol.
- **Hiányzik egy választási lehetőség.** Ha a képernyő azt írja, hogy nincs nem, kor vagy ok kínálva, vagy egy szükséges szó nincs a listán, kérd meg az operátort, hogy változtassa meg az esemény vagy a partner Vetting words listáját.
- **Egy ideig senki sem tud jóváhagyni.** Semmi sem vész el. A fotók várnak, és a fotósok továbbra is a várakozó üzenetet látják. A jóváhagyást az eseményre csak egy globális admin tudja kikapcsolni.
- **Az oldal újra bejelentkezést kér.** Jelentkezz be ugyanazzal az e-mail-címmel, és nyisd meg újra a Vetting fület.
