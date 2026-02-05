# Style Model and Assignment Rules
**Status:** Active  
**Version:** 1.0.0  
**Last Updated:** 2026-02-04  
**Owner:** Admin (Katja)  
**Audience:** Product + Engineering

---

## 1. Purpose

- Define the **report style model** (themes, colors, typography) and where it is stored.
- Define **assignment rules** for how styles are applied across the hierarchy: global → partner → event → filter.

---

## 2. Style Model

### 2.1 What a Report Style Is

- A **report style** is a document in the `report_styles` collection.
- It holds CSS custom properties (e.g. `--mm-color-primary-500`, `--block-base-font-size`) that the report renderer injects into the page.
- Each style has: `_id`, `name`, and a set of key-value pairs (design tokens) used by the Reporting layer.

### 2.2 Where Styles Are Stored

- **Collection:** `report_styles`
- **API:** `/api/report-styles` (CRUD), `/api/report-styles/[id]` (get one)
- **Admin UI:** `app/admin/styles/page.tsx` (list), `app/admin/styles/[id]/page.tsx` (editor)

### 2.3 Model Mapping (Admin UI)

| Concept        | Admin UI Location              | Data / API                         |
|----------------|--------------------------------|------------------------------------|
| List styles    | `app/admin/styles/page.tsx`    | GET `/api/report-styles` → list    |
| Edit style     | `app/admin/styles/[id]/page.tsx` | GET/PUT `/api/report-styles/[id]` |
| Create style   | Navigate to `/admin/styles/new` | POST via editor save               |
| Delete style   | List page delete action        | DELETE `/api/report-styles?id=...` |
| Style identity | `ReportStyle._id`              | MongoDB ObjectId                   |

---

## 3. Assignment Rules (Hierarchy)

Style resolution follows a **priority order**. The first non-null value wins.

### 3.1 Resolution Order (Highest to Lowest)

1. **Event / project level** – `project.styleIdEnhanced`  
   - Used when viewing a **single event report** (e.g. `/report/[slug]` for a project).  
   - Overrides partner and template defaults for that event.

2. **Partner level** – `partner.styleId`  
   - Used when viewing a **partner report** or when the event does not set `styleIdEnhanced`.  
   - Applies to all events under that partner unless overridden at event level.

3. **Template level** – `report_template.styleId`  
   - Default style attached to the report template.  
   - Used when neither project nor partner specifies a style.

4. **Filter / hashtag level**  
   - Filter and hashtag report types resolve template (and thus style) via their own identifier; they do not add a new style tier.  
   - Style for filter/hashtag reports comes from the resolved template’s style (or partner/project if applicable when that resolution path is used).

### 3.2 Where Resolution Happens

- **API:** `app/api/report-config/[identifier]/route.ts`  
  - Resolves template and then applies style hierarchy:  
    - For **project**: `project.styleIdEnhanced || partner.styleId || template.styleId`  
    - For **partner**: `partner.styleId || template.styleId`  
    - For **hashtag/filter**: template’s style (template may reference partner/project where relevant).

### 3.3 Summary Table

| Level    | Field / source              | Scope                          |
|----------|-----------------------------|---------------------------------|
| Event    | `project.styleIdEnhanced`   | Single event report             |
| Partner  | `partner.styleId`           | All events for that partner     |
| Template | `report_template.styleId`   | Default for that template       |
| Filter   | (resolved template’s style) | Filter/hashtag report           |

---

## 4. References

- Report config resolution: `app/api/report-config/[identifier]/route.ts`
- Style application in Reporting: `hooks/useReportStyle.ts`, report page components
- Admin styles list: `app/admin/styles/page.tsx`
- Admin style editor: `app/admin/styles/[id]/page.tsx`
