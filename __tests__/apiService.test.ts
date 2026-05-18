
/**
 * @jest-environment jsdom
 */
// FIX: Import Jest globals to fix TypeScript errors.
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { fetchRecommendations, performVitonHDTryOn } from '../services/apiService';

// Mock the global fetch function
const mockFetch = jest.fn();
window.fetch = mockFetch;

describe('apiService', () => {

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('fetchRecommendations', () => {
    it('should fetch, filter, and format recommendations correctly', async () => {
      const mockApiResponse = {
        "women's clothing": [{ id: 1, title: "Women's Jacket", image: "img1.jpg", category: "women's clothing" }],
        "men's clothing": [{ id: 2, title: "Men's T-Shirt", image: "img2.jpg", category: "men's clothing" }],
        "backpack": [{ id: 3, title: "A Cool Backpack", image: "img3.jpg", category: "accessories" }]
      };
      
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockApiResponse["women's clothing"]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockApiResponse["men's clothing"]) });

      const recommendations = await fetchRecommendations();
      
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0]).toEqual({
        id: 1,
        name: "Women's Jacket",
        category: 'Cold',
        imageUrl: 'img1.jpg',
        gender: 'Women'
      });
      expect(recommendations.some(item => item.name.includes('Backpack'))).toBe(false);
    });

    it('should return fallback data on API failure', async () => {
      mockFetch.mockRejectedValue(new Error('API is down'));
      const recommendations = await fetchRecommendations();
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].name).toBe('Classic White Tee');
    });
  });

  describe('performVitonHDTryOn', () => {
    it('should call the VITON-HD endpoint and return the result image', async () => {
      const mockResult = { data: ['data:image/png;base64,result'] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const personImage = 'data:image/png;base64,person';
      const garmentImage = 'data:image/png;base64,garment';
      const result = await performVitonHDTryOn(personImage, garmentImage);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: [personImage, garmentImage] }),
        })
      );
      expect(result).toBe(mockResult.data[0]);
    });

    it('should throw an error on API failure', async () => {
       mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });
      
      await expect(performVitonHDTryOn('person', 'garment')).rejects.toThrow('VITON-HD API request failed with status 500');
    });
    
    it('should throw an error if the API returns an error message', async () => {
        const mockErrorResult = { error: 'Processing failed' };
         mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockErrorResult),
        });
        
        await expect(performVitonHDTryOn('person', 'garment')).rejects.toThrow('VITON-HD API returned an error: Processing failed');
    });
  });
});
