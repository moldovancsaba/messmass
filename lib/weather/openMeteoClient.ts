// lib/weather/openMeteoClient.ts
// WHAT: Automated historical and live weather retrieval via Open-Meteo Archive & Forecast APIs.
// WHY: In sports and venue analytics, weather (ambient temperature, precipitation, wind)
//      correlates strongly with gate attendance, fan valence, and merchandise wear (caps vs scarves).

export interface WeatherObservation {
  tempC: number;
  condition: string;
  weatherCode: number;
  precipitationMm: number;
  windKmh: number;
  isIndoor: boolean;
  source: 'open-meteo' | 'fallback';
  recordedAt: string;
}

const WMO_CODE_MAP: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Dense Freezing Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Slight Snowfall',
  73: 'Moderate Snowfall',
  75: 'Heavy Snowfall',
  77: 'Snow Grains',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Slight Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Slight Hail',
  99: 'Thunderstorm with Heavy Hail',
};

export function interpretWeatherCode(code: number): string {
  return WMO_CODE_MAP[code] ?? (code > 0 && code < 50 ? 'Cloudy' : code >= 50 && code < 70 ? 'Rainy' : 'Clear');
}

export function getWeatherIcon(code: number, isIndoor = false): string {
  if (isIndoor) return '🏟️';
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

// In-memory cache keyed by "lat,lon,date,hour"
const memoryCache = new Map<string, WeatherObservation>();

export async function fetchHistoricalWeather(params: {
  lat: number;
  lon: number;
  date: string; // YYYY-MM-DD
  kickoffTime?: string; // HH:MM or HH
  isIndoor?: boolean;
}): Promise<WeatherObservation> {
  const { lat, lon, date, kickoffTime = '17:00', isIndoor = false } = params;

  // Normalize target hour (0-23)
  const hourMatch = kickoffTime.match(/^(\d{1,2})/);
  const targetHour = hourMatch ? Math.min(23, Math.max(0, parseInt(hourMatch[1], 10))) : 17;

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)},${date},${targetHour},${isIndoor ? 1 : 0}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  try {
    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lon.toString());
    url.searchParams.set('start_date', date);
    url.searchParams.set('end_date', date);
    url.searchParams.set('hourly', 'temperature_2m,precipitation,weather_code,wind_speed_10m');
    url.searchParams.set('timezone', 'auto');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    const hourly = data.hourly;
    if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
      throw new Error('Malformed hourly response from Open-Meteo');
    }

    // Find the observation matching our target hour
    const index = Math.min(targetHour, hourly.time.length - 1);
    const tempC = Number(hourly.temperature_2m?.[index] ?? 18);
    const precipitationMm = Number(hourly.precipitation?.[index] ?? 0);
    const weatherCode = Number(hourly.weather_code?.[index] ?? 1);
    const windKmh = Number(hourly.wind_speed_10m?.[index] ?? 10);
    const recordedAt = hourly.time[index] || `${date}T${String(targetHour).padStart(2, '0')}:00`;

    const observation: WeatherObservation = {
      tempC: Math.round(tempC * 10) / 10,
      condition: interpretWeatherCode(weatherCode),
      weatherCode,
      precipitationMm: Math.round(precipitationMm * 10) / 10,
      windKmh: Math.round(windKmh * 10) / 10,
      isIndoor,
      source: 'open-meteo',
      recordedAt,
    };

    memoryCache.set(cacheKey, observation);
    return observation;
  } catch {
    // Graceful fallback if offline or API unavailable
    const fallback: WeatherObservation = {
      tempC: 18.0,
      condition: isIndoor ? 'Indoor Arena' : 'Fair',
      weatherCode: 1,
      precipitationMm: 0.0,
      windKmh: 10.0,
      isIndoor,
      source: 'fallback',
      recordedAt: `${date}T${String(targetHour).padStart(2, '0')}:00`,
    };
    return fallback;
  }
}
