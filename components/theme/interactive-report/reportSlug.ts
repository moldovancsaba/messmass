import { InteractiveReportData } from './types';

/**
 * Slug understood by /interactive-report/[partnerSlug] and /api/interactive-report/[partnerSlug].
 *
 * Those routes read a bare slug as a partner, so hashtag and event scopes must carry their
 * prefix ("hashtag-<name>", "event-<slug>"); a bare hashtag would resolve to the wrong scope.
 * Returns null when the data carries no slug at all, so callers can hide the link instead of
 * pointing it at a made-up scope.
 */
export function getReportSlug(
  data: Pick<InteractiveReportData, 'scope' | 'partner'>
): string | null {
  const scope = data.scope;

  if (scope?.type === 'hashtag') {
    return scope.id ? `hashtag-${scope.id}` : null;
  }

  if (scope?.type === 'event') {
    const key = scope.viewSlug || scope.id;
    return key ? `event-${key}` : null;
  }

  return scope?.viewSlug || data.partner?.viewSlug || null;
}
