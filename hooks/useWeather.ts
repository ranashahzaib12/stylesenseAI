import { useState, useEffect } from 'react';
import type { WeatherData, LocationData } from '../types';
import { WEATHER_API_KEY } from '../config';

interface WeatherHookResult {
    weather: WeatherData | null;
    location: LocationData | null;
    loading: boolean;
    error: string | null;
    isFallback: boolean;
}

const parseWeatherResponse = (data: any): { weather: WeatherData; location: LocationData } => ({
    weather: {
        temp: Math.round(data.current.temp_c),
        description: data.current.condition.text,
        icon: `https:${data.current.condition.icon}`,
    },
    location: {
        name: data.location.name,
        country: data.location.country,
        region: data.location.region || '',
    },
});

const fetchFromWeatherAPI = async (query: string): Promise<any> => {
    const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${query}&aqi=no`;
    const response = await fetch(url);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `WeatherAPI error ${response.status}`);
    }
    return response.json();
};

const useWeather = (): WeatherHookResult => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!WEATHER_API_KEY) {
        setError("Weather API key is not configured.");
        setIsFallback(true);
        setLoading(false);
        return;
    }

    const applyData = (data: any, fallback = false) => {
        const parsed = parseWeatherResponse(data);
        setWeather(parsed.weather);
        setLocation(parsed.location);
        setIsFallback(fallback);
        setLoading(false);
    };

    // IP-based fallback — used when GPS is denied or unavailable
    const tryIPFallback = async (reason: string) => {
        try {
            const data = await fetchFromWeatherAPI('auto:ip');
            applyData(data, true);
            setError(`Using approximate location (${reason})`);
        } catch {
            setWeather({ temp: 18, description: 'Mild day', icon: 'https://cdn.weatherapi.com/weather/64x64/day/116.png' });
            setLocation({ name: 'Unknown', country: '', region: '' });
            setIsFallback(true);
            setError(reason);
            setLoading(false);
        }
    };

    if (!navigator.geolocation) {
        tryIPFallback('Geolocation is not supported by this browser.');
        return;
    }

    const onSuccess = async (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
            const data = await fetchFromWeatherAPI(`${latitude},${longitude}`);
            // If GPS accuracy is poor (>5 km), note it but still use the result
            const isFallbackAccuracy = accuracy > 5000;
            applyData(data, isFallbackAccuracy);
            if (isFallbackAccuracy) {
                setError('Location accuracy is low — weather may not be precise.');
            }
        } catch (e) {
            await tryIPFallback(e instanceof Error ? e.message : 'Weather fetch failed.');
        }
    };

    const onError = (geoError: GeolocationPositionError) => {
        const reasons: Record<number, string> = {
            1: 'Location permission denied.',
            2: 'Location unavailable.',
            3: 'Location request timed out.',
        };
        tryIPFallback(reasons[geoError.code] || geoError.message);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,   // use GPS when available
        timeout: 10000,             // 10-second timeout
        maximumAge: 300000,         // accept a cached position up to 5 min old
    });

  }, []);

  return { weather, location, loading, error, isFallback };
};

export default useWeather;