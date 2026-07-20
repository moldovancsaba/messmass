'use client';

import { useEffect, useState } from 'react';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import styles from './page.module.css';
import type { UserRole } from '@/lib/users';

/* What: Admin help page displaying the current workspace model with role-aware guidance
   Why: Keep in-product guidance aligned with the active admin IA and workflow patterns */

export default function HelpPage() {
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/admin/auth', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserRole(data.user.role as UserRole);
            setUserName(data.user.name || data.user.email);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="📖 Help"
        subtitle="How to use the {messmass} admin workspace, reporting workspace, and analytics workspace"
        backLink="/admin"
      />
      <div className={styles.content}>
        {!loading && userRole === 'guest' && (
          <div className={styles.guestBox}>
            <h2 className={styles.guestHeading}>👋 Welcome, {userName}!</h2>
            <p className={styles.guestText}>
              You&apos;re currently logged in as a <strong>Guest</strong>. Guest access is
              intentionally limited to the help surface so you can understand the product map
              before higher-permission work is enabled.
            </p>
            <p className={styles.guestText}>
              <strong>🔒 Limited Access:</strong> To work with Events, Partners,
              Reporting, Analytics, or Organizations, ask a superadmin to upgrade your role.
            </p>
            <div className={styles.guestInnerBox}>
              <p className={styles.guestInnerHeading}>⬆️ Current role ladder:</p>
              <ol className={styles.guestList}>
                <li>Contact a <strong>Superadmin</strong> in your organization.</li>
                <li>
                  Provide your email:{' '}
                  <strong>{userName.includes('@') ? userName : 'Check with admin'}</strong>
                </li>
                <li>
                  Request the role that matches your workflow:
                  <ul className={styles.guestNestedList}>
                    <li>
                      <strong>User:</strong> Events, Partners, Organizations, and day-to-day
                      entity management
                    </li>
                    <li>
                      <strong>Admin:</strong> User access plus Reporting Workspace, Analytics
                      Workspace, Bitly Links, KYC Variables, Clicker Sets, and report setup
                    </li>
                    <li>
                      <strong>Superadmin:</strong> Full system access, user management, and
                      system administration
                    </li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        )}

        <nav className={styles.toc}>
          <h2>Table of Contents</h2>
          <ul>
            <li><a href="#tutorials">Tutorials</a></li>
            <li><a href="#workspace-map">Workspace Map</a></li>
            <li><a href="#core-workflows">Core Workflows</a></li>
            <li><a href="#reporting-workspace">Reporting Workspace</a></li>
            <li><a href="#analytics-workspace">Analytics Workspace</a></li>
            <li><a href="#sharing-export">Sharing and Export</a></li>
            <li><a href="#organizations">Organizations</a></li>
            <li><a href="#troubleshooting">Troubleshooting</a></li>
          </ul>
        </nav>

        <section id="workspace-map" className={styles.section}>
          <h2>🧭 Workspace Map</h2>

          <h3>Start from Admin Workspace</h3>
          <p>
            <code>/admin</code> is the single command center for authenticated users. Use it
            to enter the product by job, not by old internal route names.
          </p>
          <ul>
            <li><strong>Operations:</strong> Events, Messages, Quick Add, and execution work</li>
            <li><strong>Entities:</strong> Partners and Organizations</li>
            <li><strong>Reports:</strong> Reporting Workspace and report-authoring tools</li>
            <li><strong>Data:</strong> Integrations and supporting data systems</li>
            <li><strong>Analytics:</strong> Analytics Workspace, Sponsorship Hub, and Insights</li>
            <li><strong>System:</strong> User access, cache, and admin-only controls</li>
          </ul>

          <h3>Canonical Workspace Rules</h3>
          <ul>
            <li>
              Use <code>/admin/reports</code> when you are changing how reports are built,
              themed, populated, or exported.
            </li>
            <li>
              Use <code>/admin/analytics</code> when you are reviewing performance, proof,
              trends, or executive summaries.
            </li>
            <li>
              Use <code>/admin/events</code>, <code>/admin/partners</code>, and{' '}
              <code>/admin/organizations</code> when you are managing entities and their setup.
            </li>
            <li>
              Legacy routes like <code>/admin/dashboard</code> and <code>/admin/insights</code>{' '}
              now redirect into the canonical workspace model.
            </li>
          </ul>
        </section>

        <section id="tutorials" className={styles.section}>
          <h2>📚 Tutorials</h2>

          <h3>Step-by-step guides</h3>
          <p>
            Task-oriented tutorials for creating and managing every core object, and for
            connecting messmass to the apps it works with. The full step-by-step text lives in
            the repository under <code>docs/guides/</code> (start at{' '}
            <code>guides-tutorials-index.md</code>); this catalog shows what each one covers.
          </p>

          <h3>Core objects</h3>
          <ul>
            <li><strong>Getting Started:</strong> the Organisation → Partner → Event → Report model, roles, and login</li>
            <li><strong>Organisations:</strong> group partners and run org-level reports — <code>/admin/organizations</code></li>
            <li><strong>Partners:</strong> teams, clubs, and sponsors that own events — <code>/admin/partners</code></li>
            <li><strong>Events:</strong> the individual matches/activities you report on — <code>/admin/events</code></li>
            <li><strong>Collecting event data:</strong> the Clicker &amp; Manual editor — <code>/edit/[event-slug]</code></li>
            <li><strong>Building reports:</strong> templates, data blocks, and charts — <code>/admin/visualization</code></li>
            <li><strong>Report themes &amp; styles:</strong> colours and fonts — <code>/admin/styles</code></li>
            <li><strong>Report variants:</strong> time-scoped, publishable report versions</li>
            <li><strong>Sharing &amp; access:</strong> links, page passwords, and who can see what</li>
          </ul>

          <h3>Building blocks</h3>
          <ul>
            <li><strong>Variables (KYC):</strong> the single source of truth for every stat — <code>/admin/kyc</code></li>
            <li><strong>Clicker sets:</strong> the live capture layout — <code>/admin/clicker-manager</code></li>
            <li><strong>Charts &amp; formulas:</strong> chart types and the <code>[variable]</code> language — <code>/admin/charts</code></li>
            <li><strong>Content Library:</strong> reusable image/text assets — <code>/admin/content-library</code></li>
            <li><strong>Hashtags &amp; filters:</strong> tagging and cross-event filter reports — <code>/admin/hashtags</code>, <code>/admin/filter</code></li>
          </ul>

          <h3>Integrations</h3>
          <ul>
            <li><strong>Camera app:</strong> provisioning orgs/partners/events into the selfie-capture app</li>
            <li><strong>Fanmass:</strong> image-intelligence analytics and the mapping API</li>
            <li><strong>Bitly:</strong> short-link click analytics attributed to events/partners — <code>/admin/bitly</code></li>
            <li><strong>Sport databases:</strong> Football-Data.org, API-Football, and TheSportsDB enrichment</li>
            <li><strong>Google Sheets:</strong> managing a partner&apos;s events from a spreadsheet</li>
            <li><strong>Authentication &amp; SSO:</strong> sign-in, roles, SSO, and API keys</li>
          </ul>
        </section>

        <section id="core-workflows" className={styles.section}>
          <h2>⚙️ Core Workflows</h2>

          <h3>Event Setup and Editing</h3>
          <p>
            Events now use a staged workflow so you do not have to decide everything at once.
          </p>
          <ol>
            <li>Open <strong>Events</strong> at <code>/admin/events</code>.</li>
            <li>Create a new event or edit an existing one.</li>
            <li>Complete <strong>Event Basics</strong> first.</li>
            <li>Continue into <strong>Reporting</strong> or <strong>Reporting &amp; Distribution</strong>.</li>
            <li>Use <strong>Open Editor</strong> for live data capture and <strong>Open Report</strong> for output review.</li>
          </ol>

          <h3>Partner Setup and Editing</h3>
          <p>
            Partners follow the same staged pattern: identity first, reporting and integrations
            second.
          </p>
          <ol>
            <li>Open <strong>Partners</strong> at <code>/admin/partners</code>.</li>
            <li>Create or edit the partner record.</li>
            <li>Finish <strong>Partner Basics</strong> before moving to integrations.</li>
            <li>Use the second step for Bitly, templates, clicker sets, Google Sheets, and logo/report setup.</li>
          </ol>

          <h3>Live Event Tracking</h3>
          <p>
            Use the event editor at <code>/edit/[event-slug]</code> for live collection.
          </p>
          <ul>
            <li><strong>Clicker Mode:</strong> Fast button-based entry during live execution</li>
            <li><strong>Manual Mode:</strong> Exact field-based entry and cleanup</li>
            <li><strong>Realtime updates:</strong> Connected collaborators see changes instantly</li>
            <li><strong>Best default:</strong> Use Clicker live, then Manual for correction and completion</li>
          </ul>
        </section>

        <section id="reporting-workspace" className={styles.section}>
          <h2>🧱 Reporting Workspace</h2>

          <h3>What Lives Here</h3>
          <p>
            <code>/admin/reports</code> is the canonical home for report authoring.
          </p>
          <ul>
            <li><strong>Report Builder:</strong> Compose report structures and content</li>
            <li><strong>Report Themes:</strong> Control visual styling and brand presentation</li>
            <li><strong>Content Library:</strong> Reusable report assets and content blocks</li>
            <li><strong>Chart Algorithms:</strong> Manage chart logic and rendering behavior</li>
            <li><strong>KYC Variables:</strong> Define the metric schema available to reports and editors</li>
            <li><strong>Clicker Sets:</strong> Control the live input layout that feeds report data</li>
          </ul>

          <h3>How to Think About Variables and Clicker Sets</h3>
          <p>
            KYC Variables and Clicker Sets are not isolated admin utilities. They are report
            dependencies.
          </p>
          <ul>
            <li>
              Update <strong>KYC Variables</strong> when you need to add, rename, or hide the
              metrics available to events and reports.
            </li>
            <li>
              Update <strong>Clicker Sets</strong> when you need to change the operator-facing
              live capture layout.
            </li>
            <li>
              Return to <strong>Report Builder</strong> after schema or input changes so the
              final report composition stays aligned.
            </li>
          </ul>

          <h3>Common Reporting Path</h3>
          <ol>
            <li>Start in <code>/admin/reports</code>.</li>
            <li>Adjust variables or clicker layout if the data model needs to change.</li>
            <li>Update themes, content, or builder composition.</li>
            <li>Open a report to review the output with real project data.</li>
          </ol>
        </section>

        <section id="analytics-workspace" className={styles.section}>
          <h2>📊 Analytics Workspace</h2>

          <h3>Canonical Entry Point</h3>
          <p>
            <code>/admin/analytics</code> is the only analytics home. Use it to move into the
            right analysis lens instead of starting from legacy dashboard routes.
          </p>

          <h3>Primary Analytics Surfaces</h3>
          <ul>
            <li><strong>Sponsorship Hub:</strong> Unified sponsorship evidence and performance rollups</li>
            <li><strong>Partner Activation:</strong> Proof-of-performance readiness and gap triage</li>
            <li><strong>Executive / Marketing / Operations:</strong> Role-specific decision views</li>
            <li><strong>Insights:</strong> Higher-level synthesized findings</li>
          </ul>

          <h3>Recommended Analytics Path</h3>
          <ol>
            <li>Start from <code>/admin/analytics</code>.</li>
            <li>Choose the correct lens for the decision you are making.</li>
            <li>Use shared workspace navigation to move between hub, activation, and insights.</li>
            <li>Jump back into reports or entity pages only when you need to act on a finding.</li>
          </ol>
        </section>

        <section id="sharing-export" className={styles.section}>
          <h2>🔗 Sharing and Export</h2>

          <h3>Open First, Share Second</h3>
          <p>
            Across Events, Partners, and Organizations, the primary workflow is now direct open.
            Use <strong>Open Report</strong> or <strong>Open Editor</strong> first, then use
            share actions when you need a recipient-safe link.
          </p>

          <h3>Shareable Outputs</h3>
          <ul>
            <li><strong>Event Report:</strong> <code>/report/[event-slug]</code></li>
            <li><strong>Partner Report:</strong> <code>/partner-report/[partner-slug]</code></li>
            <li><strong>Organization Report:</strong> <code>/organization-report/[id]</code></li>
          </ul>

          <h3>Export Types</h3>
          <ul>
            <li><strong>CSV:</strong> Data extraction for spreadsheet analysis</li>
            <li><strong>PNG:</strong> Individual chart image export from report surfaces</li>
            <li><strong>Report output:</strong> Styled, shareable stakeholder view through the report routes</li>
          </ul>
        </section>

        <section id="organizations" className={styles.section}>
          <h2>🏢 Organizations</h2>

          <h3>When to Use Organizations</h3>
          <p>
            Organizations group partners and support organization-level reporting and member
            management.
          </p>
          <ul>
            <li><strong>Admin UI:</strong> <code>/admin/organizations</code></li>
            <li><strong>Report UI:</strong> <code>/organization-report/[id]</code></li>
            <li><strong>Content editor:</strong> <code>/organization-edit/[id]</code></li>
          </ul>

          <h3>Typical Organization Workflow</h3>
          <ol>
            <li>Create or open the organization.</li>
            <li>Assign partner members.</li>
            <li>Configure organization reporting settings.</li>
            <li>Open the organization report for aggregate review.</li>
          </ol>
        </section>

        <section id="troubleshooting" className={styles.section}>
          <h2>🔧 Troubleshooting</h2>

          <h3>If You Cannot Find a Feature</h3>
          <ul>
            <li>Start from <code>/admin</code> and use the workspace grouping, not old bookmark names.</li>
            <li>Check whether the feature belongs to <strong>Reports</strong>, <strong>Analytics</strong>, or an entity page.</li>
            <li>If a bookmarked route redirects, the new canonical surface has replaced it.</li>
          </ul>

          <h3>If You Cannot Access a Page</h3>
          <ul>
            <li>Your role may not include that workspace.</li>
            <li>Guests can use Help only.</li>
            <li>Users can manage core entities and execution flows.</li>
            <li>Admins and Superadmins can access the reporting and analytics workspaces.</li>
          </ul>

          <h3>If Report Output Looks Wrong</h3>
          <ul>
            <li>Check the event or partner setup first.</li>
            <li>Then check <code>/admin/reports</code> for theme, content, builder, variables, or clicker dependencies.</li>
            <li>Use analytics surfaces to confirm whether the underlying data is missing or only the presentation layer is off.</li>
          </ul>
        </section>

        <div className={styles.footer}>
          <p>
            Need deeper implementation context? Start with{' '}
            <a href="/admin">Admin Workspace</a>, then move into the canonical Reports or Analytics workspaces.
          </p>
        </div>
      </div>
    </div>
  );
}
