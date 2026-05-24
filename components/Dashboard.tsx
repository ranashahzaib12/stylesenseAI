import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../contexts/AppContext';
import type { Outfit, WeatherData, QuizDetails, Garment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CreationsPanel from './CreationsPanel';
import { mlRecommend, type MLResult } from '../services/mlRecommend';

// ─── Product Detail Modal ──────────────────────────────────────────────────────

interface DetailModalProps {
  outfit: Outfit;
  mlScore?: number;
  onClose: () => void;
  onTryOn: (outfit: Outfit) => void;
}

const STYLE_COLORS: Record<string, string> = {
  formal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'smart casual': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  casual: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  streetwear: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'resort casual': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  athleisure: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

const ProductDetailModal: React.FC<DetailModalProps> = ({ outfit, mlScore, onClose, onTryOn }) => {
  const styleClass = STYLE_COLORS[outfit.style?.toLowerCase() || ''] || 'bg-textSecondary/10 text-textPrimary';

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const occasions = outfit.occasion?.split(/[,;]+/).map(s => s.trim()).filter(Boolean) || [];

  // createPortal renders the modal directly on document.body, escaping the
  // Dashboard's animate-fade-in wrapper whose transform: translateY(0) end-state
  // would otherwise make position:fixed position relative to the div, not viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-surface rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-textSecondary/10 animate-fade-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-textSecondary/20 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-textPrimary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image panel */}
          <div className="md:w-2/5 flex-shrink-0 bg-background rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
            <img
              src={outfit.imageUrl}
              alt={outfit.name}
              className="w-full h-72 md:h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
              }}
            />
          </div>

          {/* Details panel */}
          <div className="md:w-3/5 p-6 flex flex-col gap-4">
            {/* Style badge */}
            {outfit.style && (
              <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${styleClass}`}>
                {outfit.style}
              </span>
            )}

            <h2 className="text-2xl font-bold text-textPrimary leading-tight">{outfit.name}</h2>

            {/* Tags row */}
            <div className="flex flex-wrap gap-2">
              {outfit.color && (
                <span className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full text-textSecondary border border-textSecondary/10">
                  <span className="font-medium text-textPrimary">Color:</span> {outfit.color}
                </span>
              )}
              {outfit.pattern && (
                <span className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full text-textSecondary border border-textSecondary/10">
                  <span className="font-medium text-textPrimary">Pattern:</span> {outfit.pattern}
                </span>
              )}
              {outfit.fabric && (
                <span className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full text-textSecondary border border-textSecondary/10">
                  <span className="font-medium text-textPrimary">Fabric:</span> {outfit.fabric}
                </span>
              )}
              {outfit.fit && (
                <span className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full text-textSecondary border border-textSecondary/10">
                  <span className="font-medium text-textPrimary">Fit:</span> {outfit.fit}
                </span>
              )}
            </div>

            {/* Occasions */}
            {occasions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">Best For</p>
                <div className="flex flex-wrap gap-1.5">
                  {occasions.map((occ, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                      {occ}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {outfit.description && (
              <div>
                <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">About</p>
                <p className="text-sm text-textSecondary leading-relaxed">{outfit.description}</p>
              </div>
            )}

            {/* ML Score (shown only when coming from recommendation) */}
            {mlScore !== undefined && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-primary font-semibold">
                  ML Match Score: {(mlScore * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto pt-2 flex gap-3">
              <button
                onClick={() => { onTryOn(outfit); onClose(); }}
                className="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transform hover:scale-[1.02] transition-all shadow-md"
              >
                Try Me On
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-textSecondary/20 text-textSecondary hover:bg-textSecondary/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Outfit Card ──────────────────────────────────────────────────────────────

interface OutfitCardProps {
  outfit: Outfit;
  recommendationReason?: string;
  mlScore?: number;
  onClick: (outfit: Outfit, score?: number) => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, recommendationReason, mlScore, onClick }) => {
  const { selectForTryOn } = useAppContext();
  const styleClass = STYLE_COLORS[outfit.style?.toLowerCase() || ''] || '';

  return (
    <div
      className="relative bg-surface rounded-xl shadow-md overflow-hidden group border border-textSecondary/5 cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
      onClick={() => onClick(outfit, mlScore)}
    >
      {recommendationReason && (
        <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
          ✨ {recommendationReason}
        </div>
      )}

      {outfit.style && (
        <div className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full z-10 capitalize ${styleClass}`}>
          {outfit.style}
        </div>
      )}

      <div className="relative overflow-hidden h-72">
        <img
          src={outfit.imageUrl}
          alt={outfit.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+Unavailable';
          }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); selectForTryOn(outfit); }}
            className="bg-primary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary/90 transition-all mb-2 text-sm"
          >
            Try Me
          </button>
          <span className="text-white/80 text-xs">Tap card for details</span>
        </div>
      </div>

      {/* Mobile Try Me button */}
      <div className="absolute bottom-16 left-0 right-0 sm:hidden bg-gradient-to-t from-black/60 to-transparent p-3 flex justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); selectForTryOn(outfit); }}
          className="bg-primary text-white font-bold py-2 px-5 rounded-lg text-sm"
        >
          Try Me
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-base text-textPrimary truncate">{outfit.name}</h3>
        {outfit.color && (
          <p className="text-xs text-textSecondary mt-0.5 truncate capitalize">{outfit.color} · {outfit.fabric || ''}</p>
        )}
      </div>
    </div>
  );
};

const OutfitCardSkeleton: React.FC = () => (
  <div className="bg-surface rounded-xl shadow-md overflow-hidden animate-pulse border border-textSecondary/5">
    <div className="w-full h-72 bg-textSecondary/10"></div>
    <div className="p-4">
      <div className="h-5 bg-textSecondary/10 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-textSecondary/10 rounded w-1/2"></div>
    </div>
  </div>
);

// ─── Style Profile Summary ────────────────────────────────────────────────────

const StyleProfileSummary: React.FC<{ quizDetails: QuizDetails; onEdit: () => void }> = ({ quizDetails, onEdit }) => (
  <div className="bg-surface p-6 rounded-xl shadow-md mb-8 border border-textSecondary/5">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-xl font-bold text-textPrimary">Your Style Profile</h3>
      <button onClick={onEdit} className="text-sm text-primary hover:text-primary/80 hover:underline">Edit Profile</button>
    </div>
    <div className="flex flex-wrap gap-3 text-sm">
      {[
        { label: 'Vibe', value: quizDetails.vibe },
        { label: 'Occasion', value: quizDetails.occasion },
        { label: 'Season', value: quizDetails.season },
        { label: 'Body Type', value: quizDetails.bodyType },
        { label: 'Gender', value: quizDetails.gender },
        ...(quizDetails.heightFt ? [{ label: 'Height', value: `${quizDetails.heightFt}' ${quizDetails.heightIn || 0}"` }] : []),
      ].filter(item => item.value).map(({ label, value }) => (
        <div key={label} className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-textSecondary/5">
          <span className="font-semibold text-textSecondary">{label}:</span>
          <span className="font-bold text-primary">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Recently Tried ───────────────────────────────────────────────────────────

const RecentlyTried: React.FC<{ outfits: Garment[] }> = ({ outfits }) => (
  <div className="mb-8">
    <h3 className="text-xl font-bold mb-4 text-textPrimary">Recently Tried On</h3>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {outfits.map((outfit, i) => (
        <div key={i} className="bg-surface rounded-xl shadow-md p-2 border border-textSecondary/5">
          <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-36 object-contain rounded-lg" />
          <p className="text-xs text-textSecondary mt-1 text-center truncate">{outfit.name}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Fit Score (for sorting without ML recommendation) ───────────────────────

const calculateFitScore = (outfit: Outfit, weather: WeatherData | null, quizDetails: QuizDetails | null) => {
  let score = 0;
  const reasons: string[] = [];
  if (quizDetails?.season) {
    const isCold = outfit.category === 'Cold' || outfit.fabric?.toLowerCase().includes('flannel') || outfit.fabric?.toLowerCase().includes('wool');
    if (quizDetails.season === 'Winter' && isCold) { score += 10; reasons.push('Perfect for Winter!'); }
    else if (quizDetails.season === 'Summer' && !isCold) { score += 8; reasons.push('Great for Summer!'); }
  }
  if (quizDetails?.vibe && outfit.style) {
    const vibe = quizDetails.vibe.toLowerCase();
    const style = outfit.style.toLowerCase();
    if (vibe === 'casual' && (style.includes('casual') || style.includes('athleisure'))) { score += 8; reasons.push(`Matches your '${quizDetails.vibe}' vibe!`); }
    if (vibe === 'chic' && (style.includes('formal') || style.includes('smart'))) { score += 8; reasons.push(`Matches your '${quizDetails.vibe}' vibe!`); }
    if (vibe === 'edgy' && style.includes('streetwear')) { score += 8; reasons.push(`Matches your '${quizDetails.vibe}' vibe!`); }
    if (vibe === 'bohemian' && style.includes('resort')) { score += 8; reasons.push(`Matches your '${quizDetails.vibe}' vibe!`); }
  }
  if (quizDetails?.occasion && outfit.style) {
    const occ = quizDetails.occasion.toLowerCase();
    const style = outfit.style.toLowerCase();
    if (occ === 'formal' && (style.includes('formal') || style.includes('smart'))) { score += 7; reasons.push(`Suits a 'Formal' occasion.`); }
    if (occ === 'casual' && (style.includes('casual') || style.includes('resort'))) { score += 7; reasons.push(`Perfect for a 'Casual' look.`); }
    if (occ === 'streetwear' && style.includes('streetwear')) { score += 7; reasons.push('Fits your Streetwear style.'); }
  }
  if (weather) {
    const isCold = outfit.category === 'Cold';
    if (weather.temp < 15 && isCold) score += 5;
    if (weather.temp > 25 && !isCold) score += 5;
  }
  return { score, reasons };
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { weather, weatherIsFallback, quizDetails, isQuizCompleted, triedOnOutfits, filteredProducts, productsLoading, location, resetQuiz, selectForTryOn } = useAppContext();
  const { user } = useAuth();

  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | undefined>(undefined);
  const [mlRecs, setMlRecs] = useState<MLResult[]>([]);

  // Build ML recommendations from quiz profile whenever quiz changes
  useEffect(() => {
    if (!isQuizCompleted || !quizDetails) { setMlRecs([]); return; }
    const queryParts = [
      quizDetails.vibe,
      quizDetails.occasion,
      quizDetails.season,
      'shirt',
    ].filter(Boolean);
    const q = queryParts.join(' ');
    try {
      setMlRecs(mlRecommend(q, 3));
    } catch {
      setMlRecs([]);
    }
  }, [isQuizCompleted, quizDetails]);

  const mlRecIds = useMemo(() => new Set(mlRecs.map(r => r.id)), [mlRecs]);

  const sortedOutfits = useMemo(() => {
    // Put ML-recommended shirts first, then sort rest by fit score
    const recIds = mlRecIds;
    const baseItems = filteredProducts.map(o => ({
      outfit: o,
      ...calculateFitScore(o, weather, quizDetails),
    }));
    const recommended = baseItems.filter(({ outfit }) => recIds.has(outfit.id));
    const rest = baseItems.filter(({ outfit }) => !recIds.has(outfit.id)).sort((a, b) => b.score - a.score);
    return [...recommended, ...rest];
  }, [filteredProducts, weather, quizDetails, mlRecIds]);

  const userName = user?.email?.split('@')[0] || 'Style Explorer';

  const handleCardClick = (outfit: Outfit, score?: number) => {
    setSelectedOutfit(outfit);
    setSelectedScore(score);
  };

  const handleCloseModal = () => {
    setSelectedOutfit(null);
    setSelectedScore(undefined);
  };

  return (
    <div className="animate-fade-in">
      {/* Welcome + Weather Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-3">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-bold mb-1 text-textPrimary capitalize">Welcome, {userName}!</h2>
          <p className="text-md text-textSecondary">
            {isQuizCompleted ? 'Your personal style hub — 30 full-sleeve shirts, ML-powered.' : 'Complete your Style Quiz for personalized ML picks.'}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface/90 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm border border-textSecondary/10 transition-all hover:shadow-md self-center sm:self-start flex-shrink-0">
          {weather && location ? (
            <>
              <img src={weather.icon} alt={weather.description} className="w-8 h-8" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-textPrimary leading-tight">
                  {weather.temp}°C &middot; <span className="font-normal">{weather.description}</span>
                </span>
                <span className="text-xs text-textSecondary leading-tight">
                  {location.name}{location.country ? `, ${location.country}` : ''}
                  {weatherIsFallback && <span className="ml-1 opacity-60">(approx.)</span>}
                </span>
              </div>
            </>
          ) : (
            <span className="text-xs text-textSecondary animate-pulse">Locating...</span>
          )}
        </div>
      </div>

      {weatherIsFallback && location?.name === 'Unknown' && (
        <div className="p-4 mb-6 bg-warning/10 border-l-4 border-warning text-textPrimary rounded-r-lg shadow-md">
          <p className="font-bold text-warning">⚠️ Weather Unavailable</p>
          <p className="mt-1 text-sm text-textSecondary">Could not reach the weather service. Recommendations are based on your style profile.</p>
        </div>
      )}

      <CreationsPanel />

      {isQuizCompleted && quizDetails && <StyleProfileSummary quizDetails={quizDetails} onEdit={resetQuiz} />}
      {triedOnOutfits.length > 0 && <RecentlyTried outfits={triedOnOutfits} />}

      {/* ML Personalized Picks (shown when quiz is complete) */}
      {mlRecs.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-2xl font-bold text-textPrimary">✨ Your ML Picks</h3>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-semibold">
              Powered by outfit_finder_model.pkl
            </span>
          </div>
          <p className="text-sm text-textSecondary mb-5">
            Top shirts matched to your <strong>{quizDetails?.vibe}</strong> vibe, <strong>{quizDetails?.occasion}</strong> occasion, and <strong>{quizDetails?.season}</strong> season using the TF-IDF → SVD → KMeans ML pipeline.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {mlRecs.map((rec) => {
              const outfit: Outfit = {
                id: rec.id, name: rec.name, category: rec.category, imageUrl: rec.imageUrl,
                style: rec.style, color: rec.color, pattern: rec.pattern,
                fabric: rec.fabric, fit: rec.fit, occasion: rec.occasion,
                description: rec.description, cluster: rec.cluster,
              };
              return (
                <OutfitCard
                  key={rec.id}
                  outfit={outfit}
                  recommendationReason={`#${rec.rank} Match`}
                  mlScore={rec.score}
                  onClick={handleCardClick}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Full Catalog */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-textPrimary text-center mb-1">
          Full Shirt Collection
        </h3>
        <p className="text-sm text-textSecondary text-center mb-6">
          {filteredProducts.length} full-sleeve shirts · Click any shirt to see full details
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productsLoading
          ? Array.from({ length: 8 }).map((_, i) => <OutfitCardSkeleton key={i} />)
          : sortedOutfits.map(({ outfit, reasons, score }) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                recommendationReason={score > 5 && !mlRecIds.has(outfit.id) ? reasons[0] : undefined}
                onClick={handleCardClick}
              />
            ))
        }
      </div>

      {/* Product Detail Modal */}
      {selectedOutfit && (
        <ProductDetailModal
          outfit={selectedOutfit}
          mlScore={selectedScore}
          onClose={handleCloseModal}
          onTryOn={selectForTryOn}
        />
      )}
    </div>
  );
};

export default Dashboard;
