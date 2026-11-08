'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MatchItem, VisionProgressData } from './types';
import styles from './interactive-report.module.css';

interface FanmassTerritoryMapProps {
  matches: MatchItem[];
  vision?: VisionProgressData | null;
}

interface CityVenueInfo {
  name: string;
  region: string;
  lat: number;
  lng: number;
  arenas: string[];
  primaryClubs: string[];
}

const CITIES_REGISTRY: Record<string, CityVenueInfo> = {
  Budapest: {
    name: 'Budapest',
    region: 'Közép-Magyarország',
    lat: 47.4979,
    lng: 19.0402,
    arenas: ['Szusza Ferenc Stadion', 'Groupama Aréna', 'Új Hidegkuti Nándor Stadion', 'Tüskecsarnok', 'Újpesti Jégcsarnok'],
    primaryClubs: ['Újpest FC', 'Ferencvárosi TC', 'MTK Budapest', 'FTC Telekom Jégkorong', 'UTE Jégkorong', 'Honvéd'],
  },
  Székesfehérvár: {
    name: 'Székesfehérvár',
    region: 'Közép-Dunántúl',
    lat: 47.186,
    lng: 18.4221,
    arenas: ['Alba Aréna', 'Sóstói Stadion', 'Ifjabb Ocskay Gábor Jégcsarnok'],
    primaryClubs: ['Hydro Fehérvár AV19', 'Fehérvár FC', 'Alba Fehérvár'],
  },
  Miskolc: {
    name: 'Miskolc',
    region: 'Észak-Magyarország',
    lat: 48.1035,
    lng: 20.7784,
    arenas: ['DVTK Stadion', 'DVTK Aréna', 'Miskolci Jégcsarnok'],
    primaryClubs: ['Diósgyőri VTK', 'DVTK-Huntherm', 'DVTK Jegesmedvék'],
  },
  Győr: {
    name: 'Győr',
    region: 'Nyugat-Dunántúl',
    lat: 47.6875,
    lng: 17.6504,
    arenas: ['ETO Park', 'Audi Aréna Győr'],
    primaryClubs: ['ETO FC Győr', 'Győri Audi ETO KC'],
  },
  Szeged: {
    name: 'Szeged',
    region: 'Dél-Alföld',
    lat: 46.253,
    lng: 20.1414,
    arenas: ['PICK Aréna'],
    primaryClubs: ['OTP Bank-PICK Szeged'],
  },
  Debrecen: {
    name: 'Debrecen',
    region: 'Észak-Alföld',
    lat: 47.5316,
    lng: 21.6273,
    arenas: ['Nagyerdei Stadion', 'Oláh Gábor utcai Sportcsarnok'],
    primaryClubs: ['DVSC', 'DEAC'],
  },
  Szolnok: {
    name: 'Szolnok',
    region: 'Észak-Alföld',
    lat: 47.1755,
    lng: 20.183,
    arenas: ['Tiszaligeti Városi Sportcsarnok'],
    primaryClubs: ['NHSZ-Szolnoki Olajbányász'],
  },
  Oroszlány: {
    name: 'Oroszlány',
    region: 'Közép-Dunántúl',
    lat: 47.4883,
    lng: 18.3183,
    arenas: ['Krajnyik "Akác" András Sportcsarnok'],
    primaryClubs: ['MVM-OSE Lions'],
  },
  Szombathely: {
    name: 'Szombathely',
    region: 'Nyugat-Dunántúl',
    lat: 47.2389,
    lng: 16.6347,
    arenas: ['Arena Savaria', 'Haladás Sportkomplexum'],
    primaryClubs: ['Falco-Vulcano Energia KC Szombathely'],
  },
  Pécs: {
    name: 'Pécs',
    region: 'Dél-Dunántúl',
    lat: 46.0727,
    lng: 18.2323,
    arenas: ['Lauber Dezső Sportcsarnok', 'Nemzeti Kosárlabda Akadémia'],
    primaryClubs: ['NKA Universitas Pécs', 'Ratgéber Akadémia'],
  },
  Zalaegerszeg: {
    name: 'Zalaegerszeg',
    region: 'Nyugat-Dunántúl',
    lat: 46.8528,
    lng: 16.8425,
    arenas: ['ZTE Aréna', 'Városi Sportcsarnok'],
    primaryClubs: ['Zalaegerszegi TE FC', 'Zalakerámia ZTE KK'],
  },
  Paks: {
    name: 'Paks',
    region: 'Dél-Dunántúl',
    lat: 46.6269,
    lng: 18.8578,
    arenas: ['Fehérvári úti Stadion', 'ASE Sportcsarnok'],
    primaryClubs: ['Paksi FC', 'Atomerőmű SE'],
  },
  Felcsút: {
    name: 'Felcsút',
    region: 'Közép-Dunántúl',
    lat: 47.4583,
    lng: 18.5833,
    arenas: ['Pancho Aréna'],
    primaryClubs: ['Puskás Akadémia FC'],
  },
  Kisvárda: {
    name: 'Kisvárda',
    region: 'Észak-Alföld',
    lat: 48.2231,
    lng: 22.0789,
    arenas: ['Várkerti Stadion'],
    primaryClubs: ['Kisvárda Master Good'],
  },
  Kazincbarcika: {
    name: 'Kazincbarcika',
    region: 'Észak-Magyarország',
    lat: 48.2514,
    lng: 20.6272,
    arenas: ['Kolorcity Aréna', 'Pete András Stadion'],
    primaryClubs: ['Kolorcity Kazincbarcika SC'],
  },
  Esztergom: {
    name: 'Esztergom',
    region: 'Közép-Dunántúl',
    lat: 47.785,
    lng: 18.7408,
    arenas: ['Suzuki Aréna'],
    primaryClubs: ['MOL Esztergom Kézilabda'],
  },
  Sopron: {
    name: 'Sopron',
    region: 'Nyugat-Dunántúl',
    lat: 47.6744,
    lng: 16.5786,
    arenas: ['Novomatic Aréna Sopron'],
    primaryClubs: ['Soproni KC', 'Sopron Basket'],
  },
  Kecskemét: {
    name: 'Kecskemét',
    region: 'Dél-Alföld',
    lat: 46.9039,
    lng: 19.6744,
    arenas: ['Messzi István Sportcsarnok', 'Széktói Stadion'],
    primaryClubs: ['Kecskeméti TE', 'Duna Aszfalt-DTKH Kecskemét'],
  },
  Kaposvár: {
    name: 'Kaposvár',
    region: 'Dél-Dunántúl',
    lat: 46.3689,
    lng: 17.8089,
    arenas: ['Kaposvár Aréna'],
    primaryClubs: ['Kometa Kaposvári KK'],
  },
  Szekszárd: {
    name: 'Szekszárd',
    region: 'Dél-Dunántúl',
    lat: 46.3533,
    lng: 18.7061,
    arenas: ['Szekszárdi Városi Sportcsarnok'],
    primaryClubs: ['TARR KSC Szekszárd'],
  },
};

function resolveCityForMatch(match: MatchItem): string {
  const text = `${match.cleanName} ${match.partnerName} ${match.venue}`.toLowerCase();
  if (text.includes('fehérvár') || text.includes('av19') || text.includes('sóstó') || text.includes('dávid kornél')) return 'Székesfehérvár';
  if (text.includes('diósgyőr') || text.includes('dvtk') || text.includes('miskolc') || text.includes('huntherm')) return 'Miskolc';
  if (text.includes('győr') || text.includes('eto')) return 'Győr';
  if (text.includes('szeged') || text.includes('pick aréna')) return 'Szeged';
  if (text.includes('debrecen') || text.includes('dvsc') || text.includes('deac')) return 'Debrecen';
  if (text.includes('szolnok') || text.includes('olajbányász')) return 'Szolnok';
  if (text.includes('oroszlány') || text.includes('ose lions')) return 'Oroszlány';
  if (text.includes('szombathely') || text.includes('falco') || text.includes('savaria')) return 'Szombathely';
  if (text.includes('pécs') || text.includes('ratgéber')) return 'Pécs';
  if (text.includes('zalaegerszeg') || text.includes('zte')) return 'Zalaegerszeg';
  if (text.includes('paks') || text.includes('atomerőmű')) return 'Paks';
  if (text.includes('puskás akadémia') || text.includes('pancho') || text.includes('felcsút')) return 'Felcsút';
  if (text.includes('kisvárda')) return 'Kisvárda';
  if (text.includes('kazincbarcika') || text.includes('kolorcity')) return 'Kazincbarcika';
  if (text.includes('esztergom')) return 'Esztergom';
  if (text.includes('sopron')) return 'Sopron';
  if (text.includes('kecskemét')) return 'Kecskemét';
  if (text.includes('kaposvár')) return 'Kaposvár';
  if (text.includes('szekszárd')) return 'Szekszárd';
  return 'Budapest';
}

const SPORT_COLORS: Record<string, string> = {
  Football: '#16a34a',
  'Ice Hockey': '#0284c7',
  Basketball: '#ea580c',
  Handball: '#9333ea',
  Multi: '#f59e0b',
};

const SPORT_ICONS: Record<string, string> = {
  Football: '⚽',
  'Ice Hockey': '🏒',
  Basketball: '🏀',
  Handball: '🤾',
  Multi: '🏟️',
};

export default function FanmassTerritoryMap({ matches, vision }: FanmassTerritoryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Filter matches based on selected sport
  const filteredMatches = useMemo(() => {
    if (selectedSport === 'all') return matches;
    return matches.filter((m) => m.sport.toLowerCase() === selectedSport.toLowerCase());
  }, [matches, selectedSport]);

  // City aggregation
  const cityAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        city: CityVenueInfo;
        matches: MatchItem[];
        totalSubmitted: number;
        totalApproved: number;
        sports: Set<string>;
      }
    >();

    for (const m of filteredMatches) {
      const cityName = resolveCityForMatch(m);
      const info = CITIES_REGISTRY[cityName] || {
        name: cityName,
        region: 'Közép-Magyarország',
        lat: 47.4979,
        lng: 19.0402,
        arenas: ['Arena'],
        primaryClubs: [],
      };

      if (!map.has(cityName)) {
        map.set(cityName, {
          city: info,
          matches: [],
          totalSubmitted: 0,
          totalApproved: 0,
          sports: new Set<string>(),
        });
      }

      const rec = map.get(cityName)!;
      rec.matches.push(m);
      rec.totalSubmitted += m.submitted;
      rec.totalApproved += m.approved;
      rec.sports.add(m.sport);
    }

    return Array.from(map.values()).sort((a, b) => b.totalSubmitted - a.totalSubmitted);
  }, [filteredMatches]);

  // Regional breakdown
  const regionalBreakdown = useMemo(() => {
    const regMap: Record<string, { submitted: number; matches: number; cities: Set<string> }> = {};
    for (const ca of cityAggregates) {
      const r = ca.city.region;
      if (!regMap[r]) {
        regMap[r] = { submitted: 0, matches: 0, cities: new Set() };
      }
      regMap[r].submitted += ca.totalSubmitted;
      regMap[r].matches += ca.matches.length;
      regMap[r].cities.add(ca.city.name);
    }

    const totalSub = cityAggregates.reduce((acc, c) => acc + c.totalSubmitted, 0) || 1;
    return Object.entries(regMap)
      .map(([region, stat]) => ({
        region,
        submitted: stat.submitted,
        matches: stat.matches,
        citiesCount: stat.cities.size,
        percentage: ((stat.submitted / totalSub) * 100).toFixed(1),
      }))
      .sort((a, b) => b.submitted - a.submitted);
  }, [cityAggregates]);

  const activeCityDetails = useMemo(() => {
    if (!selectedCity) return null;
    return cityAggregates.find((c) => c.city.name === selectedCity) || null;
  }, [selectedCity, cityAggregates]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    let isSubscribed = true;

    async function setupMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Ensure leaflet CSS is present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // If map is already initialized, clear markers
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [47.1625, 19.5033],
          zoom: 7,
          minZoom: 6,
          maxZoom: 13,
          scrollWheelZoom: false,
        });

        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove previous markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      // Add pins for current city aggregates
      cityAggregates.forEach((item) => {
        const { city, totalSubmitted, matches: cityMatches, sports } = item;
        const sportsList = Array.from(sports);
        const primarySport = sportsList.length === 1 ? sportsList[0] : 'Multi';
        const color = SPORT_COLORS[primarySport] || '#16a34a';
        const iconSymbol = SPORT_ICONS[primarySport] || '🏟️';

        // Marker radius (18px to 38px based on volume)
        const radius = Math.min(38, Math.max(20, Math.round(Math.sqrt(totalSubmitted) * 0.75)));

        const customHtml = `
          <div style="
            width: ${radius * 2}px;
            height: ${radius * 2}px;
            background: ${color}ee;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35), 0 0 10px ${color}88;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-family: inherit;
            font-weight: 700;
            font-size: ${radius > 26 ? '14px' : '11px'};
            cursor: pointer;
            transition: transform 0.2s ease;
          " class="territory-map-marker" title="${city.name} (${totalSubmitted} selfies)">
            <span style="display:flex;align-items:center;gap:2px;">
              <span>${iconSymbol}</span>
              ${radius > 24 ? `<span>${cityMatches.length}</span>` : ''}
            </span>
          </div>
        `;

        const divIcon = L.divIcon({
          className: '',
          html: customHtml,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });

        const marker = L.marker([city.lat, city.lng], { icon: divIcon }).addTo(map);

        // Tooltip / Popup
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; min-width: 180px; padding: 4px;">
            <div style="font-weight: 800; font-size: 15px; color: #0f172a; margin-bottom: 2px;">
              ${iconSymbol} ${city.name}
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
              ${city.region}
            </div>
            <div style="background: #f8fafc; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
              <div><strong>${cityMatches.length}</strong> Matches Hosted</div>
              <div><strong>${totalSubmitted.toLocaleString()}</strong> Fan Photos Taken</div>
              <div style="font-size: 11px; color: #475569;">Sports: ${sportsList.join(', ')}</div>
            </div>
            <div style="font-size: 11px; color: #3b82f6; font-weight: 600;">
              Click to view hosted match details ➔
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { offset: [0, -radius / 2] });

        marker.on('click', () => {
          if (!isSubscribed) return;
          setSelectedCity(city.name);
        });

        markersRef.current.push(marker);
      });
    }

    setupMap();

    return () => {
      isSubscribed = false;
    };
  }, [cityAggregates]);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    const target = cityAggregates.find((c) => c.city.name === cityName);
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.city.lat, target.city.lng], 10, {
        duration: 1.2,
      });
    }
  };

  const handleResetMap = () => {
    setSelectedCity(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([47.1625, 19.5033], 7, {
        duration: 1.0,
      });
    }
  };

  const sportsOptions = [
    { id: 'all', label: `All Sports (${matches.length})` },
    { id: 'Football', label: `⚽ Football (${matches.filter((m) => m.sport === 'Football').length})` },
    { id: 'Ice Hockey', label: `🏒 Ice Hockey (${matches.filter((m) => m.sport === 'Ice Hockey').length})` },
    { id: 'Basketball', label: `🏀 Basketball (${matches.filter((m) => m.sport === 'Basketball').length})` },
    { id: 'Handball', label: `🤾 Handball (${matches.filter((m) => m.sport === 'Handball').length})` },
  ];

  return (
    <div className={styles.visionCard} style={{ marginTop: '24px' }}>
      {/* Header and Sport Filter */}
      <div className={styles.streamControlHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '20px' }}>🗺️</span>
            <h3 className={styles.streamControlTitle}>
              Geographic Activation &amp; Territory Distribution Map (Hungary)
            </h3>
            <span className={styles.runningBadge}>OpenStreetMap Live</span>
          </div>
          <p className={styles.cardSubtitle}>
            Interactive venue and territorial mapping across {cityAggregates.length} Hungarian host cities, stadiums, and indoor arenas. Filter by sport discipline to explore local selfie volume and fan clusters.
          </p>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterPillsRow}>
          {sportsOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setSelectedSport(opt.id);
                setSelectedCity(null);
              }}
              className={`${styles.filterPill} ${selectedSport.toLowerCase() === opt.id.toLowerCase() ? styles.filterPillActive : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Side Panel Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)',
          gap: '20px',
          marginTop: '16px',
        }}
      >
        {/* Left Column: Interactive Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              background: '#f8fafc',
              height: '520px',
            }}
          >
            {/* The Leaflet Container */}
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Quick Map Controls Overlay */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 1000,
                display: 'flex',
                gap: '8px',
              }}
            >
              <button
                onClick={handleResetMap}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🔄 Reset Hungary View
              </button>
            </div>

            {/* Map Legend */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(6px)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '11px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700, color: '#334155' }}>Disciplines:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SPORT_COLORS.Football }} />
                Football
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SPORT_COLORS['Ice Hockey'] }} />
                Ice Hockey
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SPORT_COLORS.Basketball }} />
                Basketball
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SPORT_COLORS.Handball }} />
                Handball
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SPORT_COLORS.Multi }} />
                Multi-Sport
              </span>
            </div>
          </div>

          {/* Vision Clustering Architecture Callout */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '12px',
              color: '#334155',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🧠</span> AI Multi-Modal Match &amp; Venue Clustering Engine
            </div>
            <div>
              Because raw mobile web selfie uploads strip GPS coordinates for privacy compliance (GDPR), each selfie is automatically clustered and attributed to these specific host venues using a 3-tier probabilistic model:
              <strong style={{ color: '#0284c7' }}> (1) Club &amp; Jersey Recognition</strong> (e.g. Hydro Fehérvár AV19, Újpest, DVTK, Szolnoki Olajbányász),
              <strong style={{ color: '#16a34a' }}> (2) Sport Folder Isolation</strong> (Football, Basketball, Handball, Ice Hockey), and
              <strong style={{ color: '#ea580c' }}> (3) Calendar Fixture Corroboration</strong> cross-referenced against Messmass match schedules.
            </div>
          </div>
        </div>

        {/* Right Column: Territorial Breakdown & City Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected City Drawer (if any city clicked) */}
          {activeCityDetails ? (
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 4px 14px rgba(59,130,246,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Selected Venue Hub • {activeCityDetails.city.region}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    📍 {activeCityDetails.city.name}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedCity(null)}
                  style={{
                    border: 'none',
                    background: '#f1f5f9',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  Close ✕
                </button>
              </div>

              {/* City Arenas & Clubs */}
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                <div><strong>Arenas / Stadiums:</strong> {activeCityDetails.city.arenas.join(', ')}</div>
                {activeCityDetails.city.primaryClubs.length > 0 && (
                  <div><strong>Resident Clubs:</strong> {activeCityDetails.city.primaryClubs.join(', ')}</div>
                )}
              </div>

              {/* KPI Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Matches</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{activeCityDetails.matches.length}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', color: '#166534' }}>Total Photos</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>{activeCityDetails.totalSubmitted.toLocaleString()}</div>
                </div>
                <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af' }}>Approved</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e40af' }}>{activeCityDetails.totalApproved.toLocaleString()}</div>
                </div>
              </div>

              {/* Hosted Matches List */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Matches Hosted in {activeCityDetails.city.name}:
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeCityDetails.matches.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.cleanName}</div>
                      <div style={{ color: '#64748b' }}>{m.date} • {m.sport}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>
                      📸 {m.submitted}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Regional Territory Breakdown (NUTS-2 Regions) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Hungarian Macro-Region Distribution
            </h4>
            <p className={styles.cardSubtitle} style={{ marginBottom: '12px' }}>
              Aggregated selfie and fan activation share across Hungary&apos;s 7 statistical macro-regions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {regionalBreakdown.map((rb) => (
                <div key={rb.region}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{rb.region}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {rb.submitted.toLocaleString()} ({rb.percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${rb.percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Host Cities Leaderboard */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Top Fan Activation Cities
            </h4>
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {cityAggregates.map((ca, idx) => (
                <div
                  key={ca.city.name}
                  onClick={() => handleCitySelect(ca.city.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: selectedCity === ca.city.name ? '#eff6ff' : '#f8fafc',
                    border: selectedCity === ca.city.name ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', width: '18px' }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {ca.city.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {ca.matches.length} matches • {Array.from(ca.sports).join(', ')}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#16a34a' }}>
                    {ca.totalSubmitted.toLocaleString()} 📸
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
