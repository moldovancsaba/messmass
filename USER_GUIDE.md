# 📖 MessMass User Guide

**Version:** 6.0.0  
**Last Updated:** 2025-01-21T11:14:00.000Z (UTC)  
**Status:** Production

Complete guide for using the MessMass enterprise event statistics dashboard and management platform.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Project Management](#project-management)
4. [Partners Management](#partners-management)
5. [Quick Add Methods](#quick-add-methods)
6. [Hashtag System](#hashtag-system)
7. [Bitly Integration](#bitly-integration)
8. [Variables & Metrics](#variables--metrics)
9. [Analytics & Charts](#analytics--charts)
10. [Notifications](#notifications)
11. [Advanced Features](#advanced-features)
12. [Best Practices](#best-practices)

---

## Introduction

### What is MessMass?

MessMass is an enterprise-grade event statistics platform designed for collecting, analyzing, and visualizing fan engagement data across multiple events and organizations. It provides real-time collaboration, comprehensive analytics, and intelligent link management for sports events, brand activations, and venue operations.

### Key Capabilities

- **Multi-Event Management**: Track unlimited projects/events with detailed statistics
- **Partner Organizations**: Manage clubs, federations, venues, and brands
- **Intelligent Linking**: Bitly integration with automatic analytics tracking
- **Real-Time Collaboration**: WebSocket-based live updates across team members
- **Smart Categorization**: Hashtag-based filtering with custom categories
- **Dynamic Metrics**: 50+ configurable variables for custom analytics
- **Visual Analytics**: Interactive charts with export capabilities

### Who Should Use This Guide?

- **Event Managers**: Create and track event statistics
- **Marketing Teams**: Analyze fan engagement and campaign performance
- **Data Analysts**: Extract insights from cross-event metrics
- **System Administrators**: Configure platform settings and integrations

---

## Getting Started

### Accessing MessMass

1. **Login**: Navigate to `https://messmass.com/admin/login`
2. **Enter Credentials**: Use your admin password
3. **Dashboard**: You'll be redirected to the Admin Dashboard

### Admin Dashboard Overview

The dashboard provides quick access to all management functions:

- **Project Management** (📊): Create and manage events
- **Partner Management** (🤝): Manage organizations
- **Bitly Links** (🔗): Import and manage tracking links
- **Quick Add** (⚡): Bulk import events
- **Hashtag Categories** (🏷️): Configure categorization
- **Variables** (📈): Customize metrics
- **Help & Docs** (❓): Access documentation

### Navigation

- **Sidebar**: Persistent navigation on the left (collapsible)
- **Top Bar**: Context-specific actions and user menu
- **Search**: Available on all list pages with real-time filtering
- **Sorting**: Click column headers to sort data

---

## Project Management

### Understanding Projects

A **Project** represents a single event (e.g., a sports match, brand activation, concert). Each project tracks:

- **Basic Info**: Event name, date, emoji icon
- **Statistics**: 50+ metrics for images, demographics, merchandise, visits
- **Hashtags**: Traditional and categorized tags for filtering
- **Bitly Links**: Associated tracking URLs with analytics
- **Metadata**: Creation/update timestamps, creator info

### Creating a New Project

#### Method 1: Manual Creation

1. Navigate to **Project Management** from dashboard
2. Click **"Create Project"** button (top-right)
3. Fill in the modal form:
   - **Event Name**: Descriptive title (e.g., "Manchester United vs Liverpool")
   - **Event Date**: Date picker in YYYY-MM-DD format
   - **Emoji** (optional): Single emoji to represent event type (e.g., ⚽ for football)
   - **Hashtags** (optional): Add traditional tags
   - **Categorized Hashtags** (optional): Add category-specific tags (see [Hashtag System](#hashtag-system))
4. Click **"Create Project"**
5. Success message appears; project is added to the list

#### Method 2: Quick Add (Bulk Import)

See [Quick Add Methods](#quick-add-methods) section.

### Editing a Project

1. **Find Project**: Use search or scroll through the project list
2. **Click "Edit"** button on the project row
3. **Edit Modal Opens**:
   - **Basic Info Tab**: Modify name, date, emoji
   - **Hashtags Tab**: Add/remove hashtags
   - **Bitly Links Tab**: View and manage associated links
4. **Make Changes**: Update any fields
5. **Click "Save"**: Changes are saved immediately

**Note**: When you change an event date, all associated Bitly analytics date ranges are automatically recalculated.

### Project Editor (Clicker Mode)

Each project has a dedicated editor page for real-time stat tracking:

#### Accessing Editor

- **From Project List**: Click the event name (blue link)
- **Or**: Navigate to `/edit/[project-slug]`

#### Editor Interface

The editor provides three modes:

##### 1. Clicker Mode (Default)

Fast stat entry using large, color-coded buttons organized in groups:

**Images Group**:
- Remote Images
- Hostess Images  
- Selfies
- *Displays KPI chart: Total Images*

**Location Group**:
- Remote Fans
- Stadium
- *Displays KPI chart: Total Fans*

**Demographics Group**:
- Female / Male
- Gen Alpha / Gen Y/Z / Gen X / Boomer

**Merchandise Group**:
- Merched
- Jersey / Scarf / Flags / Baseball Cap / Other

**How to Use**:
- **Click** a button to increment by +1
- **Double-click** to increment by +10
- **Right-click** to decrement by -1
- Values update in real-time for all connected users

##### 2. Manual Input Mode

For precise data entry or bulk adjustments:

1. **Toggle** to "Manual Input" using the switch
2. **Text Fields** appear for all editable variables
3. **Enter Values** directly
4. **Save** to update all fields at once

**Tip**: Use this mode for copying data from spreadsheets or entering historical data.

##### 3. Success Manager Metrics

Optional advanced metrics section (collapsed by default):

- Event Attendees
- Ticket Purchases
- Value Proposition Visits/Purchases
- Event Results (Home/Visitor)
- QR Code/Short URL/Web/Social Visits

**Access**: Click "Show Success Manager Metrics" to expand.

#### Real-Time Collaboration

- **Live Updates**: All connected users see changes instantly
- **Conflict Prevention**: Last write wins (updates merge automatically)
- **Connection Status**: Green dot = connected, Red = disconnected
- **Auto-Reconnect**: WebSocket reconnects automatically on network issues

### Viewing Public Stats

Every project has a public statistics page:

- **URL Format**: `https://messmass.com/stats/[project-slug]`
- **Password Protection**: Optional (set per-project)
- **Contains**:
  - Event header with date and emoji
  - All KPI charts (merchandise, demographics, location, etc.)
  - Total statistics summary
  - Export buttons for charts

**Sharing**: Copy the URL from the project list and share with stakeholders.

### Filtering Projects

#### Search

The search bar at the top filters projects by:
- Event name
- Hashtags (traditional and categorized)
- Date

**Usage**: Type in the search box; results update in real-time.

#### Sorting

Click any column header to sort:
- **Event Name**: Alphabetical
- **Event Date**: Chronological  
- **Images**: Total image count
- **Fans**: Total fan count
- **Attendees**: Event attendance

**Modes**:
- First click: Ascending (↑)
- Second click: Descending (↓)
- Third click: Clear sorting

#### Pagination

- **Default Load**: 20 projects
- **Load More**: Click "Load 20 more" button at the bottom
- **Infinite Scroll**: Continue loading as needed

### Deleting a Project

1. Find the project in the list
2. Click the **"Delete"** button (red)
3. **Confirm** in the dialog
4. Project is permanently removed

**⚠️ Warning**: This action cannot be undone. All associated stats, hashtags, and Bitly link associations are removed.

---

## Partners Management

### What is a Partner?

A **Partner** is an organization entity that hosts or participates in events. Partners can be:

- **Sports Clubs**: Football teams, basketball clubs, etc.
- **Federations**: National/regional sports associations
- **Venues**: Stadiums, arenas, convention centers
- **Brands**: Sponsors, activators, retailers

### Why Use Partners?

Partners streamline event creation by:
- **Inheriting Metadata**: Hashtags, Bitly links, emoji automatically applied
- **Quick Match Builder**: Create sports match events in seconds
- **Consistency**: Ensure uniform tagging across all events for a club/brand
- **Analytics**: Aggregate metrics across all events for a single partner

### Creating a Partner

1. Navigate to **Partner Management** from dashboard
2. Click **"Add Partner"** button
3. Fill in the modal:
   - **Partner Name**: Official name (e.g., "FC Barcelona")
   - **Partner Emoji**: Representative icon (e.g., ⚽)
   - **Hashtags** (optional): Traditional tags (e.g., `#fcb`, `#barcelona`)
   - **Categorized Hashtags** (optional): 
     - `country: spain`
     - `league: laliga`
     - `sport: football`
   - **Bitly Links** (optional): Use the searchable selector to add tracking links
4. Click **"Create Partner"**

**Best Practice**: Add all relevant hashtags and Bitly links to the partner. These will be inherited by all events associated with this partner.

### Editing a Partner

1. Find partner using search or scroll
2. Click **"Edit"** button
3. Modify any field in the modal
4. Click **"Save Changes"**

**Note**: Changes to a partner's hashtags or links do NOT retroactively update existing events. Only future events will inherit the updated metadata.

### Associating Partners with Events

Partners are linked to events in two ways:

#### Implicit Association (Via Sports Match Builder)

When you use the [Sports Match Builder](#method-2-sports-match-builder) in Quick Add, the home and away teams are automatically associated with the created event.

#### Explicit Association (Future Feature)

Direct partner assignment in project edit modal is planned for a future release.

### Deleting a Partner

1. Find the partner
2. Click **"Delete"** button
3. Confirm deletion

**⚠️ Warning**: Deleting a partner does NOT delete associated events. Events will remain but lose the partner link.

---

## Quick Add Methods

The **Quick Add** page provides two methods for rapid event creation: bulk import from spreadsheets and an intelligent sports match builder.

### Method 1: Import from Google Sheets

This method is ideal for importing multiple events at once from a formatted spreadsheet.

#### Step 1: Prepare Your Data

Create a Google Sheet with the following columns (in this exact order):

| Column | Description | Example | Required |
|--------|-------------|---------|----------|
| Event Name | Full event title | `⚽ Real Madrid vs Barcelona` | Yes |
| Event Date | YYYY-MM-DD format | `2025-03-15` | Yes |
| Hashtags | Comma-separated | `#realmadrid,#barcelona,#elclasico` | No |
| remoteImages | Number | `150` | No |
| hostessImages | Number | `45` | No |
| selfies | Number | `89` | No |
| remoteFans | Number | `234` | No |
| female | Number | `120` | No |
| male | Number | `114` | No |
| stadium | Number | `85000` | No |
| merched | Number | `12500` | No |
| ... | (Any other stat) | ... | No |

**Notes**:
- The first two columns (Event Name, Event Date) are mandatory
- All other columns are optional
- You can include any statistic variable name as a column
- Empty cells will be treated as 0

#### Step 2: Copy Data

1. Select all rows (including header)
2. Copy (Ctrl+C or Cmd+C)

#### Step 3: Paste and Import

1. Go to **Quick Add** page
2. Ensure **"From Sheet"** tab is selected
3. Paste data into the text area (Ctrl+V or Cmd+V)
4. Click **"Parse and Preview"**

#### Step 4: Review Preview

The system will display:
- Number of events detected
- List of all events with parsed data
- Validation errors (if any)

**Common Errors**:
- Missing Event Name or Date
- Invalid date format
- Non-numeric values in stat columns

#### Step 5: Import

1. Review the preview
2. Click **"Import All"** button
3. Wait for confirmation
4. Success! All events are created

**Result**: You can now find your imported events in the Project Management page.

### Method 2: Sports Match Builder

This intelligent builder creates sports match events by combining two partner organizations.

#### When to Use This

- Creating sports matches (team vs team)
- Events with two opposing sides
- When you want to automatically inherit metadata from partners

#### How It Works

The builder generates an event using this logic:

1. **Event Name**: `[Partner1 Emoji] [Partner1 Name] x [Partner2 Name]`
2. **Event Date**: Selected date
3. **Hashtags**:
   - ALL hashtags from Partner 1
   - ONLY non-location hashtags from Partner 2
   - Duplicates automatically removed
4. **Bitly Links**: ALL links from Partner 1

**Example**:

**Partner 1**: Manchester United
- Emoji: ⚽
- Hashtags: `#mufc`, `#manchester`, country:`uk`, league:`premierleague`
- Bitly Links: `bit.ly/mufc-fanzone`

**Partner 2**: Liverpool FC
- Emoji: ⚽
- Hashtags: `#lfc`, `#liverpool`, country:`uk`, league:`premierleague`
- Bitly Links: `bit.ly/lfc-shop`

**Selected Date**: 2025-03-20

**Generated Event**:
- Name: `⚽ Manchester United x Liverpool FC`
- Date: `2025-03-20`
- Hashtags: `#mufc`, `#manchester`, `#lfc`, `#liverpool`, league:`premierleague`, country:`uk` (deduplicated)
- Bitly Links: `bit.ly/mufc-fanzone`

#### Step-by-Step Process

1. **Navigate**: Go to Quick Add page
2. **Select Tab**: Click "Sports Match" tab
3. **Select Home Team**:
   - Click the Partner 1 selector
   - Type to search (predictive)
   - Click a partner from dropdown
   - Selected partner appears as a chip
4. **Select Away Team**:
   - Repeat process for Partner 2 selector
5. **Pick Date**:
   - Click date picker
   - Select match date
6. **Preview**:
   - Click **"Preview Match"** button
   - Review generated event details
7. **Create**:
   - Click **"Create Event"** button
   - Confirmation appears
   - Event is created

**Tip**: You can click the (×) on a partner chip to change your selection.

#### Location Hashtag Handling

The builder intelligently excludes **location category hashtags** from Partner 2 to prevent conflicts.

**Why?** In a sports match:
- Partner 1 (home team) provides the event location
- Partner 2 (away team) should not override the location

**Categories Excluded from Partner 2**:
- `location: [anything]`

**Example**:
- Partner 1: `location: manchester`
- Partner 2: `location: liverpool`
- Result: Only `location: manchester` is included

---

## Hashtag System

MessMass uses a **unified hashtag system** with two types: traditional hashtags and categorized hashtags.

### Traditional Hashtags

Simple tags for quick filtering.

**Format**: `#tagname` (prefix optional when entering)

**Examples**:
- `#football`
- `#concert`
- `#activation`

**Where to Add**:
- Project creation/edit modal
- Partner creation/edit modal
- Quick Add import (comma-separated)

### Categorized Hashtags

Advanced tagging system with predefined categories for structured filtering.

**Format**: `category:value`

**Built-In Categories**:
- `country`: Geographic location (e.g., `country:spain`, `country:germany`)
- `league`: Sports league (e.g., `league:nba`, `league:premierleague`)
- `sport`: Sport type (e.g., `sport:football`, `sport:basketball`)
- `location`: Venue/city (e.g., `location:madrid`, `location:newyork`)
- `brand`: Brand activations (e.g., `brand:nike`, `brand:cocacola`)

### Creating Custom Categories

1. Navigate to **Hashtag Categories** from dashboard
2. Click **"Create Category"** button
3. Fill in the form:
   - **Category Name**: Lowercase, no spaces (e.g., `venue`, `campaign`)
   - **Display Label**: Human-readable (e.g., "Venue", "Campaign")
   - **Color**: Hex code (e.g., `#FF5733`)
4. Click **"Create"**

**Color Inheritance**: All hashtags in this category will display with the assigned color in the UI.

### Using Categorized Hashtags

#### In Project/Partner Forms

1. Click the categorized hashtag input
2. Select a category from the dropdown (or type category name)
3. Type the value (e.g., after selecting "country", type "france")
4. Press Enter to add
5. Hashtag appears as a colored chip

#### Editing/Removing

- Click the (×) on any chip to remove
- Chips are removable in both display and input modes

### Hashtag-Based Filtering

#### Public Filter Page

Every hashtag has a public filter page:

**URL Format**: `https://messmass.com/filter/[hashtag-slug]`

**Examples**:
- `https://messmass.com/filter/football`
- `https://messmass.com/filter/country-spain`

**Contents**:
- Aggregated stats from ALL projects with that hashtag
- Combined KPI charts
- List of matching projects

**Use Case**: Share aggregate statistics for a specific country, league, or brand across all events.

#### Admin Filtering

In the Project Management page:
1. Use the search bar
2. Type a hashtag (traditional or categorized)
3. Results filter in real-time

---

## Bitly Integration

MessMass integrates with Bitly for intelligent link tracking and analytics.

### What is Bitly Integration?

- **Automatic Import**: Pull all your Bitly links into MessMass
- **Project Association**: Link tracking URLs to specific events
- **Analytics Sync**: Daily refresh of click data, geography, referrers, devices
- **Date Range Intelligence**: Automatically attribute analytics to the correct event based on dates

### Setting Up Bitly

#### Prerequisites

You need:
- Bitly account with API access
- Access Token
- Organization GUID
- Group GUID

#### Configuration (Admin Only)

Environment variables (set by system administrator):

```
BITLY_ACCESS_TOKEN=your_token
BITLY_ORGANIZATION_GUID=your_org_guid
BITLY_GROUP_GUID=your_group_guid
```

### Importing Bitly Links

#### Initial Import

1. Navigate to **Bitly Links** from dashboard
2. Click **"Get Links from Bitly"** button
3. Confirmation dialog appears
4. Click **"Import"**
5. Wait for process to complete

**What Happens**:
- System fetches up to 100 recent links from your Bitly group
- Filters out links that already exist
- Imports new links with full metadata
- Fetches complete analytics for each new link

**Note**: The first import may take 30-60 seconds if you have many new links.

#### Subsequent Imports

Use the same button to:
- Check for new Bitly links
- Update analytics for existing links

**Best Practice**: Run this weekly or after creating new Bitly campaigns.

### Managing Bitly Links

#### Viewing Links

The Bitly Links page displays:
- **Bitly Link**: Short URL (e.g., `bit.ly/abc123`)
- **Title**: Link title from Bitly
- **Project**: Associated event(s) (if any)
- **Clicks**: Total click count
- **Last Synced**: Last analytics refresh timestamp

#### Sorting

Click column headers to sort by:
- Link (alphabetical)
- Title (alphabetical)
- Clicks (numeric)
- Last Synced (chronological)

#### Searching

Use the search bar to filter by:
- Bitly short URL
- Link title
- Associated project name

#### Pagination

- Default: 20 links per page
- Click "Load 20 more" to fetch next batch

### Associating Links with Projects

Bitly links support **many-to-many relationships**: one link can be associated with multiple events, and one event can have multiple links.

#### Method 1: From Bitly Page

1. Find the link in the Bitly Links table
2. Locate the "Project" column
3. Use the **inline project selector**:
   - Click the selector (looks like the hashtag input)
   - Type to search for a project
   - Click a project from the dropdown
   - Project is added as a chip
4. Repeat to add multiple projects

**Removing Association**:
- Click the (×) on a project chip
- Confirmation dialog appears
- Click "Remove" to confirm

#### Method 2: From Project Edit Modal

1. Go to Project Management
2. Click "Edit" on a project
3. Navigate to the **"Bitly Links"** tab
4. View all associated links
5. Click "Remove" button to unlink

#### Method 3: Via Partners

When you create a partner with Bitly links, those links are automatically associated with events created using that partner in the Sports Match Builder.

### Understanding Analytics Attribution

#### The Many-to-Many Challenge

When a single Bitly link is used across multiple events (e.g., a season-long campaign URL), MessMass needs to attribute the analytics to the correct event.

#### Smart Date Ranges

MessMass automatically calculates date ranges for each link-project association:

**Algorithm**:
1. Sort all events using a link by event date (oldest first)
2. For the **oldest** event: Assign all clicks from beginning of time until `eventDate + 2 days`
3. For **middle** events: Assign clicks from `previous eventDate + 2 days` to `this eventDate + 2 days`
4. For the **newest** event: Assign all clicks from `eventDate + 2 days` to end of time

**Example**:

Link: `bit.ly/season-pass`

Events:
- Event A: 2025-03-01
- Event B: 2025-03-15  
- Event C: 2025-04-05

**Date Ranges**:
- Event A: `[beginning] → 2025-03-03`
- Event B: `2025-03-03 → 2025-03-17`
- Event C: `2025-03-17 → [end]`

**Why +2 days?** Provides a buffer for post-event engagement (sharing photos, discussing the match, etc.).

#### Cached Metrics

To avoid recalculating date ranges on every page load, MessMass caches:
- Total clicks for this event
- Click distribution by country
- Click distribution by referrer
- Unique clicks (estimated)

**Cache Refresh**:
- **Automatic**: Daily at midnight (background job)
- **Manual**: Click "Refresh Analytics" on the project or Bitly page

### Analytics Available

For each Bitly link, MessMass tracks:

#### Core Metrics
- Total clicks
- Unique clicks (Bitly's estimate)
- Click timeseries (daily breakdown)

#### Geographic Data
- Clicks by country (2-letter ISO code)
- Top 10 countries ranked

#### Referrer Data
- Clicks by referring platform (facebook, twitter, instagram, etc.)
- Clicks by referring domain (facebook.com, google.com, etc.)
- Direct clicks (no referrer)

#### Device & Platform Data
- Clicks by device (mobile, desktop, tablet)
- Clicks by OS (iOS, Android, Windows, Mac, etc.)
- Clicks by browser (Chrome, Safari, Firefox, etc.)

### Bitly Variables in Analytics

All Bitly metrics are available as variables in the [Variables & Metrics](#variables--metrics) system:

**Variable Group**: `Bitly`

**Examples**:
- `totalBitlyClicks`: Sum of all clicks from all associated links
- `uniqueBitlyClicks`: Estimated unique visitors
- `bitlyClicksByCountryUS`: Clicks from United States
- `bitlyClicksByReferrerFacebook`: Clicks from Facebook

**Usage**: Include these in custom chart formulas for cross-metric analysis.

---

## Variables & Metrics (v7.0.0 - Database-First System)

MessMass uses a **database-first variable management system** where all variables are stored in MongoDB and seeded on server initialization. This ensures consistency and centralized control.

### What is a Variable?

A **variable** is a named metric stored in the `variables_metadata` collection and referenced in code using the **Single Reference System** (`stats.` prefix).

Variables can be:
- **Tracked**: Manually entered or clicker-incremented
- **Derived**: Auto-calculated from other variables
- **Displayed**: Shown in editors, charts, and reports
- **Customized**: UI labels (aliases) editable without changing database fields

### Variable Types

#### System Variables (96 total)

Pre-configured variables seeded from `lib/variablesConfig.ts`. All system variables have `isSystemVariable: true` in the database.

**Categories:**
- **Images**: `remoteImages`, `hostessImages`, `selfies`
- **Fans**: `remoteFans`, `stadium`
- **Demographics**: `female`, `male`, `genAlpha`, `genYZ`, `genX`, `boomer`
- **Merchandise**: `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`
- **Visits**: `visitQrCode`, `visitShortUrl`, `visitWeb`, `socialVisit`
- **Event**: `eventAttendees`, `eventResultHome`, `eventResultVisitor`
- **Bitly**: `totalBitlyClicks`, `uniqueBitlyClicks`, and 80+ country/referrer/device metrics

#### Derived Variables

Auto-calculated from other variables. Examples:
- `allImages`: `remoteImages + hostessImages + selfies`
- `totalFans`: `remoteFans + stadium`
- `totalVisit`: Sum of all visit sources

**Important**: Derived variables are marked with `type: 'derived'` and have `editableInManual: false` to prevent manual editing.

#### Custom Variables

User-created metrics via KYC Management interface. 

**Characteristics**:
- `isSystemVariable: false` in database
- Stored in `project.stats` just like system variables
- Full control over name, alias, type, category, and visibility flags

**Examples**:
- `vipGuests`: VIP attendees
- `pressCount`: Media representatives
- `sponsorBooth`: Sponsor booth visitors

#### Text Variables

Non-numeric metadata (type: `text`). Examples:
- `eventResultHome`: Home team score
- `eventResultVisitor`: Away team score

**Important**: Text variables have `editableInManual: true` but `visibleInClicker: false` (clicker is numeric-only).

### Managing Variables via KYC Management

**KYC Management** is the admin interface for configuring variables. Access it at `/admin/kyc`.

#### Viewing All Variables

1. Navigate to **KYC Management** from admin dashboard
2. Variables are organized by category:
   - Images
   - Fans (Location)
   - Demographics
   - Merchandise
   - Visits
   - Event
   - Bitly
   - Custom
3. Each card displays:
   - **Name**: Database field name (immutable for system variables)
   - **Alias**: UI display label (editable for all variables)
   - **Type**: `number`, `text`, or `derived`
   - **Category**: Grouping label
   - **System Badge**: Green "System" badge if `isSystemVariable: true`
   - **Visibility Flags**: Checkboxes for Clicker and Manual

#### Understanding Aliases vs. Names

**Critical Concept**: The `alias` field is ONLY a UI display label. It does NOT affect:
- Database field names (always use `name` field, e.g., `remoteImages`)
- Code references (always use `stats.name`, e.g., `stats.remoteImages`)
- Formula syntax (always use `stats.name` or SEYU tokens)

**What Alias Controls**:
- Button labels in Clicker Mode
- Field labels in Manual Input Mode
- Chart legends and axis labels
- Admin UI display text

**Example**:
- **Name**: `remoteImages` (immutable, used in code)
- **Alias**: "Remote Photos" (editable, shown to users)
- **Database Access**: `project.stats.remoteImages` (uses name, not alias)

#### Editing an Alias (Display Label)

1. Find the variable card in KYC Management
2. Click into the **"Alias"** field
3. Type a new display name (e.g., change "Remote Images" to "Remote Photos")
4. Press Enter or click outside the field
5. Changes save automatically

**Result**: UI labels update immediately; database field name unchanged.

#### Creating a Custom Variable

1. Scroll to the bottom of KYC Management page
2. Click **"Add Variable"** button
3. Fill in the form:
   - **Variable Name**: Camelcase, no spaces (e.g., `vipGuests`)
   - **Alias (Display Label)**: Human-readable (e.g., "VIP Guests")
   - **Variable Type**: `number` or `text`
   - **Category**: Select from dropdown or type new category
   - **Visible in Clicker**: Show as button in editor? (checkbox)
   - **Editable in Manual**: Allow manual input? (checkbox)
4. Click **"Create Variable"**

**Result**: 
- Variable is added to `variables_metadata` collection with `isSystemVariable: false`
- Immediately available in project editor
- Stored in `project.stats` when values are entered

#### Editing Variable Flags

1. Find the variable card
2. Toggle checkboxes:
   - **Visible in Clicker**: Show in Clicker Mode buttons
   - **Editable in Manual**: Show in Manual Input fields
3. Changes auto-save

**Note**: Derived variables always have `editableInManual: false` (enforced by system).

#### Deleting a Custom Variable

**Restriction**: Only custom variables (`isSystemVariable: false`) can be deleted.

1. Find the custom variable card
2. Click **"Delete"** button (only visible for custom variables)
3. Confirm deletion

**⚠️ Warning**: Deleting a variable removes it from `variables_metadata` but does NOT delete existing data in `project.stats`. Historical data remains but is no longer visible/editable in the UI.

### Variable Flags

Each variable has two independent flags:

#### Visible in Clicker

- **Purpose**: Controls whether variable appears as a button in Clicker Mode
- **Default**: `true` for Images, Fans, Demographics, Merchandise; `false` for others
- **Use Case**: Hide variables that are rarely used or better suited for manual input

#### Editable in Manual

- **Purpose**: Controls whether variable appears in Manual Input Mode
- **Default**: `true` for all base variables; `false` for derived/text variables
- **Use Case**: Prevent manual editing of auto-calculated metrics

**Example**:
- `allImages` (derived): `visibleInClicker = false`, `editableInManual = false`
- `remoteImages` (base): `visibleInClicker = true`, `editableInManual = true`

### Variable Groups & Ordering

Variables in Clicker Mode are organized into groups with optional KPI charts.

#### Default Groups

1. **Images**: remoteImages, hostessImages, selfies → Shows "Total Images" chart
2. **Location**: remoteFans, stadium → Shows "Total Fans" chart
3. **Demographics**: female, male, genAlpha, genYZ, genX, boomer
4. **Merchandise**: merched, jersey, scarf, flags, baseballCap, other

#### Managing Groups

1. Go to Variables page
2. Scroll to **"Variable Groups"** section
3. Click **"Edit Groups"** button
4. Modal opens with drag-and-drop interface:
   - Reorder groups
   - Reorder variables within groups
   - Assign KPI charts to groups
   - Rename group titles
5. Click **"Save"**

#### Reordering Clicker Buttons

For quick button reordering within categories without touching groups:

1. Click **"Reorder Clicker"** button
2. Drag and drop buttons within their category
3. Click **"Save Order"**

**Result**: Button order updates immediately in all project editors.

### Single Reference System

All code and formulas MUST use the `stats.` prefix when accessing variables:

**Correct Pattern**:
```typescript
const value = project.stats.remoteImages; // ✅
const formula = 'stats.remoteImages + stats.hostessImages'; // ✅
```

**Incorrect Pattern**:
```typescript
const value = project.remoteImages; // ❌ Wrong: bypasses single source of truth
const formula = 'remoteImages + hostessImages'; // ❌ Wrong: no stats. prefix
```

**Why?** All variables are stored in MongoDB under `project.stats`, ensuring a single source of truth and preventing data inconsistencies.

### SEYU Reference Tokens

For **legacy chart formulas**, variables can be referenced using **SEYU tokens**.

**Format**: `[SEYUVARIABLENAME]`

**Example**:
```
([SEYUMERCHEDFANS] / [SEYUTOTALFANS]) * [SEYUATTENDEES]
```

**Normalization Rules**:
- `ALL` → `TOTAL` (e.g., `allImages` → `[SEYUTOTALIMAGES]`)
- `VISITED` → `VISIT` (e.g., `visited` → `[SEYUVISIT]`)
- Location vars → Add `FANS` suffix (e.g., `stadium` → `[SEYUSTADIUMFANS]`)
- Merch vars → Add `MERCH` prefix (e.g., `jersey` → `[SEYUMERCHERSEY]`)

**Important**: SEYU tokens use the variable **name** field, NOT the alias. Changing an alias does NOT change the SEYU token.

**Where to Use**: Chart definition formulas in the chart configuration system (legacy support).

---

## Analytics & Charts

MessMass provides rich visual analytics with multiple chart types and export capabilities.

### Available Charts

#### 1. All Images Taken (Pie Chart)

**Metrics**:
- Remote Images
- Hostess Images
- Selfies

**Calculated**:
- Total Images (sum)
- Percentages per type

**Formula**: N/A (direct values)

#### 2. Total Fans (Pie Chart)

**Metrics**:
- Remote Fans
- Stadium

**Calculated**:
- Total Fans (sum)
- Percentages per location

#### 3. Merchandise Penetration (Horizontal Bar)

**Metric**: Core Fan Team

**Formula**:
```
(Merched Fans / Total Fans) × Attendees
```

**Interpretation**: Estimated number of attendees wearing team merchandise.

#### 4. Fan Engagement (Horizontal Bar)

**Metric**: Fan Engagement Rate

**Formula**:
```
(Total Images / Attendees) × 100
```

**Interpretation**: Percentage of attendees who took photos.

#### 5. Value Generated (Horizontal Bar)

**Metric**: Value per Image

**Formula**:
```
Total Images / 1000
```

**Interpretation**: Arbitrary value metric (customizable).

#### 6. Gender Distribution (Pie Chart)

**Metrics**:
- Female
- Male

**Calculated**:
- Total (sum)
- Percentages per gender

#### 7. Age Groups (Pie Chart)

**Metrics**:
- Gen Alpha
- Gen Y/Z
- Gen X
- Boomer

**Calculated**:
- Total (sum)
- Percentages per generation

#### 8. Location (Pie Chart)

**Metrics**:
- Indoor
- Outdoor
- Stadium

**Calculated**:
- Total (sum)
- Percentages per location type

*(This chart is distinct from "Total Fans" and represents location categories rather than fan origins.)*

#### 9. Sources (Horizontal Bar)

**Metrics**:
- Visit QR Code
- Visit Short URL
- Visit Web
- Social Visit

**Calculated**:
- Total Visits (sum)
- Percentages per source

### Viewing Charts

Charts are available in three places:

#### Public Stats Page

- Navigate to `/stats/[project-slug]`
- All charts displayed in a responsive grid
- No editing; read-only view

#### Project Editor Page

- Navigate to `/edit/[project-slug]`
- Charts displayed above Clicker Mode buttons
- Updates in real-time as stats change

#### Hashtag Filter Page

- Navigate to `/filter/[hashtag-slug]`
- Aggregated charts for all projects with that hashtag

### Exporting Charts

Each chart has an **"Export Chart"** button (camera icon).

**Process**:
1. Click the export button
2. Chart is rendered as PNG image
3. Image downloads automatically

**File Name Format**: `[chart-name]-[project-name]-[timestamp].png`

**Use Case**: Include charts in presentations, reports, social media posts.

### Custom Charts (Advanced)

Future feature: Admin-defined custom charts with formula builder.

---

## Notifications

MessMass provides real-time notifications for team collaboration.

### Notification Types

#### ✨ Project Created

Triggered when any user creates a new project.

**Contains**:
- Creator name
- Project name
- Timestamp

#### ✏️ Project Details Updated

Triggered when event name, date, or emoji is changed.

**Contains**:
- Editor name
- Project name
- Timestamp

#### 📊 Statistics Modified

Triggered when any statistic is updated (via clicker or manual input).

**Contains**:
- Editor name
- Project name
- Timestamp

### Notification Grouping

To prevent spam, MessMass groups similar notifications within a **5-minute window**.

**How It Works**:
- If you edit the same project multiple times within 5 minutes, only ONE notification is shown.
- The notification timestamp updates to the most recent action.
- This prevents the notification panel from being cluttered during rapid editing workflows.

**Example**:
- 10:00 AM: Edit stats → Notification created
- 10:02 AM: Edit stats again → Notification timestamp updated to 10:02
- 10:10 AM: Edit stats again → NEW notification created (>5 minutes elapsed)

### Viewing Notifications

#### Notification Panel

1. Click the **bell icon** (🔔) in the top-right corner
2. Panel slides open
3. View all recent notifications

**Indicators**:
- **Badge**: Number of unread notifications
- **Bold Text**: Unread notification
- **Normal Text**: Read notification

#### Marking as Read

- **Single**: Click a notification → Opens the related project → Marks as read
- **All**: Click "Mark all as read" at the bottom

#### Archiving

1. Hover over a notification
2. Click the **archive icon** (📦)
3. Notification is hidden from the panel

**Note**: Archived notifications are not deleted; they're just hidden. No UI to view archived notifications currently exists.

### Notification Settings

Future feature: Per-user notification preferences.

---

## Advanced Features

### Real-Time WebSocket System

#### How It Works

MessMass uses WebSocket technology for live collaboration:

**Architecture**:
- Standalone WebSocket server (port 7654)
- Project-based rooms for isolation
- Automatic reconnection with exponential backoff

**Message Types**:
- `join-project`: User enters editor
- `stat-update`: Statistic changed
- `project-update`: Metadata changed
- `heartbeat`: Keep connection alive

#### Connection Status

**Indicators**:
- Green dot (🟢): Connected
- Red dot (🔴): Disconnected
- Yellow dot (🟡): Reconnecting

**Troubleshooting**:
- If stuck on red, refresh the page
- Check browser console for WebSocket errors
- Ensure firewall allows WebSocket connections

### Authentication & Access Control

#### Admin Session

- **Login**: `/admin/login`
- **Session**: HTTP-only cookie
- **Timeout**: 24 hours
- **Logout**: Automatic or manual via user menu

#### Public Page Passwords

Individual public stats pages can be password-protected (future feature).

### Database Backup

MessMass uses **MongoDB Atlas** with automatic daily backups.

**Retention**: 7 days rolling backup

**Restore**: Contact system administrator

### API Access

MessMass provides a REST API for all CRUD operations.

**Base URL**: `https://messmass.com/api`

**Authentication**: Session-based (same as admin UI)

**Endpoints**: See `API_REFERENCE.md` (future document)

---

## Best Practices

### Event Naming

- **Include Emojis**: Makes events visually distinct (e.g., `⚽ Barcelona vs Real Madrid`)
- **Be Specific**: Include full team/brand names
- **Add Context**: Include tournament/campaign name if relevant (e.g., `🏆 Champions League Final`)

### Hashtag Strategy

- **Use Categories**: Prefer categorized hashtags (`country:spain`) over traditional (`#spain`)
- **Be Consistent**: Use the same category values across events (e.g., always `country:uk`, not `country:unitedkingdom`)
- **Don't Over-Tag**: 3-7 hashtags per event is optimal
- **Leverage Partners**: Add hashtags to partners, not individual events

### Partner Management

- **Create Partners Early**: Set up all clubs/brands before creating events
- **Maintain Metadata**: Keep partner hashtags and Bitly links up-to-date
- **Use Sports Match Builder**: Save time and ensure consistency

### Bitly Link Workflow

1. **Create Links in Bitly**: Use Bitly's interface to create tracking URLs
2. **Import to MessMass**: Click "Get Links from Bitly" weekly
3. **Associate with Projects**: Use inline selectors or Sports Match Builder
4. **Refresh Analytics**: Run manual refresh before important reports

### Data Entry

- **Use Clicker Mode**: Fastest for real-time tracking at events
- **Use Manual Mode**: Best for bulk updates or historical data
- **Double-Check**: Verify data before saving (no undo for stat changes)
- **Collaborate**: Multiple users can edit simultaneously; changes merge automatically

### Performance Tips

- **Use Search**: Don't scroll through 1000s of projects; filter by hashtag or name
- **Load On-Demand**: Use pagination; don't load all data at once
- **Clear Old Sessions**: Logout when done to free server resources

### Security

- **Strong Passwords**: Use complex admin passwords
- **Logout on Shared Computers**: Always logout on public/shared devices
- **Limit Access**: Only grant admin access to trusted team members

---

## FAQ

### General

**Q: Can I undo a deleted project?**  
A: No. Deletion is permanent. Always confirm before deleting.

**Q: How many users can edit a project at once?**  
A: Unlimited. The WebSocket system handles concurrent edits.

**Q: Is there a mobile app?**  
A: No, but the web interface is fully responsive and works on tablets/phones.

### Projects

**Q: Can I change the project slug?**  
A: No. Slugs are auto-generated from the event name at creation and cannot be changed.

**Q: What happens if two events have the same name?**  
A: Slugs are made unique by appending a number (e.g., `event-name-2`).

**Q: Can I merge two projects?**  
A: Not currently. This is a future feature.

### Hashtags

**Q: Can I rename a hashtag category?**  
A: Yes, edit the category in Hashtag Categories management.

**Q: What happens to existing hashtags if I delete a category?**  
A: The hashtags remain but lose their category association and color.

**Q: Can I use spaces in hashtag values?**  
A: No. Use hyphens or camelCase (e.g., `location:new-york` or `location:newYork`).

### Bitly

**Q: Why don't I see my Bitly link?**  
A: You may need to import it. Click "Get Links from Bitly" to fetch recent links.

**Q: Can I edit Bitly link titles in MessMass?**  
A: No. Titles are synced from Bitly and read-only. Edit in Bitly's interface.

**Q: How often are analytics refreshed?**  
A: Automatically every 24 hours. You can manually refresh anytime.

**Q: What if a Bitly link is used for multiple events in the same day?**  
A: MessMass uses creation timestamps as a tiebreaker to separate the date ranges.

### Variables

**Q: Can I delete a built-in variable?**  
A: No. Only custom variables can be deleted.

**Q: What if I hide a variable from Clicker but it's still in use?**  
A: The data remains; you just can't increment it via clicker. Use Manual Input instead.

**Q: Can I change the SEYU token for a variable?**  
A: No. SEYU tokens are auto-generated based on strict rules and cannot be customized.

---

## Support & Contact

### Documentation

- **Full Tech Docs**: See `ARCHITECTURE.md`, `API_REFERENCE.md`, `COMPONENTS_REFERENCE.md`
- **Code Repository**: Internal GitLab/GitHub repo
- **Issue Tracking**: Use project management tool

### Getting Help

- **In-App Help**: Click ❓ icon in admin dashboard
- **Email**: support@messmass.com (if configured)
- **System Administrator**: Contact your organization's MessMass admin

### Reporting Bugs

1. Note the exact steps to reproduce
2. Include browser/device info
3. Take screenshots if possible
4. Submit via issue tracker

### Feature Requests

Feature requests are welcome! Submit via your organization's feedback channel.

---

**MessMass Version 6.0.0**  
**Last Updated: 2025-01-21T11:14:00.000Z (UTC)**  
**© 2025 MessMass Platform**
