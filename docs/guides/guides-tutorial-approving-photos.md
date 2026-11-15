# Tutorial: Reviewing photos at an event (Camera app)
Status: Active
Last Updated: 2026-11-11
Canonical: Yes
Owner: Documentation
Verified against Camera package 12.3.47 source snapshot at commit `512d3b36` on 2026-11-11. This is a source review; the current production deployment and event configuration were not inspected.

> Audience: Event reviewers and operators · Prerequisites: You have access to the event, photo vetting is enabled, and the photo has passed Camera's consent and retention eligibility checks · Related: [Camera app integration](guides-tutorial-camera-app.md) · [Events](guides-tutorial-events.md) · [Partners](guides-tutorial-partners.md) · [The Analytics view of an event](guides-tutorial-camera-analytics.md) · Magyar változat: [lent / below](#magyar-valtozat)

## What Vetting does

Vetting is the human publication decision: a reviewer approves or rejects an eligible photo. It does not collect people annotations or perform Fanmass image analysis. Fanmass results, detection boxes, and human corrections are reviewed separately in the event's **Photo analysis** area.

Camera holds photos with pending or unknown consent outside both Vetting and Photo analysis. Do not treat a missing consent record as permission. The Vetting page reports these held photos separately; photos whose 24-hour consent window expires are removed by scheduled cleanup.

## Open the event queue

1. Sign in to the Camera admin and open **Events**.
2. Open the event, then choose **Vetting**.
3. Use **Waiting**, **Rejected**, and **Approved** to switch between decision states.

When photo vetting is required, **Waiting** opens in the one-photo-at-a-time review view by default. Use **Show the list** to switch to cards; **Back to one at a time** returns to the review view. The queue refreshes about every 10 seconds while the page is visible and idle, and also refreshes when you return to the tab. It pauses automatic refresh while a decision or rejection is in progress.

In the one-at-a-time view, review the submitted photo and its available contact information, then choose **Approve** or **Reject…**. **Skip for now** moves the current photo behind the other photos in the current queue; it is unavailable when there is no other photo to review.

## Approve or reject

### Approve

Choose **Approve** after your review. Camera checks consent eligibility again when saving the decision. If approval succeeds, Camera creates the approved image using the frame associated with the submission, where a frame applies. A photo cannot be approved if the required source image or frame composition fails. Public visibility still depends on the recorded media-use authorization and sharing choice.

### Reject

Choose **Reject…**, select at least one rejection reason, and optionally add a note. Confirm with **Reject photo**. Until a reason is selected and the rejection is confirmed, the photo remains waiting. A rejected photo remains private.

The reason list is configurable through the resolved global, partner, and event rejection vocabulary. The current Camera Vetting workflow uses this vocabulary for rejection reasons only. Legacy gender, age, emotion, and merchandise vocabulary settings may still exist for compatibility, but they are not person-annotation controls in the current Vetting flow.

### Email result

A photo decision and its email are separate outcomes. The decision can be saved even when an email is skipped or fails. The interface reports the available outcome, including sent, deferred until a recipient address is available, skipped, or failed. A sent status means Camera's email flow reported success; it cannot confirm delivery to the recipient's inbox. Check the approved or rejected card and the event's email records if the person reports a missing email.

## Use the card list

The **Waiting** list view, **Rejected**, and **Approved** show photo cards. The lists are paginated at up to 60 photos per page. In Waiting list view, review one card at a time or select eligible cards for bulk approval; bulk approval runs with limited concurrency and shows progress. Rejection still requires a reason for each photo.

Approved cards can offer **Send approval link** when an eligible stored recipient exists and an approval message has not already been sent. The card actions can also include **View photo**, **Update analysis**, and **Back to vetting**, depending on the photo's state and available source image. **Update analysis** belongs to the analysis workflow; it does not change the approval decision. Returning a decided photo to Vetting makes it unavailable while it is awaiting a new decision.

If a request times out or the page reports that no server answer arrived, do not assume the decision failed. Reload the Vetting page and inspect the photo's current status before trying again.

## Photo analysis is a separate task

Open **Photo analysis** to see the per-photo Fanmass result, detection boxes, analysis state, and available human corrections. Vetting does not require drawing boxes or completing gender/age/emotion/merchandise fields. Camera's event Analytics is an aggregate operational view; it is not the per-photo analysis editor. See [The Analytics view of an event](guides-tutorial-camera-analytics.md).

## Operational notes

- Photos held for pending or unknown consent are not reviewable or analysable until eligibility is resolved.
- Approving a photo does not guarantee an email was sent. Read the email outcome shown after the decision.
- A rejected photo stays private. An approved photo is publicly available only when its recorded authorization and visibility state allow it.
- If a needed rejection reason is missing, ask an authorized event operator to update the event's rejection vocabulary.
- For per-photo people, brands, teams, items, emotions, and boxes, use **Photo analysis** and review the Fanmass result there.

<a id="magyar-valtozat"></a>

## Magyar változat

### Fotók ellenőrzése egy eseményen (Camera alkalmazás)

A leírás a Camera 12.3.47-es csomagjának `512d3b36` forráskódja alapján készült 2026. 11. 11-én. Ez forráskód-ellenőrzés; az éles környezetben futó verziót és az esemény beállításait nem vizsgáltuk.

A **Vetting** emberi publikálási döntést jelent: az ellenőr jóváhagyja vagy elutasítja a jogosult fotót. Itt nem jelölünk be embereket, és nem fut Fanmass-képelemzés. A Fanmass eredményeit, felismerési kereteit és az emberi javításokat az esemény **Photo analysis** részén lehet megtekinteni és szerkeszteni.

A Camera a hiányzó vagy függőben lévő hozzájárulású fotókat a Vetting és a Photo analysis felülettől külön tartja. A hiányzó hozzájárulási rekord nem jelent engedélyt. A Vetting külön jelzi ezeket a visszatartott fotókat; a 24 órás hozzájárulási idő lejárta után a fotókat az ütemezett törlési folyamat eltávolítja.

### A várólista megnyitása

1. Jelentkezz be a Camera admin felületére, és nyisd meg az **Events** részt.
2. Nyisd meg az eseményt, majd válaszd a **Vetting** menüpontot.
3. A **Waiting**, **Rejected** és **Approved** fülekkel válthatsz az állapotok között.

Ha az eseményen kötelező a fotó-vetting, a **Waiting** alapértelmezés szerint egyesével megjelenő ellenőrző nézettel nyílik meg. A **Show the list** kártyalistára vált; a **Back to one at a time** visszavisz az egyesével történő ellenőrzéshez. A várólista körülbelül 10 másodpercenként frissül, amíg az oldal látható és nincs folyamatban döntés vagy elutasítás. Amikor visszatérsz a lapra, a Camera szintén frissít.

Az egyesével megjelenő nézetben nézd meg a beküldött fotót és az elérhető kapcsolati adatokat, majd válaszd az **Approve** vagy a **Reject…** gombot. A **Skip for now** az aktuális fotót a jelenlegi várólista végére teszi; egyetlen várakozó fotónál nem használható.

### Jóváhagyás vagy elutasítás

**Jóváhagyás:** válaszd az **Approve** gombot. A Camera mentéskor ismét ellenőrzi a hozzájárulási jogosultságot. Sikeres jóváhagyáskor elkészíti a végleges képet a beküldéshez tartozó kerettel, ha van ilyen. Hiányzó képfájl vagy sikertelen keretkompozíció esetén a fotó nem hagyható jóvá. A nyilvános megjelenéshez a rögzített médiahasználati engedélynek és megosztási választásnak is megfelelőnek kell lennie.

**Elutasítás:** válaszd a **Reject…** lehetőséget, jelölj ki legalább egy elutasítási okot, és ha szükséges, adj hozzá megjegyzést. Erősítsd meg a **Reject photo** gombbal. Amíg nincs ok kiválasztva és a döntés megerősítve, a fotó a várólistán marad. Az elutasított fotó privát marad.

A jelenlegi Vetting-folyamat csak az elutasítási okok szókészletét használja. A nemre, életkorra, érzelemre és terméktípusra vonatkozó régi szókészlet-beállítások kompatibilitási okból még létezhetnek, de nem emberjelölő mezők a jelenlegi Vetting felületen.

**E-mail eredmény:** a fotóról hozott döntés és az e-mail küldése külön eredmény. A döntés akkor is mentődhet, ha az e-mail küldése kimarad vagy hibára fut. A felület jelzi az elérhető eredményt: elküldve, cím megadásáig halasztva, kihagyva vagy sikertelenül. Az elküldött állapot a Camera e-mail-folyamatának sikerét jelenti; nem igazolja, hogy az üzenet megérkezett a címzett postaládájába. Ha a felhasználó nem kapta meg, ellenőrizd a fotókártyát és az esemény e-mail-adatait.

### Kártyalista és képelemzés

A **Waiting** kártyalistája, valamint a **Rejected** és **Approved** nézet fotókártyákat mutat; oldalanként legfeljebb 60 fotó látható. A Waiting listában a jogosult fotókat egyenként vagy kijelölve, korlátozott párhuzamosságú tömeges jóváhagyással lehet feldolgozni. Az elutasításhoz minden esetben ok szükséges.

A fotó állapotától és az elérhető forrástól függően a kártyán megjelenhet a **Send approval link**, a **View photo**, az **Update analysis** vagy a **Back to vetting**. Az **Update analysis** a képelemzési folyamat része, nem módosítja a jóváhagyási döntést. Ha egy döntés után visszakerül a fotó a Vettingbe, az új döntésig nem érhető el nyilvánosan.

Ha a kérés időtúllépés miatt nem kapott választ, ne feltételezd, hogy a döntés meghiúsult. Töltsd újra a Vetting oldalt, és ellenőrizd a fotó aktuális állapotát, mielőtt újra próbálkozol.

A fotónkénti Fanmass-eredményekhez, felismerési keretekhez és javításokhoz nyisd meg a **Photo analysis** felületet. Az esemény **Analytics** nézete összesített működési adatokat mutat; nem ez a fotónkénti elemzési szerkesztő. Részletek: [Egy esemény Analytics nézete](guides-tutorial-camera-analytics.md).
