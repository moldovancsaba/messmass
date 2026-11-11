'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MatchItem, ScopeHeader, VisionProgressData } from './types';
import ConnectedSelfiesModal, { ClubStat } from './ConnectedSelfiesModal';
import styles from './territory-map.module.css';

interface TerritoryMapCanvasProps {
  matches: MatchItem[];
  vision?: VisionProgressData | null;
  /** Slug the report routes understand; links are hidden when it is missing. */
  partnerSlug?: string;
  partnerName?: string;
  scope?: ScopeHeader | null;
  embedded?: boolean;
}

export interface VenueDetail {
  id: string;
  name: string;
  city: string;
  region: string;
  coordinates: [number, number]; // [lng, lat]
  /** Sports seen at this venue in the matches and detected clubs linked to it. Empty when none is recorded. */
  sports: string[];
  /** Selfies from linked matches, otherwise club appearances detected by the vision analysis. */
  totalSightings: number;
  matchCount: number;
  /** Clubs from the vision analysis that are linked to this venue, largest first. */
  detectedClubs: ClubStat[];
}

interface VenueGeo {
  id: string;
  name: string;
  city: string;
  region: string;
  coordinates: [number, number]; // [lng, lat]
  /** Club names used only to link matches and detected clubs to the venue. Never shown as a statement about the venue. */
  clubKeys: string[];
}

const MAP_CENTER: [number, number] = [19.5, 47.16];
const MAP_ZOOM = 7.2;
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [15.5, 45.4], // SW bounds
  [23.5, 49.0], // NE bounds
];

// Venue lookup: name, city, region and coordinates only. All figures on the map come from the report data.
const VENUE_REGISTRY: VenueGeo[] = [
  { id: 'sopron-novomatic', name: 'Novomatic Aréna Sopron', city: 'Sopron', region: 'Nyugat-Dunántúl', coordinates: [16.5786, 47.6744], clubKeys: ['Sopron KC', 'Sopron Basket'] },
  { id: 'szekesfehervar-ocskay', name: 'Ifjabb Ocskay Gábor Jégcsarnok', city: 'Székesfehérvár', region: 'Közép-Dunántúl', coordinates: [18.4221, 47.186], clubKeys: ['Hydro Fehérvár AV19'] },
  { id: 'szekesfehervar-sostoi', name: 'Sóstói Stadion', city: 'Székesfehérvár', region: 'Közép-Dunántúl', coordinates: [18.415, 47.172], clubKeys: ['Fehérvár FC'] },
  { id: 'miskolc-dvtk-arena', name: 'DVTK Aréna & Stadion', city: 'Miskolc', region: 'Észak-Magyarország', coordinates: [20.7784, 48.1035], clubKeys: ['Diósgyőri VTK', 'DVTK Jegesmedvék', 'DVTK-Huntherm'] },
  { id: 'szeged-pick-arena', name: 'PICK Aréna', city: 'Szeged', region: 'Dél-Alföld', coordinates: [20.1414, 46.253], clubKeys: ['OTP Bank-PICK Szeged'] },
  { id: 'veszprem-arena', name: 'Veszprém Aréna', city: 'Veszprém', region: 'Közép-Dunántúl', coordinates: [17.915, 47.093], clubKeys: ['Telekom Veszprém'] },
  { id: 'budapest-groupama', name: 'Groupama Aréna', city: 'Budapest', region: 'Közép-Magyarország', coordinates: [19.098, 47.475], clubKeys: ['Ferencvárosi TC'] },
  { id: 'budapest-szusza', name: 'Szusza Ferenc Stadion', city: 'Budapest', region: 'Közép-Magyarország', coordinates: [19.083, 47.567], clubKeys: ['Újpest FC'] },
  { id: 'budapest-pler', name: 'Budapest Sportcsarnok / PLER', city: 'Budapest', region: 'Közép-Magyarország', coordinates: [19.167, 47.438], clubKeys: ['PLER-Budapest'] },
  { id: 'szombathely-savaria', name: 'Arena Savaria', city: 'Szombathely', region: 'Nyugat-Dunántúl', coordinates: [16.6347, 47.2389], clubKeys: ['Falco KC Szombathely'] },
  { id: 'szolnok-tiszaligeti', name: 'Tiszaligeti Városi Sportcsarnok', city: 'Szolnok', region: 'Észak-Alföld', coordinates: [20.183, 47.1755], clubKeys: ['Szolnoki Olajbányász'] },
  { id: 'oroszlay-krajnyik', name: 'Krajnyik "Akác" András Sportcsarnok', city: 'Oroszlány', region: 'Közép-Dunántúl', coordinates: [18.3183, 47.4883], clubKeys: ['MVM-OSE Lions'] },
  { id: 'debrecen-nagyerdei', name: 'Nagyerdei Stadion & Oláh Gábor csarnok', city: 'Debrecen', region: 'Észak-Alföld', coordinates: [21.6273, 47.5316], clubKeys: ['Debreceni VSC', 'DEAC'] },
  { id: 'gyor-eto-audi', name: 'ETO Park & Audi Aréna Győr', city: 'Győr', region: 'Nyugat-Dunántúl', coordinates: [17.6504, 47.6875], clubKeys: ['Győri ETO', 'Győri Audi ETO KC'] },
  { id: 'kaposvar-arena', name: 'Kaposvár Aréna', city: 'Kaposvár', region: 'Dél-Dunántúl', coordinates: [17.8089, 46.3689], clubKeys: ['Kometa Kaposvári KK'] },
  { id: 'paks-ase', name: 'ASE Sportcsarnok & Fehérvári úti Stadion', city: 'Paks', region: 'Dél-Dunántúl', coordinates: [18.8578, 46.6269], clubKeys: ['Atomerőmű SE', 'Paksi FC'] },
  { id: 'kormend-sportcsarnok', name: 'Körmend Városi Sportcsarnok', city: 'Körmend', region: 'Nyugat-Dunántúl', coordinates: [16.605, 47.012], clubKeys: ['Egis Körmend'] },
  { id: 'kozarmisleny-stadion', name: 'Kozármislenyi Stadion', city: 'Kozármisleny', region: 'Dél-Dunántúl', coordinates: [18.291, 46.031], clubKeys: ['HR-Rent Kozármisleny'] },
  { id: 'esztergom-suzuki', name: 'Suzuki Aréna', city: 'Esztergom', region: 'Közép-Dunántúl', coordinates: [18.7408, 47.785], clubKeys: ['MOL Esztergom Kézilabda'] },
];

function sportIcon(sport: string): string {
  const low = sport.toLowerCase();
  if (low.includes('foot')) return '⚽';
  if (low.includes('basket')) return '🏀';
  if (low.includes('hockey')) return '🏒';
  if (low.includes('hand')) return '🤾';
  return '🏅';
}

export default function TerritoryMapCanvas({
  matches,
  vision,
  partnerSlug,
  partnerName,
  scope,
  embedded = false,
}: TerritoryMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  // partnerSlug is the slug the report routes understand (hashtag scopes carry their hashtag- prefix)
  const reportSlug = partnerSlug || null;
  const mapTitleName = partnerName || scope?.name || '';

  const [activeSport, setActiveSport] = useState<string>('all');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Connected Selfies Modal state for club inspection
  const [modalClub, setModalClub] = useState<ClubStat | null>(null);

  // 1. Per-venue figures come from the report's matches and the vision analysis only.
  //    A venue with no linked match and no detected club is not listed.
  const venuesWithMetrics: VenueDetail[] = useMemo(() => {
    const baseAgg = vision?.aggregates;
    const result: VenueDetail[] = [];

    for (const v of VENUE_REGISTRY) {
      const venueMatches = (matches || []).filter((m) => {
        const text = `${m.matchName || ''} ${m.cleanName || ''} ${m.partnerName || ''} ${m.venue || ''}`.toLowerCase();
        return (
          text.includes(v.city.toLowerCase()) ||
          text.includes(v.name.toLowerCase()) ||
          v.clubKeys.some((c) => text.includes(c.toLowerCase()))
        );
      });

      const matchSelfies = venueMatches.reduce((acc, m) => acc + (m.selfies || 0), 0);

      let visionSightings = 0;
      const detectedClubs: ClubStat[] = [];
      for (const tc of baseAgg?.topClubs || []) {
        if (!tc.club) continue;
        if (v.clubKeys.some((c) => tc.club.toLowerCase().includes(c.toLowerCase()))) {
          visionSightings += tc.count || 0;
          detectedClubs.push({
            club: tc.club,
            count: tc.count || 0,
            logoUrl: tc.logoUrl,
            partnerId: tc.partnerId,
            partnerSlug: tc.partnerSlug,
            partnerName: tc.partnerName,
            sport: tc.sport,
          });
        }
      }
      for (const tv of baseAgg?.topVenues || []) {
        if (!tv.venue) continue;
        const venueLow = tv.venue.toLowerCase();
        if (venueLow.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(venueLow)) {
          visionSightings += tv.count || 0;
        }
      }
      detectedClubs.sort((a, b) => b.count - a.count);

      const totalSightings = matchSelfies > 0 ? matchSelfies : visionSightings;
      if (venueMatches.length === 0 && totalSightings === 0) continue;

      const sportSet = new Set<string>();
      for (const m of venueMatches) {
        if (m.sport && m.sport !== 'Other') sportSet.add(m.sport);
      }
      for (const dc of detectedClubs) {
        if (dc.sport && dc.sport.trim()) sportSet.add(dc.sport.trim());
      }

      result.push({
        id: v.id,
        name: v.name,
        city: v.city,
        region: v.region,
        coordinates: v.coordinates,
        sports: Array.from(sportSet),
        totalSightings,
        matchCount: venueMatches.length,
        detectedClubs,
      });
    }

    return result.sort((a, b) => b.totalSightings - a.totalSightings);
  }, [matches, vision]);

  // Sport chips are built from the sports present in the data.
  const sportOptions = useMemo(() => {
    const sports = new Set<string>();
    for (const v of venuesWithMetrics) {
      for (const s of v.sports) sports.add(s);
    }
    return Array.from(sports).sort((a, b) => a.localeCompare(b));
  }, [venuesWithMetrics]);

  // 2. Filter venues by active sport and search query
  const filteredVenues = useMemo(() => {
    return venuesWithMetrics.filter((v) => {
      if (activeSport !== 'all' && !v.sports.includes(activeSport)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesCity = v.city.toLowerCase().includes(q);
        const matchesClub = v.detectedClubs.some((c) => c.club.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesClub) return false;
      }
      return true;
    });
  }, [venuesWithMetrics, activeSport, searchQuery]);

  const selectedVenue = useMemo(() => {
    return venuesWithMetrics.find((v) => v.id === selectedVenueId) || venuesWithMetrics[0] || null;
  }, [venuesWithMetrics, selectedVenueId]);
  selectedIdRef.current = selectedVenue?.id ?? null;

  // 3. Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;
    let resizeHandler: (() => void) | null = null;

    // Dynamically import MapLibre GL
    import('maplibre-gl').then(({ Map }) => {
      if (!isMounted || !mapContainerRef.current) return;

      const map = new Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            basemap: {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors',
            },
          },
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
          layers: [
            {
              id: 'basemap',
              type: 'raster',
              source: 'basemap',
              paint: {
                'raster-saturation': -0.35,
                'raster-contrast': 0.05,
                'raster-brightness-max': 0.96,
              },
            },
          ],
        },
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        minZoom: 6.5,
        maxZoom: 16,
        maxBounds: MAP_BOUNDS,
        attributionControl: { compact: true },
        dragRotate: false,
        touchPitch: false,
      });

      resizeHandler = () => {
        map.resize();
      };
      window.addEventListener('resize', resizeHandler);

      map.on('load', () => {
        if (!isMounted) return;
        map.resize();

        // GeoJSON source with clustering
        const geojsonFeatures = venuesWithMetrics.map((v) => ({
          type: 'Feature' as const,
          id: v.id,
          properties: {
            id: v.id,
            name: v.name,
            city: v.city,
            sport: v.sports[0] || '',
            sightings: v.totalSightings,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: v.coordinates,
          },
        }));

        map.addSource('venues-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geojsonFeatures,
          },
          cluster: true,
          clusterRadius: 36,
          clusterMaxZoom: 12,
          promoteId: 'id',
        });

        // 1. Cluster bubble layer
        map.addLayer({
          id: 'venues-cluster',
          type: 'circle',
          source: 'venues-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#0f2c4a',
            'circle-radius': ['step', ['get', 'point_count'], 18, 4, 24, 8, 30],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });

        // 2. Cluster text
        map.addLayer({
          id: 'venues-cluster-count',
          type: 'symbol',
          source: 'venues-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // 3. Single venue Halo layer (Selected / Hovered)
        map.addLayer({
          id: 'venues-halo',
          type: 'circle',
          source: 'venues-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#88ca45',
              '#0f2c4a',
            ],
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              24,
              16,
            ],
            'circle-opacity': 0.28,
          },
        });

        // 4. Single venue Pin layer
        map.addLayer({
          id: 'venues-pin',
          type: 'circle',
          source: 'venues-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#88ca45',
              '#0f2c4a',
            ],
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              12,
              9,
            ],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        });

        // 5. Single venue Text label
        map.addLayer({
          id: 'venues-label',
          type: 'symbol',
          source: 'venues-source',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': '{city}',
            'text-size': 11,
            'text-anchor': 'top',
            'text-offset': [0, 1.2],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          },
          paint: {
            'text-color': '#0f172a',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });

        // Initial selection: the venue currently shown in the inspector panel
        if (selectedIdRef.current) {
          map.setFeatureState(
            { source: 'venues-source', id: selectedIdRef.current },
            { selected: true }
          );
        }

        // Click handlers
        map.on('click', 'venues-cluster', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['venues-cluster'] });
          const clusterId = features[0]?.properties?.cluster_id;
          if (clusterId != null) {
            const src: any = map.getSource('venues-source');
            src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
              if (!err && features[0].geometry.type === 'Point') {
                map.easeTo({
                  center: features[0].geometry.coordinates as [number, number],
                  zoom: zoom + 0.5,
                });
              }
            });
          }
        });

        map.on('click', 'venues-pin', (e) => {
          const feature = e.features?.[0];
          if (feature && feature.properties?.id) {
            const newId = feature.properties.id;
            setSelectedVenueId(newId);

            if (feature.geometry.type === 'Point') {
              map.easeTo({
                center: feature.geometry.coordinates as [number, number],
                zoom: Math.max(map.getZoom(), 10.5),
                duration: 600,
              });
            }
          }
        });

        // Pointer cursor
        map.on('mouseenter', 'venues-pin', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'venues-pin', () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', 'venues-cluster', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'venues-cluster', () => {
          map.getCanvas().style.cursor = '';
        });
      });

      mapRef.current = map;
    });

    return () => {
      isMounted = false;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [venuesWithMetrics]);

  // Update feature-state selection when the selected venue changes
  const selectedVenueKey = selectedVenue?.id ?? null;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getSource('venues-source')) return;

    for (const v of venuesWithMetrics) {
      map.setFeatureState(
        { source: 'venues-source', id: v.id },
        { selected: v.id === selectedVenueKey }
      );
    }
  }, [selectedVenueKey, venuesWithMetrics]);

  // Zoom controls
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetBounds = () => {
    mapRef.current?.easeTo({
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      duration: 800,
    });
  };

  const handleSelectVenue = (venue: VenueDetail) => {
    setSelectedVenueId(venue.id);
    mapRef.current?.easeTo({
      center: venue.coordinates,
      zoom: 11,
      duration: 700,
    });
  };

  return (
    <div className={embedded ? styles.embeddedRoot : styles.mapPageRoot}>
      {/* 1. Full-bleed GPU Map Canvas */}
      <div ref={mapContainerRef} className={styles.mapCanvasContainer} />

      {/* 2. Floating Top Header & Filter Band */}
      <div className={styles.floatingTopBar}>
        <div className={styles.topBarRow}>
          <div className={styles.headerBrandPill}>
            {reportSlug && embedded && (
              <a
                href={`/interactive-report/${reportSlug}/map`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.backBtn}
                style={{ background: '#1d4ed8', color: '#ffffff' }}
              >
                🗺️ Fullscreen Dedicated Map ↗
              </a>
            )}
            {reportSlug && !embedded && (
              <a href={`/interactive-report/${reportSlug}`} className={styles.backBtn}>
                ← Executive Report
              </a>
            )}
            <h1 className={styles.pageTitle}>
              <span>🗺️ {mapTitleName ? `${mapTitleName} ` : ''}Venues &amp; Territory Map</span>
            </h1>
          </div>
        </div>

        {/* Sport Chip Band ("map-band") */}
        <div className={styles.chipBandRow}>
          <button
            onClick={() => setActiveSport('all')}
            className={`${styles.chipBtn} ${activeSport === 'all' ? styles.chipBtnActive : ''}`}
          >
            🏆 All Sports ({venuesWithMetrics.length} Venues)
          </button>
          {sportOptions.map((sport) => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={`${styles.chipBtn} ${activeSport === sport ? styles.chipBtnActive : ''}`}
            >
              {sportIcon(sport)} {sport}
            </button>
          ))}

          {/* Search Box */}
          <div style={{ marginLeft: 'auto', position: 'relative', width: '220px' }}>
            <input
              type="text"
              placeholder="Filter venue or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 28px',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.95)',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '6px', fontSize: '11px', color: '#94a3b8' }}>
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* 3. Floating Detail Inspector Panel */}
      <div className={styles.floatingSidePanel}>
        {selectedVenue ? (
          <>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>{selectedVenue.name}</h2>
                <p className={styles.panelSubtitle}>
                  <span>📍 {selectedVenue.city}, {selectedVenue.region}</span>
                  {selectedVenue.sports.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{selectedVenue.sports.join(', ')}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className={styles.panelContent}>
              {/* 2 Stat Highlights */}
              <div className={styles.statGrid2x2}>
                <div className={styles.statBox}>
                  <div className={styles.statBoxLabel}>Identified Selfies</div>
                  <div className={styles.statBoxVal}>{selectedVenue.totalSightings.toLocaleString()}</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statBoxLabel}>Linked Matches</div>
                  <div className={styles.statBoxVal}>{selectedVenue.matchCount.toLocaleString()}</div>
                </div>
              </div>

              {/* Clubs detected by the vision analysis at this venue */}
              <div className={styles.venueFeatureCard}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f2c4a', marginBottom: '6px' }}>
                  🛡️ Clubs Detected
                </div>
                {selectedVenue.detectedClubs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedVenue.detectedClubs.map((c) => (
                      <button
                        key={c.club}
                        type="button"
                        onClick={() => setModalClub(c)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: '#1d4ed8',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>📸 {c.partnerName || c.club}</span>
                        <span>{c.count.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#475569' }}>n/a</div>
                )}
              </div>

              {/* Quick Venue List Switcher */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f2c4a', marginBottom: '8px' }}>
                  🏟️ {filteredVenues.length} Venues
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredVenues.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVenue(v)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: v.id === selectedVenue.id ? '#88ca45' : '#e2e8f0',
                        background: v.id === selectedVenue.id ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{v.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {v.city}
                          {v.detectedClubs.length > 0 && ` • ${v.detectedClubs.map((c) => c.club).join(', ')}`}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f2c4a' }}>
                        {v.totalSightings.toLocaleString()} 📸
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.panelContent}>
            <div style={{ fontSize: '13px', color: '#475569', padding: '16px 0' }}>
              n/a (no venue is linked to the matches or detected clubs of this report)
            </div>
          </div>
        )}
      </div>

      {/* 4. Floating Map Navigation Controls */}
      <div className={styles.floatingControls}>
        <button onClick={handleResetBounds} className={styles.resetBtn} title="Reset the map view">
          Reset view
        </button>
        <button onClick={handleZoomIn} className={styles.ctrlBtn} title="Zoom In">
          +
        </button>
        <button onClick={handleZoomOut} className={styles.ctrlBtn} title="Zoom Out">
          −
        </button>
      </div>

      {/* 5. Connected Selfies Modal for the selected club */}
      <ConnectedSelfiesModal club={modalClub} onClose={() => setModalClub(null)} />
    </div>
  );
}
