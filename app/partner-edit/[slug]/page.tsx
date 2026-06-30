import { redirect } from 'next/navigation';
import getDb from '@/lib/db';
import { resolvePartnerIdentifier } from '@/lib/partnerIdentifier';
import PartnerEditClient from './PartnerEditClient';

export default async function PartnerEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const { slug } = await params;
  const { variant } = await searchParams;
  const db = await getDb();
  const resolved = await resolvePartnerIdentifier(db as any, slug);
  const canonicalSlug = resolved?.canonicalSlug || slug;

  if (resolved?.canonicalSlug && resolved.canonicalSlug !== slug) {
    redirect(`/partner-edit/${resolved.canonicalSlug}${variant ? `?variant=${encodeURIComponent(variant)}` : ''}`);
  }

  return <PartnerEditClient slug={canonicalSlug} variantSlug={variant || null} />;
}
