# MessMass Admin Guide

**For System Administrators and Power Users**

Version: 5.21.2  
Last Updated: 2025-10-06T19:57:45.000Z

---

## Welcome, Admin!

This guide covers all administrative functions in MessMass, from managing projects and users to customizing the design system and configuring advanced features.

---

## 🎛️ Admin Dashboard Overview

### Accessing the Admin Dashboard

1. Navigate to https://messmass.doneisbetter.com/admin/login
2. Enter your admin email and password
3. You'll land on the main dashboard with navigation cards

### Dashboard Cards

The admin dashboard provides quick access to all administrative functions:

- **🗂️ Projects** (Green accent) - Manage all events
- **🔍 Filter** (Cyan accent) - Multi-hashtag filtering and analysis
- **🏷️ Hashtags** (Purple accent) - Hashtag color management
- **📁 Categories** (Orange accent) - Hashtag category definitions
- **🎨 Design** (Pink accent) - UI customization and fonts
- **📊 Charts** (Yellow accent) - Chart configuration
- **🔢 Variables** (Blue accent) - Data variables and formulas
- **📈 Visualization** (Teal accent) - Grid layout and display settings

### Navigation

**Sidebar** (desktop):
- Fully expanded showing labels (280px wide)
- Collapsible on tablets (80px, icons only)
- Hamburger menu on mobile (overlay drawer)

**Top Bar**:
- Current page title
- Version indicator (footer)
- Logout option (if implemented)

---

## 📊 Managing Projects

### Creating a New Project

1. **Navigate**: Admin Dashboard → Projects → "Add New Project"
2. **Fill Required Fields**:
   - **Event Name**: Clear, descriptive name (e.g., "Summer Festival 2025")
   - **Event Date**: Select date from calendar picker
3. **Add Hashtags** (optional):
   - Type in traditional hashtags section
   - Or assign to specific categories
4. **Initialize Stats**: All metrics start at 0
5. **Click "Create Project"**

**Result**: System generates:
- Unique view slug (for stats page)
- Unique edit slug (for editor)
- View and edit passwords

### Editing Existing Projects

**Method 1: Quick Edit**
1. Find project in Projects list
2. Click project name or Edit button
3. Modify fields
4. Save changes

**Method 2: Inline Stats Update**
1. Use Stats page in admin view
2. Real-time updates via Edit page
3. Changes sync immediately

### Project List Features

**Search & Filter**:
- Search by event name (real-time)
- Filter by hashtags
- Sort by: Event Name, Date, Images, Fans, Attendees
- Ascending/descending order

**Pagination**:
- Default: 20 projects per page
- "Load More" for additional results
- Cursor-based (unsorted) or offset-based (sorted/searched)

**Bulk Actions**:
- CSV export per project (row-level)
- Share links generation
- Delete (with confirmation)

### Sharing Projects

**Generate Shareable Links**:
1. Find project in list
2. Click "Share" button
3. System displays:
   - **Stats Link**: Read-only statistics page
   - **View Password**: Required for first access
   - **Edit Link**: For data entry (if needed)
   - **Edit Password**: Separate from view password

**Best Practices**:
- Share link via one channel (email)
- Share password via different channel (SMS, phone)
- Document who has access
- Regenerate passwords if compromised

### Deleting Projects

**Process**:
1. Click "Delete" button on project row
2. Confirm deletion (irreversible)
3. Project and all associated data removed

**Note**: No undo. Export CSV first if needed for archival.

### Cloning Projects (Not Yet Implemented)

Future feature for duplicating event templates.

---

## 🏷️ Hashtag Management

### Hashtag Colors

**Purpose**: Assign visual colors to hashtags for easy identification

**Managing Colors**:
1. Navigate to Admin → Hashtags
2. View list of all hashtags with usage counts
3. Click hashtag to edit
4. Choose color from picker
5. Save

**Color Inheritance**:
- Category color overrides individual hashtag color
- If hashtag is in category "country", it uses country color
- If uncategorized, uses individual color
- Falls back to default blue if no color set

**Best Practices**:
- Use distinct colors for frequently used hashtags
- Group similar concepts with similar color families
- Reserve bright colors for high-priority tags

---

## 📁 Hashtag Categories

### Creating Categories

**Steps**:
1. Navigate to Admin → Categories
2. Click "Create New Category"
3. **Enter Name**: (e.g., "country", "period", "success")
   - Use lowercase
   - No spaces (use hyphens if needed)
4. **Choose Color**: Pick from color picker
5. **Save**

**Result**: New category available in project forms

### Using Categories

**In Project Forms**:
- Each category gets its own input section
- Format: `CategoryName [existing tags] [+ add input]`
- Hashtags automatically prefixed: `category:hashtag`

**Example**:
```
Country: [hungary] [austria] [+ add]
Period: [summer] [+ add]
```

Display as: `country:hungary`, `country:austria`, `period:summer`

### Editing Categories

1. Find category in list
2. Click Edit
3. Change name or color
4. Save

**Note**: Editing name updates all project references automatically

### Deleting Categories

**Warning**: Deleting category removes categorization but keeps hashtags in traditional format

**Process**:
1. Click Delete on category
2. Confirm action
3. System converts `category:hashtag` → `hashtag` for all projects

**Best Practice**: Export data first if category structure is important

### Category Best Practices

**Naming Conventions**:
- Keep names short and clear
- Use singular form (country, not countries)
- Avoid abbreviations unless universally understood

**Color Selection**:
- Consistent across similar concepts
- High contrast with background
- Accessible for colorblind users (test with tools)

**Organization**:
- Limit to 5-7 categories for clarity
- Reorder by importance (most used first)

---

## 🔍 Filter System

### Creating Multi-Hashtag Filters

**Purpose**: View aggregated stats across multiple events with specific hashtag combinations

**Steps**:
1. Navigate to Admin → Filter
2. **Enter Hashtags** in search field:
   - Traditional: `summer`, `festival`
   - Categorized: `country:hungary`, `period:summer`
   - Mixed: Both types together
3. Press Enter or click Filter
4. System shows:
   - Aggregated statistics charts
   - List of matching projects
   - Date range of events

### Saving Filters

**Creating Saved Filters**:
1. Apply hashtag filter
2. Click "Save Filter" (if implemented)
3. Name your filter
4. System generates unique slug

**Benefits**:
- Quick access to common reports
- Shareable URLs for stakeholders
- Historical tracking

### Filter Page Styling

**Assigning Style to Filter**:
1. Apply filter
2. Select style from dropdown
3. Auto-saves immediately (✓ saved indicator)
4. Page background/colors update

**Use Case**: Brand different report types with unique color schemes

### Exporting Filter Results

**CSV Export**:
- Downloads aggregated data
- Includes all matching project summaries
- Checkbox for derived metrics

**PDF Export**:
- Full visual report
- All charts included
- Ready for presentation

---

## 🎨 Design Customization

### Font Selection

**Available Fonts**:
- **Inter**: Modern, clean, high readability
- **Roboto**: Google's material design font
- **Poppins**: Friendly, geometric, distinctive

**How to Change**:
1. Navigate to Admin → Design
2. Select font from dropdown
3. Click Apply
4. Font updates across entire application

**Applies To**:
- All admin pages
- All public pages (stats, edit, filter)
- Persistent across sessions

### Page Styling

**Background Customization**:
1. Choose page (stats, filter)
2. Select background color or gradient
3. Preview changes
4. Save

**Design Tokens** (Advanced):
- All styles use CSS variables (`--mm-*` prefixed)
- Defined in `app/styles/theme.css`
- No inline styles allowed (see DESIGN_SYSTEM.md)

**Color Variables**:
```css
--mm-color-primary-600: #2563eb;    /* Primary blue */
--mm-gray-50: #f9fafb;              /* Page backgrounds */
--mm-white: #ffffff;                 /* Card backgrounds */
```

**Important**: Always use centralized CSS classes, never inline styles

### Admin Card Classes

**Standard Components**:
- `.admin-card` - Flat white cards with subtle shadows
- `.btn-primary` - Primary action buttons
- `.form-input` - Input fields
- `.form-select` - Dropdown selects

**Border Radius**: 8px (flat design, was 20px in glass-morphism)

**Shadows**: Subtle elevations (no dramatic 3D effects)

**Prohibition**: No `backdrop-filter: blur()` - all removed for flat design

---

## 📊 Chart Configuration

### Chart Types

**1. KPI Cards** (Single large number)
- Format: Number, Currency, Percentage
- Color variants: Primary, Secondary, Success, Warning, Info
- Formula support (calculated values)

**2. Vertical Bar Charts**
- Up to 10 elements
- Grouped comparisons
- Tooltips on hover

**3. Pie/Donut Charts**
- 2-10 segments
- Interactive legend
- Percentage display

### Creating Charts

**Steps**:
1. Navigate to Admin → Charts
2. Click "Create New Chart"
3. **Select Type**: KPI, Bar, or Pie
4. **Configure**:
   - Title
   - Subtitle (optional)
   - Data elements (variables)
   - Colors
   - Format (for KPIs)
5. **Preview** in admin view
6. **Save**

### Editing Charts

**Modify Existing**:
1. Find chart in Charts list
2. Click Edit
3. Change configuration
4. Preview updates immediately
5. Save

**Reorder Charts**:
- Drag and drop (if implemented)
- Or manually set order number
- Affects display sequence on stats pages

### Chart Variables

Charts pull data from **Variables** (see Variables System below)

**Available Variable Types**:
- **Built-in**: remoteImages, female, merched, etc.
- **Derived**: totalImages, totalFans (calculated)
- **Custom**: User-defined via Variables page

**Formula Support**:
- Basic math: `(merched / totalFans) * eventAttendees`
- Conditional: Based on variable availability

### Chart Display Rules

**Visibility**:
- Charts with no data automatically hidden
- "Include derived metrics" checkbox affects CSV, not display

**Grid Layout**:
- Desktop: Per-block grid columns (1-6)
- Tablet: Responsive unit clamping
- Mobile: Stacked vertically

---

## 🔢 Variables System

### Built-in Variables

**Image Metrics**:
- remoteImages, hostessImages, selfies

**Demographics**:
- female, male
- genAlpha, genYZ, genX, boomer

**Location**:
- indoor, outdoor, stadium, remoteFans

**Merchandise**:
- merched, jersey, scarf, flags, baseballCap, other

**Success Manager** (optional):
- eventAttendees, eventTicketPurchases, etc.

### Custom Variables

**Creating Custom Variables**:
1. Navigate to Admin → Variables
2. Click "Create Custom Variable"
3. **Enter Details**:
   - **Variable Name**: Unique identifier (camelCase)
   - **Label**: Display name
   - **Type**: Number or Text
   - **Default Value**: Optional
4. **Set Flags**:
   - **Visible in Clicker**: Show in live tracking mode
   - **Editable in Manual**: Allow post-event editing
5. **Save**

**Result**: Variable appears in:
- Editor dashboard (if flags set)
- Variables list for chart formulas
- Export data

### Variable Visibility Flags

**Visible in Clicker**:
- ☑ Checked: Shows in Edit page Clicker mode
- ☐ Unchecked: Hidden from live tracking

**Editable in Manual**:
- ☑ Checked: Editable in Manual mode inputs
- ☐ Unchecked: Read-only or hidden

**Use Cases**:
- Clicker-only: Fast-increment metrics during event
- Manual-only: Post-event corrections or detailed entries
- Both: Flexible tracking

### Variable Scope

**Per-Project**: All variables store data in `project.stats`

**Global Registry**: Definitions shared across all projects

**Backward Compatibility**: New variables optional; old projects unaffected

---

## 📈 Visualization Settings

### Grid Layout Configuration

**Purpose**: Control how charts display on stats pages

**Grid Units**:
- **Desktop**: 1-12 units (typically 4 or 6)
- **Tablet**: 1-6 units
- **Mobile**: 1-2 units (typically 1 for stacking)

**Per-Block Settings**:
1. Navigate to Admin → Visualization
2. Configure global defaults:
   - Desktop units: 4
   - Tablet units: 2
   - Mobile units: 1
3. Save

**Chart Spans**:
- Each chart can span 1-6 units (desktop)
- Clamped to available units per breakpoint
- No per-card width overrides (use grid)

### Responsive Configuration

**Breakpoints**:
- Desktop: ≥1280px
- Tablet: 768-1279px
- Mobile: <768px

**Behavior**:
- Desktop: Full sidebar, multi-column grids
- Tablet: Auto-collapsed sidebar, fewer columns
- Mobile: Hamburger menu, single-column

**Preview**: Use browser dev tools to test breakpoints

### Block Management

**Editing Blocks**:
1. Admin → Visualization
2. View list of data blocks
3. Click block to edit:
   - Block title
   - Grid columns (desktop)
   - Assigned charts
4. Preview changes
5. Save

**Reordering Blocks**:
- Drag and drop (if enabled)
- Affects display sequence on public pages

### Screen Presets (Future)

Planned feature for saved viewport configurations

---

## 👥 User Management

### Creating Admin Accounts

**Steps**:
1. Navigate to Admin → Users (if implemented) or use API
2. Click "Create New User"
3. **Enter Details**:
   - **Email**: Unique, lowercase
   - **Name**: Full name
   - **Role**: `admin` or `super-admin`
4. **Password**: System generates 32-char secure token
5. **Save**

**Result**: New user can log in with email + generated password

### Password Regeneration

**When to Regenerate**:
- User forgot password
- Security concern (password compromised)
- Regular rotation policy

**Process**:
1. Find user in Users list
2. Click "Regenerate Password"
3. System generates new 32-char token
4. Display new password (copy immediately)
5. Share securely with user

**Endpoint**: `PUT /api/admin/local-users/[id]`

**Important**: Old password invalidated immediately

### Deleting Users

**Restrictions**:
- Cannot delete yourself
- Super-admin required for deletion

**Process**:
1. Find user in list
2. Click "Delete"
3. Confirm action
4. User removed from system

**Endpoint**: `DELETE /api/admin/local-users/[id]`

**Note**: No cascade delete; user's created projects remain

### Roles and Permissions

**Admin**:
- Create, edit, delete projects
- Manage hashtags and categories
- Configure charts and variables
- Export data

**Super-Admin**:
- All admin permissions
- User management (create, delete, regen passwords)
- System configuration
- Critical operations

**Best Practice**: Grant minimum necessary role

---

## 💾 Data Export

### Per-Project CSV

**From Projects List**:
1. Click CSV icon on project row
2. Download starts immediately
3. Format: `EventName_stats_YYYY-MM-DD.csv`

**Contents**:
- Two-column format: Variable | Value
- All stats from project
- Optional: Derived metrics

### Bulk Export (Not Yet Implemented)

Future feature for exporting multiple projects

### Reporting Cadence

**Recommendations**:
- **Weekly**: Download CSV for active events
- **Monthly**: Archive completed events
- **Quarterly**: Aggregate filter reports

**Storage**: Keep CSV files in secure cloud storage (Google Drive, Dropbox)

---

## 🔒 Security Best Practices

### Cookie Reset Tools

**Problem**: Stale cookies prevent login

**Solutions**:

**1. User Self-Service** (`/admin/clear-session`):
- User-friendly page
- Clears all admin cookies
- Auto-redirects to login
- No technical knowledge required

**2. Programmatic** (`/api/admin/clear-cookies`):
- API endpoint
- Clears specific cookies
- Returns success confirmation
- For debugging

**When to Use**:
- "Login Failed" despite correct credentials
- Session expired but still shows logged in
- After password regeneration
- Cross-domain cookie issues

### Least Privilege

**Principle**: Grant minimum access needed

**Implementation**:
- Default new users to `admin` role
- Promote to `super-admin` only when necessary
- Regular permission audits

**Review**:
- Quarterly: Review user list
- Remove inactive accounts
- Downgrade unnecessary super-admins

### Password Hygiene

**Admin Passwords**:
- System-generated (32-char hex)
- Never reused across systems
- Stored as-is (not hashed - MD5-style tokens)

**Page Passwords**:
- Unique per page
- Regenerate if shared too widely
- Track usage via usageCount field

**Rotation Policy**:
- Admin passwords: Every 90 days
- Page passwords: After each event or on compromise

### Session Security

**Session Duration**: 7 days

**HttpOnly Cookies**: JavaScript cannot access

**SameSite**: Lax (CSRF protection)

**Secure Flag**: Production only (HTTPS)

**Best Practices**:
- Logout when done
- Don't share admin accounts
- Use incognito for testing

### Audit Trail

**Current Logging**:
- Page password usage count
- Last used timestamp
- Created/updated timestamps on all entities

**Future Enhancements**:
- Admin action logs
- IP address tracking
- Failed login attempts

---

## 🔧 Troubleshooting

### "Can't Create Project" Error

**Possible Causes**:
- Missing required fields (eventName, eventDate)
- Database connection issue
- Session expired

**Solutions**:
1. Verify all required fields filled
2. Check network connection
3. Refresh page and try again
4. Clear session and re-login

### Charts Not Displaying

**Causes**:
- No data for chart variables
- Chart configuration error
- Grid layout misconfiguration

**Solutions**:
1. Verify project has data
2. Check chart formula uses existing variables
3. Review visualization grid settings
4. Check browser console for errors

### Filter Returns No Results

**Causes**:
- Hashtag typo (case-sensitive)
- No projects with exact hashtag combination
- Database query timeout

**Solutions**:
1. Verify hashtag spelling
2. Try simpler filter (fewer hashtags)
3. Check hashtag exists in system
4. Contact tech support if persistent

### Password Regeneration Fails

**Causes**:
- API endpoint missing
- Insufficient permissions (not super-admin)
- Network error

**Solutions**:
1. Verify you have super-admin role
2. Check browser console for 404 errors
3. Refresh page and retry
4. Contact developer if endpoint missing

### Style Changes Not Applying

**Causes**:
- Browser cache
- CSS override conflicts
- Inline style preventing token usage

**Solutions**:
1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache
3. Check for inline styles in code (prohibited)
4. Verify design tokens properly defined

---

## 📋 Admin Checklist

### Daily Tasks

- [ ] Check new projects for completeness
- [ ] Review stats for active events
- [ ] Respond to access requests (password shares)

### Weekly Tasks

- [ ] Export CSV for completed events
- [ ] Review and update hashtag colors
- [ ] Check for orphaned data (unused hashtags)

### Monthly Tasks

- [ ] User access audit
- [ ] Review filter analytics
- [ ] Update chart configurations
- [ ] Archive old projects (if policy exists)

### Quarterly Tasks

- [ ] Security review (password rotation)
- [ ] Design refresh (if needed)
- [ ] Performance check
- [ ] Documentation updates

---

## 🆘 When to Contact Developers

**Contact technical team if**:
- API endpoints returning 500 errors
- Database connection failures persist
- Charts render incorrectly after updates
- New feature requests
- Security concerns
- Performance degradation

**Before contacting**:
- Note specific error messages
- Take screenshots
- List steps to reproduce
- Check LEARNINGS.md for known issues

---

## 📚 Related Documentation

- **[END_USER_GUIDE.md](END_USER_GUIDE.md)** - For event organizers using stats pages
- **[DEVELOPER_ONBOARDING.md](DEVELOPER_ONBOARDING.md)** - For developers contributing code
- **[AUTHENTICATION_AND_ACCESS.md](AUTHENTICATION_AND_ACCESS.md)** - Detailed auth documentation
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - CSS tokens and components reference
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview

---

**Master your MessMass admin powers! 🎛️**

*MessMass v5.21.2 • Real-time Event Statistics Dashboard*
