import type { Metadata } from 'next';
import { getReleaseNotes } from '@/lib/releaseNotesParser';
import WhatsNewClient from './WhatsNewClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "What's New & Release Notes — Messmass",
  description: 'Chronological release notes, newly shipped capabilities, and continuous improvements across Messmass.',
};

export default function WhatsNewPage() {
  const notes = getReleaseNotes(50);
  return <WhatsNewClient initialNotes={notes} />;
}
