
/**
 * @jest-environment jsdom
 */
// FIX: Import Jest globals to fix TypeScript errors.
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import React from 'react';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { AppProvider, useAppContext } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { Garment } from '../types';

// Mock the apiService
jest.mock('../services/apiService', () => ({
  performVitonHDTryOn: jest.fn(),
  fetchRecommendations: jest.fn(),
}));

jest.mock('../hooks/useWeather', () => () => ({
  weather: null,
  location: null,
  loading: false,
  error: null,
  isFallback: false,
}));

// Mock storageService to avoid real Supabase calls
jest.mock('../services/storageService', () => ({
  fetchUserTryOnHistory: jest.fn().mockResolvedValue([]),
  fetchUserProfile: jest.fn().mockResolvedValue(null),
  saveUserProfile: jest.fn(),
  uploadTryOnImage: jest.fn(),
  saveTryOnRecord: jest.fn(),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

const mockPerformVitonHDTryOn = apiService.performVitonHDTryOn as jest.Mock;

// FIX: Correctly type the wrapper component to include `children`, which is no longer implicit in React.FC.
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider setActiveTab={jest.fn()}>{children}</AppProvider>
);

describe('AppContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start a try-on job and update its status to completed on success', async () => {
    mockPerformVitonHDTryOn.mockResolvedValue('data:image/png;base64,fakeresult');
    
    // Mock fetch used by imageUrlToDataUrl
    window.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            statusText: 'OK',
            blob: () => Promise.resolve(new Blob(['fake image data'], { type: 'image/png' })),
        } as Response)
    );

    const { result, waitForNextUpdate } = renderHook(() => useAppContext(), { wrapper });

    const personImage = 'data:image/png;base64,fakeperson';
    const garment: Garment = { name: 'Test Garment', imageUrl: 'http://example.com/garment.png' };

    await act(async () => {
      result.current.startTryOnJob(personImage, garment);
    });

    // Initial state: one job processing
    expect(result.current.tryOnJobs).toHaveLength(1);
    expect(result.current.tryOnJobs[0].status).toBe('processing');

    await act(async () => {
      await waitForNextUpdate({ timeout: 2000 }); // Wait for state update after async call
    });
    
    // Final state: one job completed
    expect(result.current.tryOnJobs[0].status).toBe('completed');
    expect(result.current.tryOnJobs[0].resultImage).toBe('data:image/png;base64,fakeresult');
  });
  
  it('should start a try-on job and update its status to failed on error', async () => {
    const errorMessage = 'API Error';
    mockPerformVitonHDTryOn.mockRejectedValue(new Error(errorMessage));

    window.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['fake image data'], { type: 'image/png' })),
        } as Response)
    );

    const { result, waitForNextUpdate } = renderHook(() => useAppContext(), { wrapper });
    
    const personImage = 'data:image/png;base64,fakeperson';
    const garment: Garment = { name: 'Test Garment', imageUrl: 'http://example.com/garment.png' };

    await act(async () => {
      result.current.startTryOnJob(personImage, garment);
    });

    expect(result.current.tryOnJobs[0].status).toBe('processing');
    
    await act(async () => {
      await waitForNextUpdate({ timeout: 2000 });
    });

    expect(result.current.tryOnJobs[0].status).toBe('failed');
    expect(result.current.tryOnJobs[0].error).toBe(errorMessage);
  });

  it('should clear completed jobs', async () => {
      mockPerformVitonHDTryOn.mockResolvedValue('data:image/png;base64,fakeresult');
      window.fetch = jest.fn(() => Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob()) } as Response));
      
      const { result, waitForNextUpdate } = renderHook(() => useAppContext(), { wrapper });
      
      // Start two jobs
      await act(async () => {
          result.current.startTryOnJob('person1', { name: 'garment1', imageUrl: 'url1' });
          result.current.startTryOnJob('person2', { name: 'garment2', imageUrl: 'url2' });
      });

      // Wait for them to complete
      await act(async () => { await waitForNextUpdate({ timeout: 2000 }); });
      await act(async () => { await waitForNextUpdate({ timeout: 2000 }); });
      
      expect(result.current.tryOnJobs.every(j => j.status === 'completed')).toBe(true);
      
      // Clear completed
      act(() => {
          result.current.clearCompletedJobs();
      });
      
      // The state should be empty because we only have completed jobs
      expect(result.current.tryOnJobs).toHaveLength(0);
  });
});