import React from 'react';
import { CounterCard } from '../src/components/CounterCard/CounterCard';
import countersData from '../src/data/counters.json';

/**
 * Home page component displaying a grid of counter cards
 */
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {countersData.counters.map((counter) => (
            <CounterCard
              key={counter.id}
              title={counter.title}
              initialValue={0}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
