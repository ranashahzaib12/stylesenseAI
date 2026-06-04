import React, { useState } from 'react';
import { findMatchingOutfits } from '../services/geminiService';
import Spinner from './Spinner';
import { useAppContext } from '../contexts/AppContext';
import type { Outfit } from '../types';

const STYLE_COLORS: Record<string, string> = {
  formal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'smart casual': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  casual: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  streetwear: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'resort casual': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  athleisure: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

const OutfitCard: React.FC<{ outfit: Outfit; rank: number }> = ({ outfit, rank }) => {
  const { selectForTryOn } = useAppContext();
  const styleClass = STYLE_COLORS[outfit.style?.toLowerCase() || ''] || 'bg-textSecondary/10 text-textPrimary';
  const occasions = outfit.occasion?.split(/[,;]+/).map(s => s.trim()).filter(Boolean).slice(0, 3) || [];

  return (
    <div className="bg-surface rounded-xl shadow-md overflow-hidden border border-textSecondary/5 group transition-transform hover:scale-[1.02] hover:shadow-lg">
      <div className="relative overflow-hidden h-72">
        <img
          src={outfit.imageUrl}
          alt={outfit.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x400?text=Image+Unavailable';
          }}
        />
        <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          #{rank} Match
        </div>
        {outfit.style && (
          <div className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styleClass}`}>
            {outfit.style}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex">
          <button
            onClick={() => selectForTryOn(outfit)}
            className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transform hover:scale-105 transition-all"
          >
            Try Me
          </button>
        </div>
      </div>

      {/* Mobile Try Me */}
      <div className="absolute bottom-[100px] left-0 right-0 sm:hidden bg-gradient-to-t from-black/60 to-transparent p-3 flex justify-center">
        <button
          onClick={() => selectForTryOn(outfit)}
          className="bg-primary text-white font-bold py-2 px-5 rounded-lg text-sm"
        >
          Try Me
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-base text-textPrimary mb-1">{outfit.name}</h3>
        {/* Meta row */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {outfit.color && <span className="text-xs text-textSecondary bg-background px-2 py-0.5 rounded-full capitalize">{outfit.color}</span>}
          {outfit.fabric && <span className="text-xs text-textSecondary bg-background px-2 py-0.5 rounded-full capitalize">{outfit.fabric}</span>}
          {outfit.fit && <span className="text-xs text-textSecondary bg-background px-2 py-0.5 rounded-full capitalize">{outfit.fit} fit</span>}
        </div>
        {/* Occasions */}
        {occasions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {occasions.map((occ, i) => (
              <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{occ}</span>
            ))}
          </div>
        )}
        {outfit.description && (
          <p className="text-xs text-textSecondary leading-relaxed line-clamp-2">{outfit.description}</p>
        )}
        <button
          onClick={() => selectForTryOn(outfit)}
          className="mt-3 w-full bg-primary/10 text-primary font-semibold py-2 rounded-lg hover:bg-primary/20 transition-colors text-sm sm:hidden"
        >
          Try Me
        </button>
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
      setError("Please describe the outfit you're looking for.");
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
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
  };

  const examplePrompts = [
    'Cozy warm shirt for cold winter weather',
    'Formal blue shirt for office meeting',
    'Bright colorful beach vacation shirt',
    'Streetwear graphic shirt for night out',
    'Athletic performance gym workout shirt',
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-textPrimary">Outfit Finder</h2>
        <p className="mt-2 text-textSecondary">Describe your ideal shirt — the ML model finds the top 3 matches using semantic search.</p>
        <div className="inline-flex items-center gap-2 mt-3 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-xs text-primary font-semibold">outfit_finder_model.pkl · TF-IDF → SVD → KMeans · Hybrid Scoring</span>
        </div>
      </div>

      <div className="bg-surface p-8 rounded-2xl shadow-lg border border-textSecondary/5">
        <div className="max-w-2xl mx-auto">
          <label htmlFor="outfit-prompt" className="block text-sm font-semibold text-textPrimary mb-1">
            What are you looking for?
          </label>
          <textarea
            id="outfit-prompt"
            rows={3}
            className="mt-1 block w-full shadow-sm text-sm border border-textSecondary/20 rounded-xl bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-textSecondary/50 px-4 py-3 resize-none transition-colors"
            placeholder="e.g., A stylish casual shirt for weekend brunch in spring..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="flex flex-wrap items-center gap-2 mt-3 mb-5">
            <p className="text-xs text-textSecondary">Try:</p>
            {examplePrompts.map(p => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="px-3 py-1 text-xs bg-background rounded-full hover:bg-textSecondary/10 text-textSecondary transition-colors border border-textSecondary/10"
              >
                {p}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3 text-center mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || productsLoading}
            className="w-full flex justify-center items-center gap-2 bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {loading ? <Spinner /> : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Find My Outfit
              </>
            )}
          </button>
        </div>

        <div className="mt-8 border-t border-textSecondary/10 pt-8">
          {loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary mx-auto"></div>
              <p className="mt-4 text-textSecondary">Running ML inference...</p>
              <p className="text-xs text-textSecondary/60 mt-1">TF-IDF → SVD → KMeans hybrid scoring</p>
            </div>
          )}

          {foundOutfits.length > 0 && !loading && (
            <div>
              <h3 className="text-2xl font-bold mb-2 text-textPrimary text-center">Top {foundOutfits.length} ML Matches</h3>
              <p className="text-sm text-textSecondary text-center mb-6">Ranked by LSA cosine similarity + cluster membership bonus</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {foundOutfits.map((outfit, i) => <OutfitCard key={outfit.id} outfit={outfit} rank={i + 1} />)}
              </div>
            </div>
          )}

          {!loading && searched && foundOutfits.length === 0 && !error && (
            <div className="text-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-textSecondary/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-textSecondary font-medium">No matches found.</p>
              <p className="text-textSecondary/70 text-sm mt-1">Try different keywords.</p>
            </div>
          )}

          {!loading && !searched && (
            <div className="text-center text-textSecondary py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-textSecondary/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>Your ML-recommended shirts will appear here.</p>
              <p className="text-xs text-textSecondary/60 mt-1">Powered by the trained pickle model</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitGenerator;
