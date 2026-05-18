/**
 * @jest-environment jsdom
 */
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { findMatchingOutfits, generateSocialMediaCaptions } from '../services/geminiService';
import { GoogleGenAI } from '@google/genai';
import { Outfit } from '../types';

// Mock the GoogleGenAI library
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

const sampleOutfits: Outfit[] = [
  { id: 1, name: 'Red Summer Dress', category: 'dresses', imageUrl: 'url1.jpg', gender: 'Women' },
  { id: 2, name: 'Blue Denim Jacket', category: 'jackets', imageUrl: 'url2.jpg', gender: 'Men' },
  { id: 3, name: 'Green Casual T-Shirt', category: 'tops', imageUrl: 'url3.jpg', gender: 'Men' },
];

describe('geminiService', () => {
  // FIX: Mock process.env.API_KEY to align with updated service.
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.API_KEY = 'test-api-key';
    mockGenerateContent.mockClear();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe('findMatchingOutfits', () => {
    it('should return outfits based on AI response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([{ id: 2, name: 'Blue Denim Jacket' }]),
      });

      const result = await findMatchingOutfits('a jacket for men', sampleOutfits);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should fall back to keyword search on AI error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('AI API Error'));

      const result = await findMatchingOutfits('blue jacket', sampleOutfits);
      // "blue" and "jacket" both match item with id 2
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
    
     it('should fall back to keyword search on malformed AI response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'this is not json' });
      const result = await findMatchingOutfits('dress', sampleOutfits);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });
  
  describe('generateSocialMediaCaptions', () => {
      it('should return parsed captions from AI response', async () => {
          const mockCaptions = {
              instagram: 'Insta caption!',
              twitter: 'Tweet caption!',
              facebook: 'Facebook caption!',
          };
          mockGenerateContent.mockResolvedValue({
              text: JSON.stringify(mockCaptions),
          });
          
          const result = await generateSocialMediaCaptions('Awesome Hat');
          expect(result).toEqual(mockCaptions);
      });
      
      it('should return fallback captions on AI error', async () => {
          mockGenerateContent.mockRejectedValue(new Error('AI API Error'));
          const garmentName = 'Cool Shirt';
          const result = await generateSocialMediaCaptions(garmentName);
          const expectedFallback = `Loving my new look with this ${garmentName} from StyleSense.AI! #StyleSenseAI #VirtualFashion`;
          expect(result).toEqual({
              instagram: expectedFallback,
              twitter: expectedFallback,
              facebook: expectedFallback,
          });
      });
  });
});