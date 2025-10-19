// components/FootballDataFixtureCard.tsx
// WHAT: Present a Football-Data fixture with action to use it in Quick Add
// WHY: Enable one-click event creation from scheduled matches

import React from 'react';
import type { FootballDataFixtureDoc } from '@/lib/footballData.types';

interface Props {
  fixture: FootballDataFixtureDoc;
  onUse: (fixture: FootballDataFixtureDoc) => void;
}

export default function FootballDataFixtureCard({ fixture, onUse }: Props) {
  return (
    <div className="card border-left-accent mb-3" style={{ padding: 12 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">
          <strong>{fixture.competition.name}</strong> · Matchday {fixture.matchday ?? '-'} · {fixture.status}
        </div>
        <div className="text-sm text-gray-600">{fixture.utcDate}</div>
      </div>
      <div className="flex items-center gap-3">
        {fixture.homeTeam.crest && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fixture.homeTeam.crest} alt={fixture.homeTeam.name} width={24} height={24} />
        )}
        <div className="font-medium">{fixture.homeTeam.shortName || fixture.homeTeam.name}</div>
        <div>vs</div>
        <div className="font-medium">{fixture.awayTeam.shortName || fixture.awayTeam.name}</div>
        {fixture.awayTeam.crest && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fixture.awayTeam.crest} alt={fixture.awayTeam.name} width={24} height={24} />
        )}
        <div className="ml-auto text-sm text-gray-600">{fixture.venue || ''}</div>
        <button className="btn btn-small btn-primary" onClick={() => onUse(fixture)}>Use This Fixture</button>
      </div>
    </div>
  );
}
