import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import type { WeatherData, LocationData, QuizDetails, Outfit, Garment, NavItem, TryOnJob } from '../types';
import useWeather from '../hooks/useWeather';
import { performVitonHDTryOn, detectGarmentCategory, fetchRecommendations } from '../services/apiService';
import { useAuth } from './AuthContext';
import { uploadTryOnImage, saveTryOnRecord, fetchUserTryOnHistory, saveUserProfile, fetchUserProfile } from '../services/storageService';

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts an image URL to a base64 data URL.
 * Falls back to a CORS proxy if the direct fetch is blocked by cross-origin policy.
 */
const imageUrlToDataUrl = async (imageUrl: string): Promise<string> => {
  const tryFetch = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Image fetch failed (${response.status})`);
    return blobToDataUrl(await response.blob());
  };

  try {
    return await tryFetch(imageUrl);
  } catch {
    // CORS proxy fallback — handles image CDNs that don't send CORS headers
    const proxied = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
    try {
      return await tryFetch(proxied);
    } catch (proxyErr) {
      throw new Error(`Could not load garment image: ${(proxyErr as Error).message}`);
    }
  }
};


interface AppContextType {
  weather: WeatherData | null;
  location: LocationData | null;
  quizDetails: QuizDetails | null;
  saveQuizDetails: (details: QuizDetails) => void;
  resetQuiz: () => void;
  isQuizCompleted: boolean;
  weatherLoading: boolean;
  weatherError: string | null;
  weatherIsFallback: boolean;
  triedOnOutfits: Garment[];
  addTriedOnOutfit: (outfit: Garment) => void;
  generatedOutfits: Outfit[];
  setGeneratedOutfits: (outfits: Outfit[]) => void;
  garmentForTryOn: Garment | null;
  selectForTryOn: (outfit: Outfit) => void;
  clearGarmentForTryOn: () => void;
  // --- Background Job State ---
  tryOnJobs: TryOnJob[];
  startTryOnJob: (personImage: string, garment: Garment) => void;
  retryTryOnJob: (jobId: string) => void;
  clearCompletedJobs: () => void;
  // --- Navigation ---
  setActiveTab: (tab: NavItem) => void;
  // --- Global Product Cache ---
  products: Outfit[];
  filteredProducts: Outfit[]; // Products filtered by user gender
  productsLoading: boolean;
  // --- Theme ---
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  setActiveTab: (tab: NavItem) => void;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, setActiveTab }) => {
  const { user } = useAuth();
  const { weather, location, loading: weatherLoading, error: weatherError, isFallback: weatherIsFallback } = useWeather();
  const [quizDetails, setQuizDetails] = useState<QuizDetails | null>(null);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [triedOnOutfits, setTriedOnOutfits] = useState<Garment[]>([]);
  const [generatedOutfits, setGeneratedOutfits] = useState<Outfit[]>([]);
  const [garmentForTryOn, setGarmentForTryOn] = useState<Garment | null>(null);
  const [pendingTryOnOutfit, setPendingTryOnOutfit] = useState<Outfit | null>(null);
  const [tryOnJobs, setTryOnJobs] = useState<TryOnJob[]>([]);
  
  // Products caching
  const [products, setProducts] = useState<Outfit[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Theme Management
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);


  // Load the static ML shirt catalog (from outfit_finder_model.pkl parameters)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchRecommendations();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load shirt catalog:', error);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Filter products based on Gender
  const filteredProducts = useMemo(() => {
      if (!quizDetails?.gender || quizDetails.gender === 'Prefer Not To Say') {
          return products;
      }
      return products.filter(p => p.gender === quizDetails.gender || !p.gender);
  }, [products, quizDetails?.gender]);
  
  // Fetch history and profile on load
  useEffect(() => {
    let isMounted = true;

    if (user) {
        // 1. Fetch History
        fetchUserTryOnHistory(user.id).then(history => {
            if (!isMounted) return;
            const historyJobs: TryOnJob[] = history.map(h => ({
                id: h.id,
                status: 'completed',
                personImage: h.image_url, 
                garment: { name: h.garment_name, imageUrl: h.garment_image_url },
                resultImage: h.image_url
            }));

            setTryOnJobs(prevJobs => {
                const existingIds = new Set(prevJobs.map(j => j.id));
                const uniqueHistory = historyJobs.filter(h => !existingIds.has(h.id));
                return [...prevJobs, ...uniqueHistory];
            });
        });

        // 2. Fetch Profile (Quiz Data)
        fetchUserProfile(user.id).then(profile => {
             if (!isMounted) return;
             if (profile) {
                 setQuizDetails(profile);
                 setIsQuizCompleted(true);
             }
        });

    } else {
        // Clear jobs and profile on logout
        setTryOnJobs([]);
        setQuizDetails(null);
        setIsQuizCompleted(false);
    }

    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    // Check if a quiz was completed and a try-on is pending
    if (isQuizCompleted && pendingTryOnOutfit) {
      const garment: Garment = {
        name: pendingTryOnOutfit.name,
        imageUrl: pendingTryOnOutfit.imageUrl,
      };
      setGarmentForTryOn(garment);
      setActiveTab('Virtual Try-On');
      setPendingTryOnOutfit(null); 
    }
  }, [isQuizCompleted, pendingTryOnOutfit, setActiveTab]);

  const addTriedOnOutfit = (outfit: Garment) => {
    setTriedOnOutfits(prev => [outfit, ...prev.slice(0, 3)]);
  };

  const saveQuizDetails = async (details: QuizDetails) => {
    setQuizDetails(details);
    setIsQuizCompleted(true);
    if (user) {
        try {
            await saveUserProfile(user.id, details);
        } catch (e) {
            console.error("Failed to persist quiz details:", e instanceof Error ? e.message : JSON.stringify(e));
        }
    }
  };

  const resetQuiz = () => {
     setActiveTab('Style Quiz'); 
     // We don't clear the data immediately so the user can edit it
     // But we route them to the quiz
  };

  const selectForTryOn = (outfit: Outfit) => {
    const garment: Garment = {
      name: outfit.name,
      imageUrl: outfit.imageUrl,
    };
    if (!isQuizCompleted) {
      setPendingTryOnOutfit(outfit);
      setActiveTab('Style Quiz');
    } else {
      setGarmentForTryOn(garment);
      setActiveTab('Virtual Try-On');
    }
  };

  const clearGarmentForTryOn = () => {
    setGarmentForTryOn(null);
  };
  
  const clearCompletedJobs = () => {
    setTryOnJobs(prevJobs => prevJobs.filter(job => job.status === 'processing'));
  };
  
  const processTryOnJob = async (job: TryOnJob) => {
      try {
        const garmentDataUrl = await imageUrlToDataUrl(job.garment.imageUrl);

        // Auto-detect garment category so OOTDiffusion uses the correct mask.
        // Falls back to 'upper_body' silently on any network/timeout error.
        const category = await detectGarmentCategory(garmentDataUrl).catch(() => 'upper_body' as const);

        const resultImageBase64 = await performVitonHDTryOn(job.personImage, garmentDataUrl, category, job.garment.name);
        
        let finalImageUrl = resultImageBase64;
        
        if (user) {
            try {
                 const publicUrl = await uploadTryOnImage(user.id, resultImageBase64);
                 if (publicUrl) {
                     finalImageUrl = publicUrl;
                     await saveTryOnRecord(
                         user.id, 
                         finalImageUrl, 
                         job.garment.name, 
                         job.garment.imageUrl
                     );
                 }
            } catch (storageError) {
                console.error("Failed to save to cloud history, but generation succeeded:", storageError);
            }
        }

        setTryOnJobs(prevJobs => 
            prevJobs.map(j => 
                j.id === job.id ? { ...j, status: 'completed', resultImage: finalImageUrl } : j
            )
        );
    } catch (error) {
        console.error("Try-on job failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Image processing failed.";
        setTryOnJobs(prevJobs => 
            prevJobs.map(j => 
                j.id === job.id ? { ...j, status: 'failed', error: errorMessage } : j
            )
        );
    }
  }

  const startTryOnJob = (personImage: string, garment: Garment) => {
    const newJob: TryOnJob = {
        id: `job-${Date.now()}`,
        status: 'processing',
        personImage,
        garment,
    };
    setTryOnJobs(prevJobs => [newJob, ...prevJobs]);
    processTryOnJob(newJob);
  };
  
  const retryTryOnJob = (jobId: string) => {
    const jobToRetry = tryOnJobs.find(job => job.id === jobId);
    if (jobToRetry) {
        setTryOnJobs(prevJobs =>
            prevJobs.map(j =>
                j.id === jobId ? { ...j, status: 'processing', error: undefined } : j
            )
        );
        processTryOnJob(jobToRetry);
    }
  };


  const value = {
    weather,
    location,
    quizDetails,
    saveQuizDetails,
    resetQuiz,
    isQuizCompleted,
    weatherLoading,
    weatherError,
    weatherIsFallback,
    triedOnOutfits,
    addTriedOnOutfit,
    generatedOutfits,
    setGeneratedOutfits,
    garmentForTryOn,
    selectForTryOn,
    clearGarmentForTryOn,
    tryOnJobs,
    startTryOnJob,
    retryTryOnJob,
    clearCompletedJobs,
    setActiveTab,
    products,
    filteredProducts,
    productsLoading,
    isDarkMode,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};