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

    let gpsUpgraded = false; // prevent overwriting GPS result with IP result

    const applyData = (data: any, fallback = false) => {
        const parsed = parseWeatherResponse(data);
        setWeather(parsed.weather);
        setLocation(parsed.location);
        setIsFallback(fallback);
        setError(null);
        setLoading(false);
    };

    // Step 1: Load IP-based weather immediately — no delay, no permission needed.
    // This gives users instant weather so the dashboard never feels broken.
    fetchFromWeatherAPI('auto:ip')
        .then(data => {
            if (!gpsUpgraded) applyData(data, false); // not a fallback — IP weather is valid
        })
        .catch(() => {
            if (!gpsUpgraded) {
                setWeather({ temp: 18, description: 'Mild day', icon: 'https://cdn.weatherapi.com/weather/64x64/day/116.png' });
                setLocation({ name: 'Unknown', country: '', region: '' });
                setIsFallback(true);
                setError('Weather service unavailable.');
                setLoading(false);
            }
        });

    // Step 2: Silently try GPS in parallel. If granted, upgrade to precise weather.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const data = await fetchFromWeatherAPI(`${latitude},${longitude}`);
                    gpsUpgraded = true;
                    applyData(data, false);
                } catch {
                    // GPS succeeded but weather fetch failed — IP result already shown, keep it
                }
            },
            () => {
                // GPS denied/unavailable — IP result is already showing, nothing to do
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
    }

  }, []);

  return { weather, location, loading, error, isFallback };
};

export default useWeather;
