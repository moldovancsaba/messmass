import { Metadata } from 'next';
import styles from './page.module.css';

/* What: Admin help page displaying the user guide
   Why: Make END_USER_GUIDE.md content accessible to admins within the application */

export const metadata: Metadata = {
  title: 'User Guide - MessMass Admin',
  description: 'Complete user guide for MessMass event statistics dashboard',
};

export default function HelpPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>📖 MessMass User Guide</h1>
          <p className={styles.subtitle}>
            Complete guide for using MessMass event statistics dashboard
          </p>
        </header>

        <nav className={styles.toc}>
          <h2>Table of Contents</h2>
          <ul>
            <li><a href="#getting-started">Getting Started</a></li>
            <li><a href="#sharing">Sharing Reports (Event & Partner)</a></li>
            <li><a href="#stats-page">Understanding the Stats Page</a></li>
            <li><a href="#live-tracking">Live Event Tracking (Clicker)</a></li>
            <li><a href="#kyc-management">KYC Management (Variables)</a></li>
            <li><a href="#exporting">Exporting Data</a></li>
            <li><a href="#metrics">Understanding Metrics</a></li>
            <li><a href="#hashtags">Hashtag System</a></li>
            <li><a href="#troubleshooting">Troubleshooting</a></li>
          </ul>
        </nav>

        <section id="getting-started" className={styles.section}>
          <h2>🚀 Getting Started</h2>
          
          <h3>Accessing Your Event Dashboard</h3>
          <p>
            MessMass provides different ways to access your event statistics:
          </p>
          <ul>
            <li><strong>Admin Login:</strong> Full access to create, edit, and manage projects</li>
            <li><strong>View Link:</strong> Public stats page for viewing completed event data</li>
            <li><strong>Edit Link:</strong> Live tracking page for collecting data during events</li>
          </ul>

          <h3>Event Selection</h3>
          <p>
            Once logged in, you can select events from the Projects page. Each event has:
          </p>
          <ul>
            <li><strong>Event Name:</strong> Unique identifier for the event</li>
            <li><strong>Event Date:</strong> When the event took place</li>
            <li><strong>Hashtags:</strong> Categories and labels for organization</li>
          </ul>
        </section>

        <section id="stats-page" className={styles.section}>
          <h2>📊 Understanding the Stats Page</h2>
          
          <h3>Reading Charts</h3>
          <p>
            The stats page displays your event data in visual charts:
          </p>
          <ul>
            <li><strong>Pie Charts:</strong> Show proportional breakdowns (gender, age groups)</li>
            <li><strong>Bar Charts:</strong> Compare different categories side by side</li>
            <li><strong>KPI Cards:</strong> Display key numbers at a glance</li>
          </ul>

          <h3>Chart Layout</h3>
          <div className={styles.codeBlock}>
            Row 1: Merchandise | Engagement | Value<br />
            Row 2: Gender Distribution | Age Groups<br />
            Row 3: Location | Sources
          </div>

          <h3>Interactive Features</h3>
          <ul>
            <li>Click on chart segments for detailed breakdowns</li>
            <li>Hover over elements to see exact numbers</li>
            <li>Export charts as PNG images using the download button</li>
          </ul>
        </section>

        <section id="live-tracking" className={styles.section}>
          <h2>⚡ Live Event Tracking (Clicker)</h2>
          
          <h3>Accessing the Event Editor</h3>
          <ol>
            <li>Go to <strong>Events</strong> page (<code>/admin/events</code>)</li>
            <li>Click on the <strong>event name</strong> (blue link) to open the editor</li>
            <li>Or use the direct URL: <code>/edit/[event-slug]</code></li>
          </ol>

          <h3>Editor Modes</h3>
          <p>
            The editor provides two modes for data entry:
          </p>

          <h4>1. Clicker Mode (Default)</h4>
          <p>
            Fast, button-based data entry organized in groups:
          </p>
          <ul>
            <li><strong>Images Group:</strong> Remote Images, Hostess Images, Selfies
              <ul>
                <li>Shows live KPI chart: &ldquo;All Images Taken&rdquo;</li>
              </ul>
            </li>
            <li><strong>Location Group:</strong> Remote Fans, Stadium
              <ul>
                <li>Shows live KPI chart: &ldquo;Total Fans&rdquo;</li>
              </ul>
            </li>
            <li><strong>Demographics Group:</strong> Female, Male, Gen Alpha, Gen Y/Z, Gen X, Boomer</li>
            <li><strong>Merchandise Group:</strong> Merched, Jersey, Scarf, Flags, Baseball Cap, Other</li>
          </ul>

          <h4>Clicker Interaction Methods</h4>
          <ul>
            <li><strong>Single Click:</strong> Increment by +1</li>
            <li><strong>Double Click:</strong> Increment by +10 (fast entry for large crowds)</li>
            <li><strong>Right Click:</strong> Decrement by -1 (undo mistakes)</li>
          </ul>

          <h4>Visual Feedback</h4>
          <ul>
            <li>Button shows current value below the label</li>
            <li>KPI charts update in real-time as you click</li>
            <li>All connected users see updates instantly (WebSocket)</li>
          </ul>

          <h4>2. Manual Input Mode</h4>
          <p>
            Precise data entry using text fields:
          </p>
          <ul>
            <li>Toggle to Manual Mode using the switch at the top</li>
            <li>All editable variables appear as text input fields</li>
            <li>Enter exact numbers (e.g., when copying from spreadsheets)</li>
            <li>Includes Success Manager metrics (attendees, ticket purchases, visits, etc.)</li>
            <li>Click <strong>&ldquo;Save&rdquo;</strong> to update all fields at once</li>
          </ul>

          <h3>Success Manager Metrics (Optional Section)</h3>
          <p>
            Click <strong>&ldquo;Show Success Manager Metrics&rdquo;</strong> to expand additional fields:
          </p>
          <ul>
            <li>Event Attendees</li>
            <li>Event Ticket Purchases</li>
            <li>Value Proposition Visits/Purchases</li>
            <li>Event Results (Home/Visitor scores)</li>
            <li>Visit Sources (QR Code, Short URL, Web, Social)</li>
          </ul>

          <h3>Real-Time Collaboration</h3>
          <ul>
            <li><strong>Live Updates:</strong> All connected users see changes instantly</li>
            <li><strong>Connection Status:</strong> Green dot = connected, Red = disconnected</li>
            <li><strong>Auto-Reconnect:</strong> WebSocket reconnects automatically on network issues</li>
            <li><strong>Multiple Users:</strong> Multiple people can edit simultaneously</li>
            <li><strong>Conflict Resolution:</strong> Last write wins (updates merge automatically)</li>
          </ul>

          <h3>Best Practices</h3>
          <ul>
            <li>Use <strong>Clicker Mode</strong> during live events for speed</li>
            <li>Use <strong>Manual Mode</strong> for post-event data correction or bulk imports</li>
            <li>Double-click clicker buttons for large counts (e.g., stadium attendance)</li>
            <li>Right-click to quickly undo accidental clicks</li>
            <li>Monitor the KPI charts to verify data accuracy in real-time</li>
          </ul>
        </section>

        <section id="kyc-management" className={styles.section}>
          <h2>📋 KYC Management (Variables & Metrics)</h2>
          
          <h3>What is KYC Management?</h3>
          <p>
            KYC Management (<code>/admin/kyc</code>) is the admin interface for configuring all variables (metrics) tracked in MessMass. It controls:
          </p>
          <ul>
            <li>Which variables appear in the <strong>Clicker Mode</strong></li>
            <li>Which variables are editable in <strong>Manual Input Mode</strong></li>
            <li>Display labels (aliases) shown in the UI</li>
            <li>Variable organization and ordering</li>
          </ul>

          <h3>Variable Types</h3>
          <h4>1. System Variables (96 built-in)</h4>
          <ul>
            <li><strong>Images:</strong> remoteImages, hostessImages, selfies</li>
            <li><strong>Fans:</strong> remoteFans, stadium</li>
            <li><strong>Demographics:</strong> female, male, genAlpha, genYZ, genX, boomer</li>
            <li><strong>Merchandise:</strong> merched, jersey, scarf, flags, baseballCap, other</li>
            <li><strong>Visits:</strong> visitQrCode, visitShortUrl, visitWeb, socialVisit</li>
            <li><strong>Event:</strong> eventAttendees, eventResultHome, eventResultVisitor</li>
            <li><strong>Bitly:</strong> totalBitlyClicks, uniqueBitlyClicks, and 80+ country/device metrics</li>
          </ul>
          <p>
            System variables have a green <strong>&ldquo;System&rdquo;</strong> badge and cannot be deleted.
          </p>

          <h4>2. Derived Variables (Auto-calculated)</h4>
          <ul>
            <li><strong>allImages:</strong> remoteImages + hostessImages + selfies</li>
            <li><strong>totalFans:</strong> remoteFans + stadium</li>
            <li><strong>totalVisit:</strong> Sum of all visit sources</li>
          </ul>
          <p>
            Derived variables are marked with <code>type: derived</code> and cannot be manually edited (enforced).
          </p>

          <h4>3. Custom Variables (User-created)</h4>
          <ul>
            <li>Created by admins via KYC Management interface</li>
            <li>Examples: vipGuests, pressCount, sponsorBooth</li>
            <li>Stored in database just like system variables</li>
            <li>Can be deleted (system variables cannot)</li>
          </ul>

          <h3>Variable Cards</h3>
          <p>
            Each variable displays a card showing:
          </p>
          <ul>
            <li><strong>Name:</strong> Database field name (immutable for system variables)</li>
            <li><strong>Alias:</strong> UI display label (editable for ALL variables)</li>
            <li><strong>Type:</strong> number, text, or derived</li>
            <li><strong>Category:</strong> Grouping label (e.g., Images, Fans, Merchandise)</li>
            <li><strong>System Badge:</strong> Green &ldquo;System&rdquo; badge if built-in variable</li>
            <li><strong>Visibility Flags:</strong> Two checkboxes (see below)</li>
          </ul>

          <h3>Understanding Alias vs. Name</h3>
          <p>
            <strong>Critical Concept:</strong> The <code>alias</code> field is ONLY a UI display label. It does NOT affect:
          </p>
          <ul>
            <li>Database field names (always use <code>name</code> field)</li>
            <li>Code references (always use <code>stats.name</code>)</li>
            <li>Formula syntax</li>
          </ul>
          <p>
            <strong>What Alias Controls:</strong>
          </p>
          <ul>
            <li>Button labels in Clicker Mode</li>
            <li>Field labels in Manual Input Mode</li>
            <li>Chart legends and axis labels</li>
            <li>Admin UI display text</li>
          </ul>
          <p>
            <strong>Example:</strong><br />
            Name: <code>remoteImages</code> (immutable, used in database)<br />
            Alias: &ldquo;Remote Photos&rdquo; (editable, shown to users)
          </p>

          <h3>Editing an Alias</h3>
          <ol>
            <li>Go to <strong>KYC Management</strong> (<code>/admin/kyc</code>)</li>
            <li>Find the variable card</li>
            <li>Click into the <strong>&ldquo;Alias&rdquo;</strong> field</li>
            <li>Type a new display name (e.g., change &ldquo;Remote Images&rdquo; to &ldquo;Remote Photos&rdquo;)</li>
            <li>Press Enter or click outside the field</li>
            <li>Changes save automatically</li>
          </ol>
          <p>
            <strong>Result:</strong> UI labels update immediately; database field name unchanged.
          </p>

          <h3>Visibility Flags</h3>
          <p>
            Each variable has two independent flags:
          </p>

          <h4>1. Visible in Clicker</h4>
          <ul>
            <li><strong>Purpose:</strong> Controls whether variable appears as a button in Clicker Mode</li>
            <li><strong>Default:</strong> <code>true</code> for Images, Fans, Demographics, Merchandise; <code>false</code> for others</li>
            <li><strong>Use Case:</strong> Hide variables that are rarely used or better suited for manual input</li>
          </ul>

          <h4>2. Editable in Manual</h4>
          <ul>
            <li><strong>Purpose:</strong> Controls whether variable appears in Manual Input Mode</li>
            <li><strong>Default:</strong> <code>true</code> for all base variables; <code>false</code> for derived/text variables</li>
            <li><strong>Use Case:</strong> Prevent manual editing of auto-calculated metrics</li>
          </ul>

          <h4>Example Scenarios</h4>
          <ul>
            <li><code>remoteImages</code>: visibleInClicker = ✅, editableInManual = ✅</li>
            <li><code>allImages</code> (derived): visibleInClicker = ❌, editableInManual = ❌ (enforced)</li>
            <li><code>eventAttendees</code>: visibleInClicker = ❌, editableInManual = ✅ (manual input only)</li>
          </ul>

          <h3>Creating a Custom Variable</h3>
          <ol>
            <li>Go to <strong>KYC Management</strong></li>
            <li>Scroll to the bottom</li>
            <li>Click <strong>&ldquo;Add Variable&rdquo;</strong> button</li>
            <li>Fill in the form:
              <ul>
                <li><strong>Variable Name:</strong> Camelcase, no spaces (e.g., <code>vipGuests</code>)</li>
                <li><strong>Alias (Display Label):</strong> Human-readable (e.g., "VIP Guests")</li>
                <li><strong>Variable Type:</strong> <code>number</code> or <code>text</code></li>
                <li><strong>Category:</strong> Select from dropdown or type new category</li>
                <li><strong>Visible in Clicker:</strong> Show as button in editor? (checkbox)</li>
                <li><strong>Editable in Manual:</strong> Allow manual input? (checkbox)</li>
              </ul>
            </li>
            <li>Click <strong>&ldquo;Create Variable&rdquo;</strong></li>
          </ol>
          <p>
            <strong>Result:</strong> Variable is immediately available in project editor and stored in <code>project.stats</code> when values are entered.
          </p>

          <h3>Deleting a Custom Variable</h3>
          <p>
            <strong>Restriction:</strong> Only custom variables (non-system) can be deleted.
          </p>
          <ol>
            <li>Find the custom variable card</li>
            <li>Click <strong>&ldquo;Delete&rdquo;</strong> button (only visible for custom variables)</li>
            <li>Confirm deletion</li>
          </ol>
          <p>
            <strong>⚠️ Warning:</strong> Deleting a variable removes it from the UI but does NOT delete existing data in <code>project.stats</code>. Historical data remains but is no longer visible/editable.
          </p>

          <h3>Variable Groups & Ordering</h3>
          <p>
            Variables in Clicker Mode are organized into groups with optional KPI charts.
          </p>
          <h4>Default Groups</h4>
          <ul>
            <li><strong>Images:</strong> remoteImages, hostessImages, selfies → Shows &ldquo;All Images Taken&rdquo; chart</li>
            <li><strong>Location:</strong> remoteFans, stadium → Shows &ldquo;Total Fans&rdquo; chart</li>
            <li><strong>Demographics:</strong> female, male, genAlpha, genYZ, genX, boomer</li>
            <li><strong>Merchandise:</strong> merched, jersey, scarf, flags, baseballCap, other</li>
          </ul>

          <h4>Reordering Clicker Buttons</h4>
          <ol>
            <li>Go to <strong>Variables</strong> page (<code>/admin/kyc</code>)</li>
            <li>Click <strong>&ldquo;Reorder Clicker&rdquo;</strong> button</li>
            <li>Drag and drop buttons within their category</li>
            <li>Click <strong>&ldquo;Save Order&rdquo;</strong></li>
          </ol>
          <p>
            <strong>Result:</strong> Button order updates immediately in all project editors.
          </p>
        </section>

        <section id="exporting" className={styles.section}>
          <h2>💾 Exporting Data</h2>
          
          <h3>CSV Export</h3>
          <p>
            Export your data to CSV for analysis in Excel or Google Sheets:
          </p>
          <ul>
            <li>Includes all collected metrics</li>
            <li>Timestamps in ISO 8601 format (UTC)</li>
            <li>Easy to import into other tools</li>
          </ul>

          <h3>PDF Export</h3>
          <ul>
            <li>Professional reports with charts</li>
            <li>Ready to share with stakeholders</li>
            <li>Preserves visual formatting</li>
          </ul>

          <h3>Chart Images</h3>
          <ul>
            <li>Download individual charts as PNG</li>
            <li>High quality for presentations</li>
            <li>Click the download icon on any chart</li>
          </ul>
        </section>

        <section id="sharing" className={styles.section}>
          <h2>🔗 Sharing Reports (Event & Partner)</h2>
          
          <h3>Overview</h3>
          <p>
            MessMass provides two types of shareable reports:
          </p>
          <ul>
            <li><strong>Event Reports:</strong> Individual event statistics and analytics</li>
            <li><strong>Partner Reports:</strong> Aggregated statistics across all events for a partner organization</li>
          </ul>

          <h3>How to Share an Event Report</h3>
          <ol>
            <li>Go to <strong>Events</strong> page (<code>/admin/events</code>)</li>
            <li>Find the event you want to share</li>
            <li>Click the <strong>"Report"</strong> button on the event row</li>
            <li>In the Share Popup modal:
              <ul>
                <li>Review the generated shareable link</li>
                <li>Copy the link using the &ldquo;Copy Link&rdquo; button</li>
                <li>Note: The link is password-protected for security</li>
              </ul>
            </li>
            <li>Share the link and password with your recipients</li>
          </ol>

          <h3>How to Share a Partner Report</h3>
          <ol>
            <li>Go to <strong>Partners</strong> page (<code>/admin/partners</code>)</li>
            <li>Find the partner organization you want to share</li>
            <li>Click the <strong>"Report"</strong> button on the partner row</li>
            <li>In the Share Popup modal:
              <ul>
                <li>Review the generated shareable link</li>
                <li>Copy the link using the &ldquo;Copy Link&rdquo; button</li>
                <li>Note: Partner reports aggregate ALL events for that organization</li>
              </ul>
            </li>
            <li>Share the link and password with your recipients</li>
          </ol>

          <h3>Report URLs</h3>
          <ul>
            <li><strong>Event Report:</strong> <code>/report/[event-slug]</code></li>
            <li><strong>Partner Report:</strong> <code>/partner-report/[partner-slug]</code></li>
            <li>Both are password-protected by default</li>
            <li>Passwords are unique per report and auto-generated</li>
          </ul>

          <h3>What Recipients See</h3>
          <h4>Event Report Page</h4>
          <ul>
            <li>Event name, date, and emoji</li>
            <li>All KPI charts (merchandise, demographics, engagement)</li>
            <li>Total statistics summary</li>
            <li>Hashtags and categories</li>
            <li>Export buttons for charts (PNG download)</li>
          </ul>

          <h4>Partner Report Page</h4>
          <ul>
            <li>Partner name and emoji</li>
            <li>Total aggregated metrics across ALL events</li>
            <li>List of all events with individual stats</li>
            <li>Event cards with links to individual event reports</li>
            <li>Comprehensive totals grid (images, fans, attendees, etc.)</li>
          </ul>

          <h3>Managing Access</h3>
          <ul>
            <li><strong>Password Protection:</strong> All report links require a password</li>
            <li><strong>Regenerate Password:</strong> Use the Share Popup to generate a new password</li>
            <li><strong>Revoke Access:</strong> Delete the page password to disable the link</li>
            <li><strong>Admin Bypass:</strong> Admin users can access any report without a password</li>
          </ul>

          <h3>Best Practices</h3>
          <ul>
            <li>Share passwords separately from links (e.g., via different communication channel)</li>
            <li>Use partner reports for season summaries or client presentations</li>
            <li>Use event reports for individual game/event analysis</li>
            <li>Regenerate passwords periodically for sensitive data</li>
          </ul>
        </section>

        <section id="metrics" className={styles.section}>
          <h2>📈 Understanding Metrics</h2>
          
          <h3>Image Categories</h3>
          <ul>
            <li><strong>Remote Images:</strong> Photos taken by professional photographers</li>
            <li><strong>Hostess Images:</strong> Photos with event staff/ambassadors</li>
            <li><strong>Selfies:</strong> Self-taken photos by attendees</li>
          </ul>

          <h3>Demographics</h3>
          <ul>
            <li><strong>Gender:</strong> Male/Female distribution</li>
            <li><strong>Age Groups:</strong> Gen Alpha, Gen Y/Z, Gen X, Boomer</li>
          </ul>

          <h3>Location Types</h3>
          <ul>
            <li><strong>Indoor:</strong> Covered venues</li>
            <li><strong>Outdoor:</strong> Open-air events</li>
            <li><strong>Stadium:</strong> Sports venues</li>
          </ul>

          <h3>Merchandise Tracking</h3>
          <ul>
            <li><strong>Merched:</strong> Attendees wearing team merchandise</li>
            <li><strong>Jersey:</strong> Official team jerseys</li>
            <li><strong>Scarf:</strong> Team scarves</li>
            <li><strong>Flags:</strong> Team flags</li>
            <li><strong>Baseball Cap:</strong> Team caps</li>
            <li><strong>Other:</strong> Other branded items</li>
          </ul>

          <h3>Core Fan Team Metric</h3>
          <p>
            Calculated as: <code>(Merched Fans / Total Fans) × Event Attendees</code>
          </p>
          <p>
            This metric estimates the number of engaged fans who attend events and show their support through merchandise.
          </p>
        </section>

        <section id="hashtags" className={styles.section}>
          <h2>🏷️ Hashtag System</h2>
          
          <h3>Traditional Hashtags</h3>
          <ul>
            <li>Simple text labels for organizing events</li>
            <li>Example: <code>#soccer</code>, <code>#concert</code>, <code>#festival</code></li>
            <li>Filter events by hashtags in the admin panel</li>
          </ul>

          <h3>Category-Prefixed Hashtags</h3>
          <p>
            Advanced organization with categories:
          </p>
          <ul>
            <li><strong>Format:</strong> <code>category:hashtag</code></li>
            <li><strong>Example:</strong> <code>country:france</code>, <code>year:2024</code></li>
            <li><strong>Color Coding:</strong> Categories have consistent colors</li>
          </ul>

          <h3>Using Hashtags</h3>
          <ul>
            <li>Add hashtags when creating or editing events</li>
            <li>Use multiple hashtags for better organization</li>
            <li>Filter by hashtags to find related events</li>
            <li>View aggregated stats across hashtag groups</li>
          </ul>
        </section>

        <section id="troubleshooting" className={styles.section}>
          <h2>🔧 Troubleshooting</h2>
          
          <h3>Common Issues</h3>
          
          <h4>Login Problems</h4>
          <ul>
            <li>Clear browser cookies and try again</li>
            <li>Use the &quot;Clear Session&quot; page: <code>/admin/clear-session</code></li>
            <li>Contact your administrator for password reset</li>
          </ul>

          <h4>Data Not Syncing</h4>
          <ul>
            <li>Check your internet connection</li>
            <li>Refresh the page to see latest updates</li>
            <li>Ensure you&apos;re on the correct edit link</li>
          </ul>

          <h4>Charts Not Displaying</h4>
          <ul>
            <li>Try a different browser (Chrome, Firefox, Safari)</li>
            <li>Disable browser extensions temporarily</li>
            <li>Clear browser cache</li>
          </ul>

          <h3>Getting Help</h3>
          <ul>
            <li>Contact your event organizer or admin</li>
            <li>Check the <a href="/admin/projects">Projects page</a> for event status</li>
            <li>Report technical issues to your system administrator</li>
          </ul>
        </section>

        <footer className={styles.footer}>
          <p>
            <strong>MessMass Version 10.8.0</strong><br />
            Last Updated: 2025-11-06T19:33:00.000Z (UTC)
          </p>
          <p>
            <strong>Quick Links:</strong><br />
            <a href="/api-docs" target="_blank" rel="noopener noreferrer">
              📚 Public API Documentation
            </a>
            {' '}•{' '}
            <a href="https://github.com/moldovancsaba/messmass" target="_blank" rel="noopener noreferrer">
              GitHub Repository
            </a>
          </p>
          <p>
            For additional help, contact your system administrator.
          </p>
        </footer>
      </div>
    </div>
  );
}
