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
            <li><a href="#stats-page">Understanding the Stats Page</a></li>
            <li><a href="#live-tracking">Live Event Tracking</a></li>
            <li><a href="#exporting">Exporting Data</a></li>
            <li><a href="#sharing">Sharing Results</a></li>
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
          <h2>⚡ Live Event Tracking</h2>
          
          <h3>Using the Edit Page</h3>
          <p>
            During live events, use the edit page to collect real-time statistics:
          </p>

          <h4>Clicker Mode</h4>
          <ul>
            <li>Quick increment/decrement buttons for fast data entry</li>
            <li>Perfect for high-traffic events</li>
            <li>Real-time updates visible to all viewers</li>
          </ul>

          <h4>Manual Mode</h4>
          <ul>
            <li>Enter exact numbers when you have accurate counts</li>
            <li>Useful for post-event data entry</li>
            <li>Includes fields for success manager metrics</li>
          </ul>

          <h3>Safety Tips</h3>
          <ul>
            <li>Save frequently to prevent data loss</li>
            <li>Use the undo feature if you make a mistake</li>
            <li>Multiple people can track simultaneously</li>
          </ul>
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
          <h2>🔗 Sharing Results</h2>
          
          <h3>Creating Share Links</h3>
          <p>
            Generate shareable links for your event statistics:
          </p>
          <ul>
            <li><strong>Public Links:</strong> Anyone with the link can view</li>
            <li><strong>Password Protected:</strong> Require a password for access</li>
            <li><strong>Time-Limited:</strong> Set expiration dates for sensitive data</li>
          </ul>

          <h3>Managing Access</h3>
          <ul>
            <li>View who has accessed your shared links</li>
            <li>Revoke access at any time</li>
            <li>Update passwords without changing the link</li>
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
            <strong>MessMass Version 10.6.0</strong><br />
            Last Updated: 2025-11-05T12:58:00.000Z (UTC)
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
