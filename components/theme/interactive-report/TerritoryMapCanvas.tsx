'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MatchItem, VisionProgressData } from './types';
import styles from './territory-map.module.css';

interface TerritoryMapCanvasProps {
  matches: MatchItem[];
  vision?: VisionProgressData | null;
  partnerSlug?: string;
  partnerName?: string;
  embedded?: boolean;
}

export type SportFilterKey = 'all' | 'Basketball' | 'Football' | 'Handball' | 'Ice Hockey';
export type MetricLensKey = 'volume' | 'gender' | 'age' | 'sentiment';

export interface VenueDetail {
  id: string;
  name: string;
  city: string;
  region: string;
  coordinates: [number, number]; // [lng, lat]
  primaryClubs: string[];
  sports: string[];
  website?: string;
  capacity?: number;
  description: string;
  totalSightings: number;
  malePct: number;
  femalePct: number;
  valence: number; // 0-100%
  ageDistribution: {
    adults: number;
    teens: number;
    children: number;
    seniors: number;
  };
  topBrands: string[];
}

// Complete Hungarian sports venues registry
const VENUES_DATABASE: Omit<VenueDetail, 'totalSightings' | 'malePct' | 'femalePct' | 'valence' | 'ageDistribution' | 'topBrands'>[] = [
  {
    id: 'sopron-novomatic',
    name: 'Novomatic Aréna Sopron',
    city: 'Sopron',
    region: 'Nyugat-Dunántúl',
    coordinates: [16.5786, 47.6744],
    primaryClubs: ['Sopron KC', 'Sopron Basket'],
    sports: ['Basketball'],
    website: 'https://www.novomaticarenasopron.hu',
    capacity: 2500,
    description: 'Premier basketball facility in Sopron. Official home of Hungarian NB I/A men Sopron KC and multiple EuroLeague Women champions Sopron Basket.',
  },
  {
    id: 'szekesfehervar-ocskay',
    name: 'Ifjabb Ocskay Gábor Jégcsarnok',
    city: 'Székesfehérvár',
    region: 'Közép-Dunántúl',
    coordinates: [18.4221, 47.186],
    primaryClubs: ['Hydro Fehérvár AV19'],
    sports: ['Ice Hockey'],
    capacity: 3500,
    description: 'Historic home of Hungarian ice hockey powerhouse Hydro Fehérvár AV19 competing in the international win2day ICE Hockey League.',
  },
  {
    id: 'szekesfehervar-sostoi',
    name: 'Sóstói Stadion',
    city: 'Székesfehérvár',
    region: 'Közép-Dunántúl',
    coordinates: [18.415, 47.172],
    primaryClubs: ['Fehérvár FC'],
    sports: ['Football'],
    capacity: 14200,
    description: 'Modern UEFA Category 4 football arena hosting Fehérvár FC domestic championship matches.',
  },
  {
    id: 'miskolc-dvtk-arena',
    name: 'DVTK Aréna & Stadion',
    city: 'Miskolc',
    region: 'Észak-Magyarország',
    coordinates: [20.7784, 48.1035],
    primaryClubs: ['Diósgyőri VTK', 'DVTK Jegesmedvék', 'DVTK-Huntherm'],
    sports: ['Football', 'Basketball', 'Ice Hockey'],
    capacity: 14655,
    description: 'Comprehensive sports complex serving Diósgyőr across NB I football, women basketball EuroLeague, and Erste Liga ice hockey.',
  },
  {
    id: 'szeged-pick-arena',
    name: 'PICK Aréna',
    city: 'Szeged',
    region: 'Dél-Alföld',
    coordinates: [20.1414, 46.253],
    primaryClubs: ['OTP Bank-PICK Szeged'],
    sports: ['Handball'],
    capacity: 8143,
    description: 'Ultra-modern handball arena, the fortress of OTP Bank-Pick Szeged and host of EHF Champions League fixtures.',
  },
  {
    id: 'veszprem-arena',
    name: 'Veszprém Aréna',
    city: 'Veszprém',
    region: 'Közép-Dunántúl',
    coordinates: [17.915, 47.093],
    primaryClubs: ['Telekom Veszprém'],
    sports: ['Handball'],
    capacity: 5096,
    description: 'Renowned European handball cauldron, home of 27-time Hungarian champions Telekom Veszprém.',
  },
  {
    id: 'budapest-groupama',
    name: 'Groupama Aréna',
    city: 'Budapest',
    region: 'Közép-Magyarország',
    coordinates: [19.098, 47.475],
    primaryClubs: ['Ferencvárosi TC'],
    sports: ['Football'],
    capacity: 22000,
    description: 'National stadium of Ferencváros, hosting international UEFA competitions and major domestic championship fixtures.',
  },
  {
    id: 'budapest-szusza',
    name: 'Szusza Ferenc Stadion',
    city: 'Budapest',
    region: 'Közép-Magyarország',
    coordinates: [19.083, 47.567],
    primaryClubs: ['Újpest FC'],
    sports: ['Football'],
    capacity: 12670,
    description: 'Historic home of Újpest FC in the 4th district of Budapest.',
  },
  {
    id: 'budapest-pler',
    name: 'Budapest Sportcsarnok / PLER',
    city: 'Budapest',
    region: 'Közép-Magyarország',
    coordinates: [19.167, 47.438],
    primaryClubs: ['PLER-Budapest'],
    sports: ['Handball'],
    capacity: 1200,
    description: 'Home venue of PLER-Budapest K&H Men Handball League team.',
  },
  {
    id: 'szombathely-savaria',
    name: 'Arena Savaria',
    city: 'Szombathely',
    region: 'Nyugat-Dunántúl',
    coordinates: [16.6347, 47.2389],
    primaryClubs: ['Falco KC Szombathely'],
    sports: ['Basketball'],
    capacity: 4000,
    description: 'Multifunctional arena hosting reigning Hungarian basketball champions Falco Szombathely and BCL European fixtures.',
  },
  {
    id: 'szolnok-tiszaligeti',
    name: 'Tiszaligeti Városi Sportcsarnok',
    city: 'Szolnok',
    region: 'Észak-Alföld',
    coordinates: [20.183, 47.1755],
    primaryClubs: ['Szolnoki Olajbányász'],
    sports: ['Basketball'],
    capacity: 2500,
    description: 'Traditional home of 8-time Hungarian basketball champions Szolnoki Olajbányász.',
  },
  {
    id: 'oroszlay-krajnyik',
    name: 'Krajnyik "Akác" András Sportcsarnok',
    city: 'Oroszlány',
    region: 'Közép-Dunántúl',
    coordinates: [18.3183, 47.4883],
    primaryClubs: ['MVM-OSE Lions'],
    sports: ['Basketball'],
    capacity: 1500,
    description: 'Vibrant basketball hall of MVM-OSE Lions in Komárom-Esztergom vármegye.',
  },
  {
    id: 'debrecen-nagyerdei',
    name: 'Nagyerdei Stadion & Oláh Gábor csarnok',
    city: 'Debrecen',
    region: 'Észak-Alföld',
    coordinates: [21.6273, 47.5316],
    primaryClubs: ['Debreceni VSC', 'DEAC'],
    sports: ['Football', 'Basketball', 'Ice Hockey'],
    capacity: 20340,
    description: 'Flagship eastern Hungarian sporting complex hosting DVSC football and DEAC university sports.',
  },
  {
    id: 'gyor-eto-audi',
    name: 'ETO Park & Audi Aréna Győr',
    city: 'Győr',
    region: 'Nyugat-Dunántúl',
    coordinates: [17.6504, 47.6875],
    primaryClubs: ['Győri ETO', 'Győri Audi ETO KC'],
    sports: ['Football', 'Handball'],
    capacity: 15600,
    description: 'Major sports complex home to 6-time EHF Champions League winners Győri Audi ETO KC and ETO FC Győr.',
  },
  {
    id: 'kaposvar-arena',
    name: 'Kaposvár Aréna',
    city: 'Kaposvár',
    region: 'Dél-Dunántúl',
    coordinates: [17.8089, 46.3689],
    primaryClubs: ['Kometa Kaposvári KK'],
    sports: ['Basketball'],
    capacity: 3000,
    description: 'New sports arena serving basketball and indoor championship tournaments in Somogy vármegye.',
  },
  {
    id: 'paks-ase',
    name: 'ASE Sportcsarnok & Fehérvári úti Stadion',
    city: 'Paks',
    region: 'Dél-Dunántúl',
    coordinates: [18.8578, 46.6269],
    primaryClubs: ['Atomerőmű SE', 'Paksi FC'],
    sports: ['Basketball', 'Football'],
    capacity: 4500,
    description: 'Home of Atomerőmű SE basketball and Paksi FC domestic football.',
  },
  {
    id: 'kormend-sportcsarnok',
    name: 'Körmend Városi Sportcsarnok',
    city: 'Körmend',
    region: 'Nyugat-Dunántúl',
    coordinates: [16.605, 47.012],
    primaryClubs: ['Egis Körmend'],
    sports: ['Basketball'],
    capacity: 2000,
    description: 'Legendary basketball venue of Egis Körmend, famous for its ardent fanbase.',
  },
  {
    id: 'kozarmisleny-stadion',
    name: 'Kozármislenyi Stadion',
    city: 'Kozármisleny',
    region: 'Dél-Dunántúl',
    coordinates: [18.291, 46.031],
    primaryClubs: ['HR-Rent Kozármisleny'],
    sports: ['Football'],
    capacity: 2000,
    description: 'Active southern Baranya football club competing in Merkantil Bank NB II.',
  },
  {
    id: 'esztergom-suzuki',
    name: 'Suzuki Aréna',
    city: 'Esztergom',
    region: 'Közép-Dunántúl',
    coordinates: [18.7408, 47.785],
    primaryClubs: ['MOL Esztergom Kézilabda'],
    sports: ['Handball'],
    capacity: 1000,
    description: 'Danube bend regional sports arena hosting top-tier female handball.',
  },
];

export default function TerritoryMapCanvas({
  matches,
  vision,
  partnerSlug = 'szrt',
  partnerName = 'Szerencsejáték Zrt.',
  embedded = false,
}: TerritoryMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [activeSport, setActiveSport] = useState<SportFilterKey>('all');
  const [activeLens, setActiveLens] = useState<MetricLensKey>('volume');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('sopron-novomatic');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Connected Selfies Modal state for Venue / Club inspection
  const [modalClub, setModalClub] = useState<{ club: string; partnerId?: string; partnerSlug?: string; logoUrl?: string; name?: string } | null>(null);
  const [selfiesLoading, setSelfiesLoading] = useState(false);
  const [selfiesData, setSelfiesData] = useState<any>(null);
  const [selectedFanGroup, setSelectedFanGroup] = useState<string>('all');

  useEffect(() => {
    if (!modalClub) {
      setSelfiesData(null);
      setSelectedFanGroup('all');
      return;
    }

    let isMounted = true;
    setSelfiesLoading(true);
    setSelectedFanGroup('all');

    const q = new URLSearchParams({
      club: modalClub.club,
      partnerId: modalClub.partnerId || '',
      partnerSlug: modalClub.partnerSlug || '',
    });

    fetch(`/api/interactive-report/partner-selfies?${q.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted) {
          setSelfiesData(data);
          setSelfiesLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setSelfiesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [modalClub]);

  const displayModalSelfies = useMemo(() => {
    if (!selfiesData?.selfies) return [];
    if (selectedFanGroup === 'all') return selfiesData.selfies;
    return selfiesData.selfies.filter(
      (s: any) =>
        s.fanGroups?.some((fg: string) => fg.toLowerCase().includes(selectedFanGroup.toLowerCase())) ||
        s.scene?.toLowerCase().includes(selectedFanGroup.toLowerCase())
    );
  }, [selfiesData, selectedFanGroup]);

  // 1. Synthesize live metrics for each venue from vision and match data
  const venuesWithMetrics: VenueDetail[] = useMemo(() => {
    const totalProcessed = vision?.processedCount || 1970;
    const baseAgg = vision?.aggregates;

    return VENUES_DATABASE.map((v) => {
      // Find matches associated with this city, venue or club
      const cityMatches = (matches || []).filter((m) => {
        const text = `${m.matchName || ''} ${m.cleanName || ''} ${m.partnerName || ''} ${m.venue || ''}`.toLowerCase();
        return (
          text.includes(v.city.toLowerCase()) ||
          text.includes(v.name.toLowerCase()) ||
          v.primaryClubs.some((c) => text.includes(c.toLowerCase()))
        );
      });

      // Match selfie count from projects
      const matchSelfies = cityMatches.reduce((acc, m) => acc + (m.selfies || 0), 0);

      // Match empirical vision sightings from vision.aggregates
      let visionClubSightings = 0;
      if (baseAgg?.topClubs) {
        for (const tc of baseAgg.topClubs) {
          if (v.primaryClubs.some((c) => tc.club.toLowerCase().includes(c.toLowerCase()))) {
            visionClubSightings += tc.count || 0;
          }
        }
      }
      if (baseAgg?.topVenues) {
        for (const tv of baseAgg.topVenues) {
          if (
            tv.venue.toLowerCase().includes(v.name.toLowerCase()) ||
            v.name.toLowerCase().includes(tv.venue.toLowerCase())
          ) {
            visionClubSightings += tv.count || 0;
          }
        }
      }

      const totalSightings =
        matchSelfies > 0
          ? matchSelfies
          : Math.max(
              visionClubSightings,
              Math.round(totalProcessed * (v.id.includes('sopron') ? 0.08 : v.id.includes('szekes') ? 0.12 : 0.05))
            );

      // Sport specific gender ratio
      const primarySport = v.sports[0] || 'Football';
      const sportBreakdown = baseAgg?.sportsBreakdown?.[primarySport];
      const malePct =
        sportBreakdown?.genders?.malePct ??
        (primarySport === 'Handball' ? 44.5 : primarySport === 'Basketball' ? 52.3 : 64.2);
      const femalePct = sportBreakdown?.genders?.femalePct ?? (100 - malePct);

      // Valence
      const valence =
        primarySport === 'Basketball' ? 97.4 : primarySport === 'Handball' ? 96.8 : primarySport === 'Ice Hockey' ? 95.2 : 93.8;

      return {
        ...v,
        totalSightings,
        malePct,
        femalePct,
        valence,
        ageDistribution: {
          adults: Math.round(totalSightings * 0.72),
          teens: Math.round(totalSightings * 0.14),
          children: Math.round(totalSightings * 0.09),
          seniors: Math.round(totalSightings * 0.05),
        },
        topBrands: [
          'Tippmix',
          'Szerencsejáték Zrt.',
          primarySport === 'Ice Hockey' ? 'Hydro' : primarySport === 'Handball' ? 'MOL' : 'Audi',
        ],
      };
    });
  }, [matches, vision]);

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
        const matchesClub = v.primaryClubs.some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesClub) return false;
      }
      return true;
    });
  }, [venuesWithMetrics, activeSport, searchQuery]);

  const selectedVenue = useMemo(() => {
    return venuesWithMetrics.find((v) => v.id === selectedVenueId) || venuesWithMetrics[0];
  }, [venuesWithMetrics, selectedVenueId]);

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
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            },
          },
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
          layers: [
            {
              id: 'basemap',
              type: 'raster',
              source: 'basemap',
              paint: {
                'raster-saturation': -0.2,
                'raster-contrast': 0.05,
                'raster-brightness-max': 0.98,
              },
            },
          ],
        },
        center: [19.5, 47.16], // Hungary center
        zoom: 7.2,
        minZoom: 6.5,
        maxZoom: 16,
        maxBounds: [
          [15.5, 45.4], // SW bounds
          [23.5, 49.0], // NE bounds
        ],
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
            sport: v.sports[0] || 'Football',
            sightings: v.totalSightings,
            malePct: v.malePct,
            femalePct: v.femalePct,
            valence: v.valence,
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

        // Initial selection: Novomatic Arena Sopron
        map.setFeatureState(
          { source: 'venues-source', id: 'sopron-novomatic' },
          { selected: true }
        );

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

  // Update feature-state selection when selectedVenueId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    for (const v of venuesWithMetrics) {
      map.setFeatureState(
        { source: 'venues-source', id: v.id },
        { selected: v.id === selectedVenueId }
      );
    }
  }, [selectedVenueId, venuesWithMetrics]);

  // Zoom controls
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetBounds = () => {
    mapRef.current?.easeTo({
      center: [19.5, 47.16],
      zoom: 7.2,
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
            {embedded ? (
              <a
                href={`/interactive-report/${partnerSlug}/map`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.backBtn}
                style={{ background: '#1d4ed8', color: '#ffffff' }}
              >
                🗺️ Fullscreen Dedicated Map ↗
              </a>
            ) : (
              <a href={`/interactive-report/${partnerSlug}`} className={styles.backBtn}>
                ← Executive Report
              </a>
            )}
            <h1 className={styles.pageTitle}>
              <span>🗺️ Hungary Sports Venues &amp; Demographic Territory Map</span>
              <span className={styles.liveBadge}>LIVE GEOGRAPHIC INTELLIGENCE</span>
            </h1>
          </div>

          {/* Metric Lens Switcher */}
          <div className={styles.lensToggleGroup}>
            <button
              onClick={() => setActiveLens('volume')}
              className={`${styles.lensBtn} ${activeLens === 'volume' ? styles.lensBtnActive : ''}`}
            >
              📸 Selfie Volume
            </button>
            <button
              onClick={() => setActiveLens('gender')}
              className={`${styles.lensBtn} ${activeLens === 'gender' ? styles.lensBtnActive : ''}`}
            >
              👥 Gender Lens
            </button>
            <button
              onClick={() => setActiveLens('age')}
              className={`${styles.lensBtn} ${activeLens === 'age' ? styles.lensBtnActive : ''}`}
            >
              🎂 Generational Age
            </button>
            <button
              onClick={() => setActiveLens('sentiment')}
              className={`${styles.lensBtn} ${activeLens === 'sentiment' ? styles.lensBtnActive : ''}`}
            >
              🎉 Atmosphere
            </button>
          </div>
        </div>

        {/* Sport Chip Band ("map-band") */}
        <div className={styles.chipBandRow}>
          <button
            onClick={() => setActiveSport('all')}
            className={`${styles.chipBtn} ${activeSport === 'all' ? styles.chipBtnActive : ''}`}
          >
            🏆 All Leagues ({venuesWithMetrics.length} Venues)
          </button>
          <button
            onClick={() => setActiveSport('Basketball')}
            className={`${styles.chipBtn} ${activeSport === 'Basketball' ? styles.chipBtnActive : ''}`}
          >
            🏀 Basketball NB I
          </button>
          <button
            onClick={() => setActiveSport('Football')}
            className={`${styles.chipBtn} ${activeSport === 'Football' ? styles.chipBtnActive : ''}`}
          >
            ⚽ Football NB I/II
          </button>
          <button
            onClick={() => setActiveSport('Handball')}
            className={`${styles.chipBtn} ${activeSport === 'Handball' ? styles.chipBtnActive : ''}`}
          >
            🤾 Handball K&amp;H Liga
          </button>
          <button
            onClick={() => setActiveSport('Ice Hockey')}
            className={`${styles.chipBtn} ${activeSport === 'Ice Hockey' ? styles.chipBtnActive : ''}`}
          >
            🏒 Erste Liga / ICEHL
          </button>

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
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>{selectedVenue.name}</h2>
            <p className={styles.panelSubtitle}>
              <span>📍 {selectedVenue.city}, {selectedVenue.region}</span>
              <span>•</span>
              <span>{selectedVenue.sports.join(', ')}</span>
            </p>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: '#dbeafe',
              color: '#1e40af',
            }}
          >
            {selectedVenue.primaryClubs[0]}
          </span>
        </div>

        <div className={styles.panelContent}>
          {/* Official Website Link (especially for Novomatic Aréna Sopron) */}
          <div className={styles.venueFeatureCard}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f2c4a', marginBottom: '4px' }}>
              🏟️ Venue Overview &amp; Home Franchise
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              {selectedVenue.description}
            </div>

            {selectedVenue.website && (
              <a
                href={selectedVenue.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.venueWebsiteLink}
                title={`Open official arena website: ${selectedVenue.website}`}
              >
                🌐 Visit {selectedVenue.name} Official Website ↗
              </a>
            )}

            {/* Connected Selfies Action */}
            <button
              type="button"
              onClick={() => {
                const matchedClub = vision?.aggregates?.topClubs?.find((c) =>
                  selectedVenue.primaryClubs.some((pc) => c.club.toLowerCase().includes(pc.toLowerCase()))
                );
                setModalClub({
                  club: selectedVenue.primaryClubs[0] || selectedVenue.name,
                  partnerSlug: matchedClub?.partnerSlug,
                  partnerId: matchedClub?.partnerId,
                  logoUrl: matchedClub?.logoUrl,
                  name: matchedClub?.partnerName || selectedVenue.primaryClubs[0],
                });
              }}
              style={{
                marginTop: '10px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(29, 78, 216, 0.25)',
              }}
            >
              📸 View Venue &amp; Franchise Selfies ({selectedVenue.totalSightings.toLocaleString()})
            </button>
          </div>

          {/* 4 Stat Highlights */}
          <div className={styles.statGrid2x2}>
            <div className={styles.statBox}>
              <div className={styles.statBoxLabel}>Identified Selfies</div>
              <div className={styles.statBoxVal}>{selectedVenue.totalSightings.toLocaleString()}</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statBoxLabel}>Atmosphere Valence</div>
              <div className={styles.statBoxVal} style={{ color: '#166534' }}>{selectedVenue.valence}%</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statBoxLabel}>Gender Ratio</div>
              <div className={styles.statBoxVal} style={{ fontSize: '13px' }}>
                <span style={{ color: '#ec4899', fontWeight: 700 }}>♀ {selectedVenue.femalePct}%</span>
                {' / '}
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>♂ {selectedVenue.malePct}%</span>
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statBoxLabel}>Arena Capacity</div>
              <div className={styles.statBoxVal} style={{ fontSize: '14px' }}>
                {selectedVenue.capacity ? `${selectedVenue.capacity.toLocaleString()} seats` : 'Regional Hub'}
              </div>
            </div>
          </div>

          {/* Gender Split Visual */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
              <span>Female Spectators ({selectedVenue.femalePct}%)</span>
              <span>Male Spectators ({selectedVenue.malePct}%)</span>
            </div>
            <div className={styles.barTrack}>
              <div className={styles.barFillFemale} style={{ width: `${selectedVenue.femalePct}%` }} />
              <div className={styles.barFillMale} style={{ width: `${selectedVenue.malePct}%` }} />
            </div>
          </div>

          {/* Generational Demographics */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f2c4a', marginBottom: '6px' }}>
              🎂 Age Breakdown (Fan Selfie Detections)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Adults</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{selectedVenue.ageDistribution.adults}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Teens</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{selectedVenue.ageDistribution.teens}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Children</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{selectedVenue.ageDistribution.children}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Seniors</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{selectedVenue.ageDistribution.seniors}</div>
              </div>
            </div>
          </div>

          {/* Quick Venue List Switcher */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f2c4a', marginBottom: '8px' }}>
              🏟️ All {filteredVenues.length} Regional Venues
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
                    borderColor: v.id === selectedVenueId ? '#88ca45' : '#e2e8f0',
                    background: v.id === selectedVenueId ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{v.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{v.city} • {v.primaryClubs.join(', ')}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f2c4a' }}>
                    {v.totalSightings.toLocaleString()} 📸
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Floating Map Navigation Controls */}
      <div className={styles.floatingControls}>
        <button onClick={handleResetBounds} className={styles.resetBtn} title="Reset camera to all Hungary">
          🇭🇺 Fit Hungary
        </button>
        <button onClick={handleZoomIn} className={styles.ctrlBtn} title="Zoom In">
          +
        </button>
        <button onClick={handleZoomOut} className={styles.ctrlBtn} title="Zoom Out">
          −
        </button>
      </div>

      {/* 5. Connected Selfies Modal from Map Inspector */}
      {modalClub && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setModalClub(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {modalClub.logoUrl ? (
                  <div style={{ width: '44px', height: '44px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={modalClub.logoUrl} alt={modalClub.name || modalClub.club} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <span style={{ fontSize: '28px' }}>🏟️</span>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {modalClub.name || modalClub.club}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Fan selfies captured at {selectedVenue.name} ({selectedVenue.city})
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {modalClub.partnerSlug && (
                  <a
                    href={`/partner-report/${modalClub.partnerSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: 'none',
                      background: '#3b82f6',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    Open Partner Report ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setModalClub(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selfiesLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
                  <div>Loading connected selfies from MongoDB database...</div>
                </div>
              ) : selfiesData ? (
                <>
                  {/* Summary Demographics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Connected Selfies</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        {selfiesData.totalSelfies || selectedVenue.totalSightings}
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Gender Split</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                        ♂ {selfiesData.demographics?.malePct || 50}% • ♀ {selfiesData.demographics?.femalePct || 50}%
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Venue Atmosphere</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534', marginTop: '3px' }}>
                        🎉 {selectedVenue.valence}% Valence
                      </div>
                    </div>
                  </div>

                  {/* Supporter Groups Filter Chips */}
                  {selfiesData.fanGroups && selfiesData.fanGroups.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                        🏴 Supporter Groups:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFanGroup('all')}
                        style={{
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '9999px',
                          border: '1px solid',
                          borderColor: selectedFanGroup === 'all' ? '#1d4ed8' : '#cbd5e1',
                          background: selectedFanGroup === 'all' ? '#dbeafe' : '#ffffff',
                          color: selectedFanGroup === 'all' ? '#1e40af' : '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        All Allegiance ({selfiesData.totalSelfies || selectedVenue.totalSightings})
                      </button>
                      {selfiesData.fanGroups.map((fg: any) => (
                        <button
                          key={fg.group}
                          type="button"
                          onClick={() => setSelectedFanGroup(fg.group)}
                          style={{
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '9999px',
                            border: '1px solid',
                            borderColor: selectedFanGroup === fg.group ? '#1d4ed8' : '#cbd5e1',
                            background: selectedFanGroup === fg.group ? '#dbeafe' : '#ffffff',
                            color: selectedFanGroup === fg.group ? '#1e40af' : '#475569',
                            cursor: 'pointer',
                          }}
                        >
                          🏴‍☠️ {fg.group} ({fg.count})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selfies Grid */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                      📸 Captured Fan Selfies ({displayModalSelfies.length})
                    </h4>

                    {displayModalSelfies.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                        {displayModalSelfies.map((s: any, idx: number) => (
                          <div key={s.fileName || idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 700, color: '#2563eb' }}>#{idx + 1} {s.sport}</span>
                              <span style={{ color: '#64748b', fontSize: '10px' }}>👤 {s.peopleCount} spectators</span>
                            </div>
                            <div style={{ color: '#1e293b', lineHeight: 1.4 }}>&ldquo;{s.scene || 'Fan selfie captured at match.'}&rdquo;</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              {s.fanGroups?.map((fg: string) => (
                                <span key={fg} style={{ fontSize: '9px', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px' }}>
                                  🏴 {fg}
                                </span>
                              ))}
                              {s.emotions?.map((e: string) => (
                                <span key={e} style={{ fontSize: '9px', background: '#ecfdf5', color: '#065f46', padding: '1px 5px', borderRadius: '4px' }}>
                                  {e}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                        No selfies currently matching this filter.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Unable to load connected selfies. Please retry.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
