
/**
 * @jest-environment jsdom
 */
import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';
import useWeather from '../hooks/useWeather';

const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

const originalGeolocation = window.navigator.geolocation;

// Correctly mock the read-only `navigator.geolocation` property.
beforeAll(() => {
  Object.defineProperty(window.navigator, 'geolocation', {
    value: mockGeolocation,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window.navigator, 'geolocation', {
    value: originalGeolocation,
    configurable: true,
  });
});

// Mock the config file that provides the API key
jest.mock('../config', () => ({
    WEATHER_API_KEY: 'test-weather-key',
}));


beforeEach(() => {
    mockGeolocation.getCurrentPosition.mockClear();
    window.fetch = jest.fn();
});

describe('useWeather hook', () => {
  it('should return weather data on successful fetch', async () => {
    const mockWeather = {
      current: { temp_c: 25, condition: { text: 'Sunny', icon: 'sun.png' } },
      location: { name: 'Testville', country: 'Testland' },
    };
    
    (window.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWeather),
    });

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      Promise.resolve(success({ coords: { latitude: 10, longitude: 10 } } as GeolocationPosition))
    );

    const { result, waitForNextUpdate } = renderHook(() => useWeather());
    
    await act(async () => {
        await waitForNextUpdate();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.weather?.temp).toBe(25);
    expect(result.current.location?.name).toBe('Testville');
    expect(result.current.isFallback).toBe(false);
  });
  
  it('should return fallback data if geolocation fails', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error) =>
      Promise.resolve(error && error({ code: 1, message: 'User denied geolocation' } as GeolocationPositionError))
    );

    const { result, waitForNextUpdate } = renderHook(() => useWeather());

    await act(async () => {
        await waitForNextUpdate();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.isFallback).toBe(true);
    expect(result.current.error).toContain('User denied geolocation');
  });
  
  it('should return fallback data if fetch fails', async () => {
     (window.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
     
     mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      Promise.resolve(success({ coords: { latitude: 10, longitude: 10 } } as GeolocationPosition))
    );
     
     const { result, waitForNextUpdate } = renderHook(() => useWeather());
     
     await act(async () => {
        await waitForNextUpdate();
    });
     
     expect(result.current.isFallback).toBe(true);
     expect(result.current.error).toBe('Failed to fetch weather data');
  });
});
