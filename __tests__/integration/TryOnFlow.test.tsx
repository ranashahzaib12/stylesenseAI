/**
 * @jest-environment jsdom
 */
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { AppProvider, useAppContext } from '../../contexts/AppContext';
import { AuthProvider } from '../../contexts/AuthContext';
import * as apiService from '../../services/apiService';
import * as storageService from '../../services/storageService';

// --- MOCKS ---

// Mock ApiService (The AI Model)
jest.mock('../../services/apiService', () => ({
  performVitonHDTryOn: jest.fn(),
  fetchRecommendations: jest.fn(),
}));
const mockPerformVitonHDTryOn = apiService.performVitonHDTryOn as jest.Mock;

// Mock StorageService (to check interactions)
jest.mock('../../services/storageService', () => ({
    uploadTryOnImage: jest.fn(),
    saveTryOnRecord: jest.fn(),
    fetchUserTryOnHistory: jest.fn(),
    saveUserProfile: jest.fn(),
    fetchUserProfile: jest.fn(),
}));
const mockUploadTryOnImage = storageService.uploadTryOnImage as jest.Mock;
const mockSaveTryOnRecord = storageService.saveTryOnRecord as jest.Mock;
const mockFetchUserTryOnHistory = storageService.fetchUserTryOnHistory as jest.Mock;
const mockFetchUserProfile = storageService.fetchUserProfile as jest.Mock;
const mockSaveUserProfile = storageService.saveUserProfile as jest.Mock;

// Mock AuthContext to simulate a logged-in user
jest.mock('../../contexts/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useAuth: () => ({
        user: { id: 'test-user-123', email: 'test@example.com' },
        loading: false,
    }),
}));

// Mock fetch for image conversion in AppContext
window.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    blob: () => Promise.resolve(new Blob(['fake-image'], { type: 'image/png' })),
  } as Response)
) as jest.Mock;

// --- TEST SETUP ---

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>
      <AppProvider setActiveTab={jest.fn()}>{children}</AppProvider>
    </AuthProvider>
);

describe('Integration: Try-On Job Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: History is empty
        mockFetchUserTryOnHistory.mockResolvedValue([]);
        // Default: Profile is null (or minimal valid mock if needed)
        mockFetchUserProfile.mockResolvedValue(null);
    });

    it('successfully processes a job and persists data to Supabase', async () => {
        // 1. Setup Mocks
        const fakeAIResult = 'data:image/png;base64,AI_GENERATED_RESULT';
        const fakePublicUrl = 'https://supabase.co/storage/v1/object/public/tryons/result.png';
        
        mockPerformVitonHDTryOn.mockResolvedValue(fakeAIResult);
        mockUploadTryOnImage.mockResolvedValue(fakePublicUrl);
        mockSaveTryOnRecord.mockResolvedValue(null); // Success returns void/null

        // 2. Render Hook
        const { result, waitForNextUpdate } = renderHook(() => useAppContext(), { wrapper });
        
        // 3. Start Job
        const personImage = 'data:image/png;base64,USER_SELFIE';
        const garment = { name: 'Cool Jacket', imageUrl: 'http://store.com/jacket.jpg' };
        
        await act(async () => {
            result.current.startTryOnJob(personImage, garment);
        });

        // 4. Verify Initial State (Processing)
        expect(result.current.tryOnJobs).toHaveLength(1);
        expect(result.current.tryOnJobs[0].status).toBe('processing');

        // 5. Wait for Async Operations
        await waitForNextUpdate(); // Waits for processTryOnJob to finish

        // 6. Verify Final State (Completed)
        expect(result.current.tryOnJobs[0].status).toBe('completed');
        // IMPORTANT: The UI should show the PUBLIC URL from Storage, not the raw base64
        expect(result.current.tryOnJobs[0].resultImage).toBe(fakePublicUrl);

        // 7. Verify Integration Points
        // Check if AI service was called
        expect(mockPerformVitonHDTryOn).toHaveBeenCalledWith(personImage, expect.anything());
        
        // Check if Storage Upload was called with User ID and AI Result
        expect(mockUploadTryOnImage).toHaveBeenCalledWith('test-user-123', fakeAIResult);
        
        // Check if DB Insert was called with correct metadata
        expect(mockSaveTryOnRecord).toHaveBeenCalledWith(
            'test-user-123', 
            fakePublicUrl, 
            garment.name, 
            garment.imageUrl
        );
    });

    it('handles storage failure gracefully (UI shows result, but logs error)', async () => {
        const fakeAIResult = 'data:image/png;base64,AI_GENERATED_RESULT';
        
        // Mock AI Success
        mockPerformVitonHDTryOn.mockResolvedValue(fakeAIResult);
        // Mock Storage Failure
        mockUploadTryOnImage.mockRejectedValue(new Error('Storage quota exceeded'));
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { result, waitForNextUpdate } = renderHook(() => useAppContext(), { wrapper });
        
        await act(async () => {
            result.current.startTryOnJob('data:img', { name: 'Item', imageUrl: 'url' });
        });

        await waitForNextUpdate();

        // The job should still be marked as completed in the UI so the user sees their result
        expect(result.current.tryOnJobs[0].status).toBe('completed');
        // It should fall back to the base64 result if upload failed
        expect(result.current.tryOnJobs[0].resultImage).toBe(fakeAIResult);
        
        // Check that error was logged
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save to cloud history'), expect.anything());
        
        consoleSpy.mockRestore();
    });
});