'use client';
/* eslint-disable react/forbid-dom-props -- the box position is data: a fraction of the photo, not a style choice */
/* eslint-disable @next/next/no-img-element -- crops and photos are content-addressed R2 files of unknown size */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BrandEvidenceListing, EvidenceKind, EvidenceSample } from '@/lib/fanmassEvidence';
import report from './interactive-report.module.css';
import styles from './brand-evidence.module.css';

interface BrandEvidenceGalleryProps {
  kind: EvidenceKind;
  name: string;
  /** Tenant of the report; the API refuses any other than the SZRT one. */
  organizationId?: string;
}

type Listing = BrandEvidenceListing & { published: boolean };

const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
const percent = (value: number | null) => (value === null ? 'n/a' : `${Math.round(value * 100)}%`);

function matchLabel(match: string | null): string {
  if (match === 'exact') return 'The text is exactly the name';
  if (match === 'contains') return 'The text contains the name';
  return match ? match : 'n/a';
}

function methodLabel(sample: EvidenceSample): string {
  return sample.method === 'ocr' ? 'Text read from the picture (OCR)' : sample.method;
}

/**
 * The proof behind a brand or club figure: crops of the pictures where its name was read from the image,
 * and on click the box on the photo with how it was identified. A name only the model suggested is counted
 * but never shown here as proof.
 */
export default function BrandEvidenceGallery({ kind, name, organizationId }: BrandEvidenceGalleryProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [open, setOpen] = useState<EvidenceSample | null>(null);
  // Width / height of the opened photo. The frame takes exactly that shape so the box lands on the same spot of the picture.
  const [ratio, setRatio] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ kind, name });
    if (organizationId) query.set('organizationId', organizationId);
    setState('loading');
    setListing(null);
    fetch(`/api/interactive-report/brand-evidence?${query.toString()}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data?.success === true) {
          setListing(data as Listing);
          setState('ready');
        } else {
          setState('error');
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setState('error');
      });
    return () => controller.abort();
  }, [kind, name, organizationId]);

  const close = useCallback(() => {
    setOpen(null);
    setRatio(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, close]);

  if (state === 'loading') return <p className={styles.status} aria-live="polite">Loading proof from the pictures…</p>;
  if (state === 'error') return <p className={styles.status}>The proof samples could not be loaded.</p>;
  // Before a person approved the analysis for publication nothing about it is shown.
  if (!listing || !listing.published) return null;

  return (
    <section className={styles.section} aria-label={`Proof for ${listing.name}`}>
      <h4 className={styles.title}>Proof from the pictures</h4>
      <p className={styles.summary}>
        {listing.provenPhotos > 0
          ? <>The name was read from the picture in <strong>{plural(listing.provenPhotos, 'photo', 'photos')}</strong>
            {listing.samples.length === 1 ? '. The strongest sample is shown.' : listing.samples.length > 1 ? `. The ${listing.samples.length} strongest samples are shown.` : '.'}</>
          : 'No picture where this name was read from the image is available yet.'}
        {listing.modelIdentifiedPhotos > 0 && (
          <> In {plural(listing.modelIdentifiedPhotos, 'more photo', 'more photos')} only the model suggested it. Those are not shown as proof.</>
        )}
      </p>
      {listing.samples.length > 0 && (
        <ul className={styles.grid}>
          {listing.samples.map((sample) => (
            <li key={sample.id}>
              <button type="button" className={styles.tile} onClick={() => { setRatio(null); setOpen(sample); }} aria-label={`Show how “${sample.readText}” was identified`}>
                <span className={styles.cropWrap}>
                  <img src={sample.cropUrl} alt={`Crop of the picture where “${sample.readText}” was read`} loading="lazy" />
                </span>
                <span className={styles.caption}>
                  <span className={styles.readText}>“{sample.readText}”</span>
                  <span className={styles.meta}>{sample.sport} · {percent(sample.confidence)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && typeof document !== 'undefined' && createPortal(
        <div className={report.partnerModalOverlay} role="dialog" aria-modal="true" aria-label={`How ${listing.name} was identified`} onClick={(event) => { event.stopPropagation(); close(); }}>
          <div className={`${report.partnerModalContent} ${styles.lightbox}`} onClick={(event) => event.stopPropagation()}>
            <div className={report.partnerModalHeader}>
              <h3 className={styles.title}>{listing.name}</h3>
              <button ref={closeRef} type="button" className={styles.close} onClick={close}>Close</button>
            </div>
            <div className={report.partnerModalBody}>
              {open.photoUrl ? (
                <div className={styles.photoFrame} style={{ aspectRatio: ratio ?? 4 / 3, width: `min(100%, ${58 * (ratio ?? 4 / 3)}vh)` }}>
                  <img
                    src={open.photoUrl}
                    alt={`Photo with the box where “${open.readText}” was read`}
                    onLoad={(event) => setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight || null)}
                  />
                  <span
                    className={styles.box}
                    style={{ left: `${open.box.x * 100}%`, top: `${open.box.y * 100}%`, width: `${open.box.w * 100}%`, height: `${open.box.h * 100}%` }}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.cropLarge}>
                    <img src={open.cropUrl} alt={`Crop of the picture where “${open.readText}” was read`} />
                  </div>
                  <p className={styles.summary}>The full photo is not published, so only the crop is shown.</p>
                </>
              )}
              <dl className={styles.facts}>
                <dt>How it was identified</dt><dd>{methodLabel(open)}</dd>
                <dt>Text read</dt><dd>“{open.readText}”</dd>
                <dt>Match to the name</dt><dd>{matchLabel(open.match)}</dd>
                <dt>Text reading confidence</dt><dd>{percent(open.ocrConfidence)}</dd>
                <dt>Overall confidence</dt><dd>{percent(open.confidence)}</dd>
                <dt>Item</dt><dd>{open.itemType}{open.onPerson ? ', worn by a person' : ''}</dd>
                <dt>Sport</dt><dd>{open.sport}</dd>
              </dl>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
