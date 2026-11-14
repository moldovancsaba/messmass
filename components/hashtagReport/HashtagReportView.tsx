// components/hashtagReport/HashtagReportView.tsx
// WHAT: The unified hashtag report page: what Fanmass and Camera measured for the events that carry a hashtag, and the
//     Messmass calculations over it.
// WHY: It shows nothing typed by a person. Every percentage names the two counts it came from, and a figure nobody
//     measured reads "Not measured", never a zero or an n/a that looks like a value. The coverage block says how many
//     of the hashtag's events the measurement reaches.

import type { Calculation, HashtagReport, NamedCount } from '@/lib/hashtagReport/types';
import styles from './hashtag-report.module.css';

const fmt = (n: number) => n.toLocaleString('en-US');

/** The headline of a calculation: its value, or nothing when it cannot be calculated. */
const percent = (calc: Calculation): string | null => (calc.value === null ? null : `${calc.value}%`);

/** A sentence about a calculation ("12 of 20 people ... are men"), or nothing when its counts were not measured. */
const sentence = (calc: Calculation, tail: string): string | undefined =>
  calc.numerator === null || calc.denominator === null ? undefined : `${detail(calc)} ${tail}`;

/** What the calculation divided by what, or why it could not be calculated. */
function detail(calc: Calculation): string {
  if (calc.numerator === null && calc.denominator === null) return 'Not enough was measured to calculate this';
  if (calc.numerator === null) return `No count of ${calc.part} was measured`;
  if (calc.denominator === null) return `No count of ${calc.basis} was measured`;
  const counts = `${fmt(calc.numerator)} of ${fmt(calc.denominator)} ${calc.basis}`;
  return calc.value === null ? `${counts}; no share is shown because the counts do not agree` : counts;
}

function Kpi({ label, value, text }: { label: string; value: string | null; text: string }) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      {value === null ? <span className={styles.kpiMuted}>Not measured</span> : <span className={styles.kpiValue}>{value}</span>}
      <span className={styles.kpiDetail}>{text}</span>
    </div>
  );
}

function Bars({ title, counts, note }: { title: string; counts: Record<string, number>; note?: string }) {
  const rows = Object.entries(counts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return null;
  const max = rows[0][1];
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {note && <p className={styles.cardNote}>{note}</p>}
      {rows.slice(0, 12).map(([name, count]) => (
        <div key={name} className={styles.barRow}>
          <span>{name}</span>
          <progress className={styles.bar} value={count} max={max} aria-label={`${name}: ${fmt(count)}`} />
          <span className={styles.barCount}>{fmt(count)}</span>
        </div>
      ))}
    </section>
  );
}

function Names({ title, list, note }: { title: string; list: NamedCount[]; note: string }) {
  if (list.length === 0) return null;
  return <Bars title={title} counts={Object.fromEntries(list.slice(0, 12).map((row) => [row.name, row.count]))} note={note} />;
}

export default function HashtagReportView({ report }: { report: HashtagReport }) {
  const { measured, calculated, coverage, scope } = report;
  const { photos, counters } = measured;
  const { drive } = measured;
  const hasMeasuredData = coverage.eventsWithCounters > 0 || coverage.eventsWithPhotoResults > 0 || drive.photos > 0 || photos.tagged > 0;
  const taken = Object.prototype.hasOwnProperty.call(counters, 'camera_images_taken') ? fmt(counters.camera_images_taken) : null;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Hashtag report</span>
        <h1 className={styles.title}>#{scope.id}</h1>
        <p className={styles.lead}>
          What Fanmass and Camera measured across the {fmt(coverage.events)} {coverage.events === 1 ? 'event that carries' : 'events that carry'}{' '}
          this hashtag, and what Messmass calculates from it. Nothing in this report is typed in by hand.
        </p>
      </header>

      {coverage.events === 0 && drive.photos === 0 && photos.tagged === 0 ? (
        <div className={styles.empty}>
          No event and no photo carries #{scope.id} yet. This report is built from the events and photos that carry the hashtag, so
          it fills in as soon as they are tagged with it.
        </div>
      ) : !hasMeasuredData ? (
        <div className={styles.empty}>
          {fmt(coverage.events)} {coverage.events === 1 ? 'event carries' : 'events carry'} #{scope.id}, but none of them has measured
          data yet: no photo counters from Camera and no photo analysis from Fanmass.
        </div>
      ) : (
        <>
          <section className={styles.kpiGrid} aria-label="Key figures">
            <Kpi label="Photos taken" value={taken} text="Counted by Camera across the events" />
            <Kpi label="Photos analysed" value={photos.analysed > 0 ? fmt(photos.analysed) : null} text={detail(calculated.analysedShare)} />
            <Kpi label="Approval rate" value={percent(calculated.approvalRate)} text={detail(calculated.approvalRate)} />
            <Kpi label="Opt-in recorded" value={percent(calculated.optInShare)} text={detail(calculated.optInShare)} />
            <Kpi label="Consent accepted" value={percent(calculated.consentShare)} text={detail(calculated.consentShare)} />
            {photos.tagged > 0 && <Kpi label={`Camera photos tagged #${scope.id}`} value={fmt(photos.tagged)} text="Fanmass tagged them with what it found in them, in any event" />}
          </section>

          <div className={styles.columns}>
            <Bars title="Gender" counts={photos.genders} note={sentence(calculated.maleShare, 'are men')} />
            <Bars title="Age groups" counts={photos.ageGroups} note="People with a measured age" />
            <Bars title="Emotions" counts={photos.emotions} note={sentence(calculated.smilingShare, 'are smiling')} />
          </div>
          {drive.photos > 0 && (
            <>
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Drive photos tagged #{scope.id} or placed in these events</h2>
                <p className={styles.cardNote}>
                  These photos came from a drive library whose files carry no event. Fanmass placed each one in an event from the
                  clubs read in it, its look and the fixture dates, recorded how sure each placement is, and tagged it with what it
                  found: library, sport, event, clubs, brands, emotions and people. An image reaches the drive only with a recorded opt-in.
                </p>
                <div className={styles.kpiGrid}>
                  <Kpi label="Drive photos" value={fmt(drive.photos)} text={detail(calculated.drivePlacedShare)} />
                  <Kpi label="Placed in an event" value={drive.placed > 0 ? fmt(drive.placed) : null} text={detail(calculated.driveConfidentShare)} />
                  <Kpi label="Analysed by Fanmass" value={percent(calculated.driveAnalysedShare)} text={detail(calculated.driveAnalysedShare)} />
                  <Kpi label="Opt-in recorded" value={percent(calculated.driveOptInShare)} text={detail(calculated.driveOptInShare)} />
                </div>
              </section>
              <div className={styles.columns}>
                <Bars title="Gender in drive photos" counts={drive.genders} note={drive.analysed > 0 ? `${fmt(drive.people)} people in ${fmt(drive.analysed)} analysed photos` : undefined} />
                <Bars title="Age groups in drive photos" counts={drive.ageGroups} />
                <Bars title="Emotions in drive photos" counts={drive.emotions} />
              </div>
              <div className={styles.columns}>
                <Names title="Brands" list={drive.brands} note="Photos in which the brand name was read from the picture" />
                <Names title="Clubs" list={drive.clubs} note="Photos in which the club name was read from the picture" />
                <Names title="Events" list={drive.events} note="Drive photos per event" />
              </div>
            </>
          )}
        </>
      )}

      {coverage.events > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Events in this report</h2>
          <p className={styles.cardNote}>
            {fmt(coverage.eventsWithCounters)} of {fmt(coverage.events)} have photo counters from Camera and{' '}
            {fmt(coverage.eventsWithPhotoResults)} have photo analysis from Fanmass. An event without them adds nothing to the figures above.
          </p>
          <table className={styles.table}>
            <thead>
              <tr><th>Event</th><th>Date</th><th>Camera counters</th><th>Fanmass analysis</th><th>Drive photos</th></tr>
            </thead>
            <tbody>
              {measured.events.map((event) => (
                <tr key={event.id}>
                  <td>{event.name || 'Unnamed event'}</td>
                  <td>{event.date ?? 'No date'}</td>
                  <td><span className={event.hasCounters ? styles.badge : `${styles.badge} ${styles.badgeOff}`}>{event.hasCounters ? 'Yes' : 'No'}</span></td>
                  <td><span className={event.hasPhotoResults ? styles.badge : `${styles.badge} ${styles.badgeOff}`}>{event.hasPhotoResults ? 'Yes' : 'No'}</span></td>
                  <td>{fmt(event.drivePhotos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
