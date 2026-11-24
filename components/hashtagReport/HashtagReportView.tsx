// components/hashtagReport/HashtagReportView.tsx
// WHAT: The unified hashtag report page: what Fanmass and Camera measured for the events that carry a hashtag, and the
//     Messmass calculations over it.
// WHY: It shows nothing typed by a person. Every percentage names the two counts it came from, and a figure nobody
//     measured reads "Not measured", never a zero or an n/a that looks like a value. The coverage block says how many
//     of the hashtag's events the measurement reaches.

import type { Calculation, HashtagReport, NamedCount } from '@/lib/hashtagReport/types';
import styles from './hashtag-report.module.css';

const fmt = (n: number) => n.toLocaleString('en-US');

/** `2026-02` as "February 2026". */
const monthName = (month: string) => new Date(`${month}-01T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** The headline of a calculation: its value, or nothing when it cannot be calculated. */
const percent = (calc: Calculation): string | null => (calc.value === null ? null : `${calc.value}%`);

/** A sentence about a calculation ("12 of 20 people ... are men"), or nothing when its counts were not measured. */
const sentence = (calc: Calculation, tail: string): string | undefined =>
  calc.numerator === null || calc.denominator === null ? undefined : `${detail(calc)} ${tail}`;

/** What the calculation divided by what, or empty string when not available. */
function detail(calc: Calculation): string {
  if (calc.numerator === null || calc.denominator === null || calc.value === null) return '';
  return `${fmt(calc.numerator)} of ${fmt(calc.denominator)} ${calc.basis}`;
}

function Kpi({ label, value, text }: { label: string; value: string | null; text?: string }) {
  if (value === null) return null;
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
      {text ? <span className={styles.kpiDetail}>{text}</span> : null}
    </div>
  );
}

function Bars({ title, counts, note, icon = '📊' }: { title: string; counts: Record<string, number>; note?: string; icon?: string }) {
  const rows = Object.entries(counts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return null;
  const max = rows[0][1];
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon} aria-hidden="true">{icon}</span>
        <h2 className={styles.cardTitle}>{title}</h2>
      </div>
      {note && <p className={styles.cardNote}>{note}</p>}
      {rows.slice(0, 12).map(([name, count]) => (
        <div key={name} className={styles.barRow}>
          <span>{name}</span>
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bar} aria-label={`${name}: ${fmt(count)}`}>
            <rect x="0" y="0" width="100" height="8" rx="4" className={styles.barTrack} />
            <rect x="0" y="0" width={Math.max(2, Math.round((count / max) * 100))} height="8" rx="4" className={styles.barFill} />
          </svg>
          <span className={styles.barCount}>{fmt(count)}</span>
        </div>
      ))}
    </section>
  );
}

function Names({ title, list, note, icon = '🏷️', wide = false }: { title: string; list: NamedCount[]; note: string; icon?: string; wide?: boolean }) {
  if (list.length === 0) return null;
  const rows = list.slice(0, 12);
  const top = Math.max(...rows.map((r) => r.count), 1);
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon} aria-hidden="true">{icon}</span>
        <h2 className={styles.cardTitle}>{title}</h2>
      </div>
      {note && <p className={styles.cardNote}>{note}</p>}
      {rows.map((row) => (
        <div
          className={wide ? styles.barRowWide : styles.barRow}
          key={row.name}
          title={
            row.weightedCount !== undefined
              ? `${fmt(row.count)} photos · ${row.weightedCount} weighted · ${fmt(row.appearances ?? row.count)} sightings · ${row.avgSharePct ?? 100}% avg share`
              : undefined
          }
        >
          <span>{row.name}</span>
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bar} aria-label={`${row.name}: ${fmt(row.count)}`}>
            <rect x="0" y="0" width="100" height="8" rx="4" className={styles.barTrack} />
            <rect x="0" y="0" width={Math.max(2, Math.round((row.count / top) * 100))} height="8" rx="4" className={styles.barFill} />
          </svg>
          <span className={styles.barCount}>
            {fmt(row.count)}
            {row.weightedCount !== undefined && row.coOccurrencePhotos ? ` (${row.weightedCount}w)` : ''}
          </span>
        </div>
      ))}
    </section>
  );
}

/** `embedded`: inside the interactive dashboard's Figures tab, which already shows the title and the header figures. */
export default function HashtagReportView({ report, embedded = false }: { report: HashtagReport; embedded?: boolean }) {
  const { measured, calculated, coverage, scope } = report;
  const { photos, counters } = measured;
  const { drive } = measured;
  const hasMeasuredData = coverage.eventsWithCounters > 0 || coverage.eventsWithPhotoResults > 0 || drive.photos > 0 || photos.tagged > 0;
  // The Camera block shows only when Camera measured something for this hashtag; drive photos have their own block
  const hasCameraData = coverage.eventsWithCounters > 0 || coverage.eventsWithPhotoResults > 0 || photos.tagged > 0;
  const all = scope.type === 'all';
  const label = all ? 'All events' : scope.tags.map((tag) => `#${tag}`).join(' + ');
  const byPhotos = measured.events.filter((event) => event.joinedBy === 'photos').length;
  const byHashtag = coverage.events - byPhotos;
  const scopeText = [
    all ? `${fmt(coverage.events)} events` : `${fmt(byHashtag)} ${byHashtag === 1 ? 'event carries' : 'events carry'} it`,
    byPhotos > 0 ? `${fmt(byPhotos)} more ${byPhotos === 1 ? 'event holds' : 'events hold'} its photos` : '',
    drive.photos > 0 ? `${fmt(drive.photos)} library photos` : '',
    photos.tagged > 0 ? `${fmt(photos.tagged)} tagged photos` : '',
  ].filter(Boolean).join(', ');
  const taken = Object.prototype.hasOwnProperty.call(counters, 'camera_images_taken') ? fmt(counters.camera_images_taken) : null;

  const Wrapper = embedded ? 'section' : 'main';
  return (
    <Wrapper className={styles.page}>
      {!embedded && <header className={styles.hero}>
        <span className={styles.eyebrow}>{all ? 'Every event together' : scope.tags.length > 1 ? 'Hashtag filter' : 'Hashtag report'}</span>
        <h1 className={styles.title}>{label}</h1>
        <p className={styles.lead}>
          Verified audience, brand, and engagement metrics {all ? 'across every event' : 'for this hashtag'} ({scopeText}). Nothing in this
          report is typed in by hand.
        </p>
      </header>}

      {coverage.events === 0 && drive.photos === 0 && photos.tagged === 0 ? (
        <div className={styles.empty}>
          No event and no photo carries {label} yet. This report is built from the events and photos that carry the hashtag, so
          it fills in as soon as they are tagged with it.
        </div>
      ) : !hasMeasuredData ? (
        <div className={styles.empty}>
          {all ? `There are ${fmt(coverage.events)} events` : `${fmt(coverage.events)} ${coverage.events === 1 ? 'event carries' : 'events carry'} ${label}`}, but none of them has measured
          data yet: no event photo counters or photo analysis recorded yet.
        </div>
      ) : (
        <>
          {/* The opt-in headline: every photo of the report with a stored opt-in record */}
          {calculated.photoOptInShare.value !== null && (
          <section className={styles.kpiGrid} aria-label="Opt-in">
            <Kpi label="Photos with opt-in" value={percent(calculated.photoOptInShare)} text={detail(calculated.photoOptInShare)} />
          </section>
          )}
          {hasCameraData && (<>
          <section className={styles.kpiGrid} aria-label="Key figures">
            <Kpi label="Photos taken" value={taken} text="Total captured photos" />
            <Kpi label="Photos analysed" value={photos.analysed > 0 ? fmt(photos.analysed) : null} text={detail(calculated.analysedShare) || 'Analyzed fan photos'} />
            <Kpi label="Approval rate" value={percent(calculated.approvalRate)} text={detail(calculated.approvalRate)} />
            <Kpi label="Opt-in recorded" value={percent(calculated.optInShare)} text={detail(calculated.optInShare)} />
            <Kpi label="Consent accepted" value={percent(calculated.consentShare)} text={detail(calculated.consentShare)} />
            {photos.tagged > 0 && <Kpi label={`Photos tagged ${label}`} value={fmt(photos.tagged)} text="Tagged in photo analysis" />}
          </section>

          <div className={styles.columns}>
            <Bars title="Gender" counts={photos.genders} note={sentence(calculated.maleShare, 'are men')} />
            <Bars title="Age groups" counts={photos.ageGroups} note="People with a measured age" />
            <Bars title="Emotions" counts={photos.emotions} note={sentence(calculated.smilingShare, 'are smiling')} />
          </div>
          <div className={styles.columns}>
            <Names title="Sponsor Brands" list={photos.brands} note="Fan photos featuring sponsor brand visibility" />
            <Names title="Teams & Clubs" list={photos.clubs} note="Fan photos featuring team & club apparel" />
          </div>
          </>)}
          {drive.photos > 0 && (
            <>
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>{all ? 'Photo Library' : `Photo library tagged ${label}`}</h2>
                <p className={styles.cardNote}>
                  Matched event photos analyzed for sport, clubs, sponsor brands, emotions, and audience demographics.
                </p>
                <div className={styles.kpiGrid}>
                  <Kpi label="Library photos" value={fmt(drive.photos)} text={detail(calculated.drivePlacedShare)} />
                  <Kpi label="Matched to events" value={drive.placed > 0 ? fmt(drive.placed) : null} text={drive.placed > 0 ? `${fmt(drive.placedOverHalf)} matched with high confidence` : undefined} />
                  <Kpi label="Analysed" value={percent(calculated.driveAnalysedShare)} text={detail(calculated.driveAnalysedShare)} />
                  <Kpi label="Opt-in recorded" value={percent(calculated.driveOptInShare)} text={detail(calculated.driveOptInShare)} />
                </div>
              </section>
              <div className={styles.columns}>
                <Bars icon="👥" title="Gender" counts={drive.genders} note={drive.analysed > 0 ? `${fmt(drive.people)} people in ${fmt(drive.analysed)} analysed photos` : undefined} />
                <Bars icon="🎂" title="Age groups" counts={drive.ageGroups} />
                <Bars icon="😊" title="Emotions" counts={drive.emotions} />
              </div>
              <div className={styles.columns}>
                <Names icon="🏷️" title="Sponsor Brands" list={drive.brands} note="Photos featuring sponsor brand visibility" />
                <Names icon="🛡️" title="Teams & Clubs" list={drive.clubs} note="Photos featuring team & club apparel" />
                <Names icon="📅" wide title="Events" list={drive.events} note="Photos per event" />
              </div>
            </>
          )}
        </>
      )}

      {measured.months.length >= 2 && (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">📆</span>
            <h2 className={styles.cardTitle}>By month</h2>
          </div>
          <p className={styles.cardNote}>
            Monthly breakdown of analyzed event photos by event date.
          </p>
          <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Month</th><th>Events</th><th>Library photos</th><th>Captured photos</th></tr>
            </thead>
            <tbody>
              {measured.months.map((row) => (
                <tr key={row.month}>
                  <td>{monthName(row.month)}</td>
                  <td>{fmt(row.events)}</td>
                  <td>{fmt(row.drivePhotos)}</td>
                  <td>{fmt(row.cameraPhotos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      )}

      {coverage.events > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Events in this report</h2>
          <p className={styles.cardNote}>
            {fmt(coverage.eventsWithCounters)} of {fmt(coverage.events)} have event photo counters and{' '}
            {fmt(coverage.eventsWithPhotoResults)} have analysed photos. An event without them adds nothing to the figures above{all ? ', so only the events with measured data are listed' : ''}.
          </p>
          <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Event</th><th>Date</th><th>Photo counters</th><th>Photo analysis</th><th>Library photos</th><th>Captured photos</th></tr>
            </thead>
            <tbody>
              {measured.events.filter((event) => !all || event.hasCounters || event.hasPhotoResults || event.drivePhotos > 0).map((event) => (
                <tr key={event.id}>
                  <td>
                    {/^[a-f0-9]{24}$/i.test(event.id) ? (
                      <a href={`/interactive-report/event/${event.id}`}>
                        {event.name || 'Unnamed event'}
                      </a>
                    ) : (
                      event.name || 'Unnamed event'
                    )}
                    {!all && <div className={styles.cardNote}>{event.joinedBy === 'photos' ? 'Holds photos of the hashtag' : 'Carries the hashtag'}</div>}
                  </td>
                  <td>{event.date ?? 'No date'}</td>
                  <td><span className={event.hasCounters ? styles.badge : `${styles.badge} ${styles.badgeOff}`}>{event.hasCounters ? 'Yes' : 'No'}</span></td>
                  <td><span className={event.hasPhotoResults ? styles.badge : `${styles.badge} ${styles.badgeOff}`}>{event.hasPhotoResults ? 'Yes' : 'No'}</span></td>
                  <td>{fmt(event.drivePhotos)}</td>
                  <td>{fmt(event.cameraPhotos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      )}
    </Wrapper>
  );
}
