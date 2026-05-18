import React, { useState } from 'react';
import { findMatchingOutfits } from '../services/geminiService';
import Spinner from './Spinner';
import { useAppContext } from '../contexts/AppContext';
import type { Outfit } from '../types';

const OutfitCard: React.FC<{ outfit: Outfit }> = ({ outfit }) => {
  const { selectForTryOn } = useAppContext();
  return (
    <div className="relative bg-surface rounded-lg shadow-md overflow-hidden group border border-textSecondary/5">
      <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-80 object-cover" />

      {/* Desktop: hover overlay */}
      <div className="absolute inset-0 bg-black/40 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex">
        <button
          onClick={() => selectForTryOn(outfit)}
          className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transform hover:scale-105 transition-all"
        >
          Try Me
        </button>
      </div>

      {/* Mobile: always-visible button at bottom */}
      <div className="absolute bottom-0 left-0 right-0 sm:hidden bg-gradient-to-t from-black/60 to-transparent p-3 flex justify-center">
        <button
          onClick={() => selectForTryOn(outfit)}
          className="bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          Try Me
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-textPrimary truncate">{outfit.name}</h3>
      </div>
    </div>
  );
};

const OutfitGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [foundOutfits, setFoundOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const { setGeneratedOutfits, filteredProducts, productsLoading } = useAppContext();

  const handleGenerate = async () => {
    setError(null);
    if (!prompt.trim()) {
      setError("Please enter a description for the outfit you're looking for.");
      return;
    }
    if (filteredProducts.length === 0) {
      if (productsLoading) {
         setError("The product catalog is still loading. Please try again in a moment.");
      } else {
         setError("No products available for your profile.");
      }
      return;
    }
    setLoading(true);
    setFoundOutfits([]);
    setGeneratedOutfits([]);
    setSearched(false);

    try {
      const result = await findMatchingOutfits(prompt, filteredProducts);
      setFoundOutfits(result);
      setGeneratedOutfits(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };
  
  const examplePrompts = [
    "A casual everyday t-shirt",
    "A warm winter jacket",
    "Something edgy and stylish",
    "A professional work shirt"
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-textPrimary">Outfit Finder</h2>
        <p className="mt-2 text-md text-textSecondary">Describe your ideal outfit, and let our AI find the best matches from our collection.</p>
      </div>
      
      <div className="bg-surface p-8 rounded-xl shadow-lg border border-textSecondary/5">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <label htmlFor="outfit-prompt" className="block text-sm font-medium text-textPrimary">What are you looking for?</label>
            <textarea
              id="outfit-prompt"
              rows={3}
              className="mt-1 block w-full shadow-sm sm:text-sm border border-textSecondary/20 rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-textSecondary/50 px-3 py-2.5 resize-none transition-colors"
              placeholder="e.g., A stylish and comfortable outfit for a city walk in spring..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mt-2">
                  <p className="text-xs text-textSecondary">Try an example:</p>
                  {examplePrompts.map(p => (
                      <button key={p} onClick={() => setPrompt(p)} className="px-3 py-1 text-xs bg-background rounded-full hover:bg-textSecondary/10 text-textSecondary transition-colors border border-textSecondary/10">
                          {p}
                      </button>
                  ))}
              </div>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3 text-center mb-4">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGenerate}
            disabled={loading || productsLoading}
            className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {loading ? <Spinner /> : 'Find My Outfit'}
          </button>
        </div>

        <div className="mt-8 border-t border-textSecondary/10 pt-8">
          {loading && (
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary mx-auto"></div>
                <p className="mt-4 text-textSecondary">Searching our collection...</p>
            </div>
          )}
          {foundOutfits.length > 0 && (
            <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-textPrimary">Our Top Recommendations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {foundOutfits.map(outfit => <OutfitCard key={outfit.id} outfit={outfit} />)}
                </div>
            </div>
          )}
          {!loading && searched && foundOutfits.length === 0 && !error && (
            <div className="text-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-textSecondary/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-textSecondary font-medium">No matches found.</p>
              <p className="text-textSecondary/70 text-sm mt-1">Try a different description or style keyword.</p>
            </div>
          )}
          {!loading && !searched && (
            <div className="text-center text-textSecondary py-10">
                <p>Your recommended outfits will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitGenerator;