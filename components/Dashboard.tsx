import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Outfit, WeatherData, QuizDetails, Garment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CreationsPanel from './CreationsPanel';

const OutfitCard: React.FC<{ outfit: Outfit; recommendationReason?: string }> = ({ outfit, recommendationReason }) => {
  const { selectForTryOn } = useAppContext();
  
  return (
    <div className="relative bg-surface rounded-lg shadow-md overflow-hidden group border border-textSecondary/5">
      {recommendationReason && (
        <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
            ✨ {recommendationReason}
        </div>
      )}
      <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-80 object-cover" />

      {/* Desktop: centered overlay on hover */}
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

const OutfitCardSkeleton: React.FC = () => (
  <div className="bg-surface rounded-lg shadow-md overflow-hidden animate-pulse border border-textSecondary/5">
    <div className="w-full h-80 bg-textSecondary/10"></div>
    <div className="p-4">
      <div className="h-6 bg-textSecondary/10 rounded w-3/4"></div>
    </div>
  </div>
);

const StyleProfileSummary: React.FC<{ quizDetails: QuizDetails; onEdit: () => void }> = ({ quizDetails, onEdit }) => (
    <div className="bg-surface p-6 rounded-lg shadow-md mb-8 border border-textSecondary/5">
        <div className="flex justify-between items-start mb-4">
             <h3 className="text-xl font-bold text-textPrimary">Your Style Profile</h3>
             <button onClick={onEdit} className="text-sm text-primary hover:text-primary/80 hover:underline">Edit Profile</button>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                <span className="font-semibold text-textSecondary">Vibe:</span>
                <span className="text-primary font-bold">{quizDetails.vibe || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                <span className="font-semibold text-textSecondary">Occasion:</span>
                <span className="text-primary font-bold">{quizDetails.occasion || 'Not set'}</span>
            </div>
             <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                <span className="font-semibold text-textSecondary">Season:</span>
                <span className="text-primary font-bold">{quizDetails.season || 'Not set'}</span>
            </div>
             <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                <span className="font-semibold text-textSecondary">Body Type:</span>
                <span className="font-bold text-textPrimary">{quizDetails.bodyType || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                <span className="font-semibold text-textSecondary">Gender:</span>
                <span className="font-bold text-textPrimary">{quizDetails.gender || 'Not set'}</span>
            </div>
             {quizDetails.heightFt && (
                <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                    <span className="font-semibold text-textSecondary">Height:</span>
                    <span className="font-bold text-textPrimary">{quizDetails.heightFt}' {quizDetails.heightIn || 0}"</span>
                </div>
            )}
        </div>
    </div>
);

const RecentlyTried: React.FC<{ outfits: Garment[] }> = ({ outfits }) => (
    <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-textPrimary text-center">Recently Tried On</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {outfits.map((outfit, index) => (
                <div key={index} className="bg-surface rounded-lg shadow-md p-2 border border-textSecondary/5">
                    <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-40 object-contain rounded" />
                </div>
            ))}
        </div>
    </div>
);


const calculateFitScore = (outfit: Outfit, weather: WeatherData | null, quizDetails: QuizDetails | null): { score: number; reasons: string[] } => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Season Matching (uses quiz data, more reliable than live weather which can fluctuate)
    if (quizDetails?.season) {
        const outfitIsForCold = outfit.category.toLowerCase() === 'cold' || outfit.name.toLowerCase().includes('jacket') || outfit.name.toLowerCase().includes('coat');
        if (quizDetails.season === 'Winter' && outfitIsForCold) {
            score += 10;
            reasons.push("Perfect for Winter!");
        } else if (quizDetails.season === 'Summer' && !outfitIsForCold) {
            score += 8;
            reasons.push("Great for Summer!");
        }
    }

    // 2. Vibe Matching
    if (quizDetails?.vibe) {
        const name = outfit.name.toLowerCase();
        const vibe = quizDetails.vibe.toLowerCase();
        if ((vibe === 'casual' && (name.includes('t-shirt') || name.includes('casual'))) ||
            (vibe === 'chic' && (name.includes('jacket') || name.includes('blazer'))) ||
            (vibe === 'edgy' && (name.includes('moto') || name.includes('biker')))) {
            score += 8;
            reasons.push(`Matches your '${quizDetails.vibe}' vibe!`);
        }
    }

    // 3. Occasion/Style Matching
    if (quizDetails?.occasion) {
        const name = outfit.name.toLowerCase();
        const occasion = quizDetails.occasion.toLowerCase();
        if (occasion === 'formal' && (name.includes('jacket') || name.includes('blazer'))) {
            score += 7;
            reasons.push(`Suits a 'Formal' occasion.`);
        }
        if (occasion === 'casual' && (name.includes('t-shirt') || name.includes('casual'))) {
            score += 7;
            reasons.push(`Perfect for a 'Casual' look.`);
        }
    }
    return { score, reasons };
};

const Dashboard: React.FC = () => {
  const { weather, weatherIsFallback, weatherError, quizDetails, isQuizCompleted, triedOnOutfits, filteredProducts, productsLoading, location, resetQuiz } = useAppContext();
  const { user } = useAuth();
  
  const sortedOutfits = useMemo(() => {
    return filteredProducts
      .map(outfit => ({
        outfit,
        ...calculateFitScore(outfit, weather, quizDetails),
      }))
      .sort((a, b) => b.score - a.score);
  }, [weather, filteredProducts, quizDetails]);

  const userName = user?.email?.split('@')[0] || 'Style Explorer';

  return (
    <div className="animate-fade-in">
        {/* Welcome + Weather Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-3">
            <div className="text-center sm:text-left">
                <h2 className="text-3xl font-bold mb-1 text-textPrimary capitalize">Welcome, {userName}!</h2>
                <p className="text-md text-textSecondary">
                    {isQuizCompleted ? `Your personal style hub.` : 'Complete your Style Quiz for personalized picks.'}
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
      
      {weatherIsFallback && (
        <div className="p-4 mb-6 bg-warning/10 border-l-4 border-warning text-textPrimary rounded-r-lg shadow-md">
           <p className="font-bold text-warning">⚠️ Live Weather Unavailable</p>
           <p className="mt-1 text-sm text-textSecondary">Recommendations are being shown for mild weather conditions.</p>
           {weatherError && <p className="mt-2 text-xs opacity-80"><strong>Reason:</strong> {weatherError}</p>}
        </div>
      )}

      <CreationsPanel />

      {isQuizCompleted && quizDetails && <StyleProfileSummary quizDetails={quizDetails} onEdit={resetQuiz} />}
      {triedOnOutfits.length > 0 && <RecentlyTried outfits={triedOnOutfits} />}

      <h3 className="text-2xl font-bold mb-4 text-textPrimary text-center">
        {quizDetails?.gender ? `${quizDetails.gender}'s` : "Today's"} Recommendations
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productsLoading 
          ? Array.from({ length: 8 }).map((_, i) => <OutfitCardSkeleton key={i} />)
          : sortedOutfits.map(({ outfit, reasons, score }) => (
              <OutfitCard key={outfit.id} outfit={outfit} recommendationReason={score > 5 ? reasons[0] : undefined} />
            ))
        }
      </div>
    </div>
  );
};

export default Dashboard;