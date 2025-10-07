# MessMass End User Guide

**For Event Organizers and Statistics Users**

Version: 5.21.2  
Last Updated: 2025-10-06T19:57:45.000Z

---

## Welcome to MessMass

MessMass is your real-time event statistics dashboard. This guide will help you track audience engagement, view insights, and share results with your team.

---

## 🚀 Getting Started

### Accessing Your Event Dashboard

**Option 1: Direct Access with Password**
1. Receive your event link from your admin (looks like: `https://messmass.doneisbetter.com/stats/your-event`)
2. Open the link in your browser
3. Enter the page password when prompted
4. You're in! The dashboard loads automatically

**Option 2: Admin Login** (if you have admin access)
1. Go to `https://messmass.doneisbetter.com/admin/login`
2. Enter your email and password
3. Access all events from the Admin Dashboard

### Finding Your Event

Once logged in:
- **Admin users**: Navigate to Projects → Select your event
- **Direct access**: Bookmark your event's stats page for quick access

---

## 📊 Understanding the Stats Page

### Page Layout

Your stats page shows:
1. **Event Header** - Event name, date, and hashtags
2. **Export Buttons** - Download data as CSV or PDF
3. **Charts & KPIs** - Visual insights organized in blocks
4. **Project Details** - Created and updated timestamps

### Reading Charts

**Pie Charts** (Circular graphs)
- Show proportions and percentages
- Hover over segments to see exact numbers
- Click legend items to show/hide segments
- Common uses: Gender split, age groups, fan sources

**Bar Charts** (Vertical bars)
- Compare quantities across categories
- Height = higher value
- Hover for exact counts
- Common uses: Merchandise breakdown, engagement levels

**KPI Cards** (Large numbers)
- Highlight key metrics at a glance
- Color-coded for easy scanning:
  - Blue: General metrics
  - Green: Positive/success metrics
  - Orange: Attention metrics
- Shows calculated values (e.g., Core Fan Team %)

### Understanding Trends

- **Created At**: When this event was first added to the system
- **Updated At**: Last time data was modified
- Compare Updated At timestamps to see data freshness

---

## ⚡ Live Event Tracking (Edit Page)

### Accessing the Editor

1. Navigate to your event's **Edit** page (link format: `/edit/your-event`)
2. Enter the edit password if prompted
3. Choose your tracking mode:
   - **Clicker Mode**: Fast tap-to-increment during live events
   - **Manual Mode**: Enter exact numbers after the event

### Clicker Mode (During Event)

**Best for**: Real-time tracking while the event is happening

**How it works**:
1. Each metric shows as a card with + and - buttons
2. Tap + to increment the count
3. Tap - if you need to undo (decrements by 1)
4. Changes save automatically every few seconds
5. Green "Saved" indicator confirms sync

**Pro Tips**:
- Use on mobile or tablet for portability
- Assign one counter per team member
- Watch for the "Saved" indicator before moving on
- If offline, changes queue and sync when reconnected

**Safety Features**:
- Can't go below zero (- button disabled at 0)
- Auto-saves prevent data loss
- Undo available immediately after increment

### Manual Mode (Post-Event)

**Best for**: Entering complete data after the event

**How it works**:
1. Type exact numbers into input fields
2. Tab between fields for fast entry
3. Click "Save Changes" when done
4. Confirmation message appears

**Pro Tips**:
- Prepare numbers in advance (spreadsheet, notes)
- Double-check totals before saving
- Use Tab key for keyboard-only entry

---

## 💾 Exporting Data

### CSV Export

**What you get**: Spreadsheet-ready data with variable names and values

**How to export**:
1. Click "📊 Export CSV" button on stats page
2. File downloads immediately (format: `EventName_stats_YYYY-MM-DD.csv`)
3. Open in Excel, Google Sheets, or Numbers

**Include Derived Metrics** checkbox:
- ☑ Checked: Includes calculated values (Total Images, Total Fans, Core Fan Team %)
- ☐ Unchecked: Only raw input values

**Use cases**:
- Post-event reporting
- Sponsor presentations
- Historical comparisons
- Budget planning

### PDF Export

**What you get**: Full-page snapshot of all charts and data

**How to export**:
1. Click "📄 Export PDF" button
2. Wait 5-10 seconds for generation (shows "Generating PDF...")
3. PDF downloads automatically (format: `EventName_MessMass_Report.pdf`)

**What's included**:
- Event name and details
- All visible charts
- KPI cards
- Timestamps
- Multi-page if content is long

**Use cases**:
- Quick stakeholder share
- Print-ready reports
- Archive snapshots

**Note**: PDF quality is optimized for screen viewing and printing

---

## 🔗 Sharing Results

### Creating Shareable Links

**Admin users only** can generate shareable links:

1. Go to Admin Dashboard → Projects
2. Find your event
3. Click "Share" button
4. System generates:
   - **Stats Link**: View-only statistics page
   - **Password**: Required for first-time access
   - **Edit Link**: If edit access needed

### Sharing Best Practices

**DO**:
- Share link + password separately (e.g., link via email, password via SMS)
- Set expiration dates for sensitive events
- Track who has access (keep a list)
- Regenerate passwords if compromised

**DON'T**:
- Post passwords in public channels (Slack, Teams without encryption)
- Share edit access unless absolutely necessary
- Use the same password for multiple events

### Revoking Access

Currently, access revocation requires admin assistance:
1. Contact your system administrator
2. Request password regeneration for the event
3. New password invalidates old links
4. Re-share updated password with authorized users only

---

## 📏 Understanding Metrics

### Image Tracking

- **Remote Images**: Photos taken by fans at home/remotely
- **Hostess Images**: Photos taken by event staff/hostesses
- **Selfies**: Self-taken photos by attendees
- **Total Images**: Sum of all image types (derived)

### Demographics

**Gender**:
- Female / Male counts
- Used for audience composition analysis

**Age Groups**:
- Gen Alpha: Born 2010+
- Gen Y/Z: Born 1981-2009
- Gen X: Born 1965-1980
- Boomer: Born 1946-1964

### Location

- **Indoor**: Attendees inside venue
- **Outdoor**: Attendees in outdoor areas
- **Stadium**: Special stadium seating areas
- **Remote Fans**: Watching remotely (calculated: indoor + outdoor base when not manually set)

### Merchandise

- **Merched**: Total attendees with any merchandise
- **Jersey**: Event jerseys/shirts
- **Scarf**: Scarves
- **Flags**: Flags/banners
- **Baseball Cap**: Caps
- **Other**: Other merchandise items

### Key Performance Indicators (KPIs)

**Core Fan Team %**:
- Formula: `(Merched Fans / Total Fans) × Attendees`
- Meaning: Engaged fans with merchandise, scaled to event size
- Use: Measure fan loyalty and merchandise success

**Advertisement Value**:
- Calculated based on image engagement metrics
- Represents potential sponsorship exposure value

**Engagement Rate**:
- Measures active participation vs. passive attendance
- Higher = better audience engagement

---

## #️⃣ Hashtag System

### Traditional Hashtags

Simple tags without categories:
- Example: `#summer`, `#budapest`, `#festival`
- Appear as colored bubbles
- Colors assigned by admin
- Click to filter events with same hashtag

### Category-Prefixed Hashtags

Organized tags with structure:
- Format: `category:hashtag`
- Example: `country:hungary`, `period:summer`, `success:approved`
- Display with category prefix in lighter text
- Inherit category color

**Why use categories?**:
- Better organization (all countries grouped together)
- Precise filtering (find all "country" tags vs. generic search)
- Clearer reporting

### Color Coding

- Each hashtag category has its own color
- Individual hashtags can have custom colors
- Helps visual scanning across multiple events

---

## 🔧 Troubleshooting

### "Password Invalid" or "Access Denied"

**Cause**: Incorrect password, expired password, or typo

**Solutions**:
1. Double-check password (case-sensitive, no spaces)
2. Copy-paste password instead of typing
3. Request fresh password from admin
4. Clear browser cookies and try again

### "Login Failed" or Session Issues

**Cause**: Stale cookies or browser cache

**Solutions**:
1. Visit `/admin/clear-session` to reset (admin users)
2. Clear browser cookies for messmass.doneisbetter.com
3. Use incognito/private browsing mode
4. Try different browser

### Data Not Updating

**Cause**: Network issue or sync delay

**Solutions**:
1. Check internet connection
2. Wait 10 seconds and refresh page
3. Look for "Saved" indicator in editor
4. Re-enter last change and save again

### Charts Not Loading

**Cause**: Browser compatibility or slow connection

**Solutions**:
1. Refresh the page (Ctrl+R / Cmd+R)
2. Use modern browser (Chrome, Firefox, Safari, Edge)
3. Disable browser extensions temporarily
4. Check browser console for errors (F12)

### Export Buttons Not Working

**PDF Export Troubleshooting**:
- Wait for "Generating PDF..." message
- Allow 10-15 seconds on slow connections
- Check browser's download settings
- Ensure pop-ups aren't blocked

**CSV Export Troubleshooting**:
- Should download instantly
- Check browser's downloads folder
- Enable downloads in browser settings
- Try right-click → Save Link As

### Mobile Display Issues

**Solutions**:
1. Rotate device to landscape for better chart view
2. Pinch to zoom on specific charts
3. Use desktop mode in browser settings for full features
4. Switch to desktop/laptop for complex editing

---

## 📞 When to Contact Support

**Contact your admin or system administrator if**:
- Password reset needed
- Access permissions need changing
- Event not appearing in your list
- Persistent technical errors
- Data export issues after troubleshooting
- Need to archive or delete events

**Before contacting**:
- Note your event name/slug
- Take screenshot of error message
- List troubleshooting steps already tried
- Record browser and device info

---

## ✅ Quick Reference Card

### Essential Actions

| Action | Location | How |
|--------|----------|-----|
| View Stats | `/stats/event-name` | Enter password → view |
| Edit Live | `/edit/event-name` | Clicker mode → tap + |
| Edit Post-Event | `/edit/event-name` | Manual mode → enter numbers |
| Export CSV | Stats page | Click 📊 Export CSV |
| Export PDF | Stats page | Click 📄 Export PDF |
| Share Event | Admin → Projects | Click Share → copy link + password |

### Keyboard Shortcuts (Edit Page)

- **Tab**: Move to next field
- **Shift+Tab**: Move to previous field
- **Enter**: Save changes (when focused on Save button)
- **Esc**: Cancel/close dialogs

---

## 🎯 Best Practices

1. **Before Event**: Test edit page access, bookmark links
2. **During Event**: Use Clicker mode, watch for "Saved" indicator
3. **After Event**: Switch to Manual mode for final corrections
4. **Sharing**: Separate link and password for security
5. **Exporting**: Download CSV for analysis, PDF for quick shares

---

**Need more help?** Refer to [AUTHENTICATION_AND_ACCESS.md](AUTHENTICATION_AND_ACCESS.md) for detailed auth documentation or contact your system administrator.

**For developers**: See [DEVELOPER_ONBOARDING.md](DEVELOPER_ONBOARDING.md) for technical implementation details.

---

*MessMass v5.21.2 • Real-time Event Statistics Dashboard*
