import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Garment } from '../types';
import Spinner from './Spinner';
import CameraCapture from './CameraCapture';
import { validatePersonImage } from '../services/geminiService';

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

const VirtualTryOn: React.FC = () => {
  const { addTriedOnOutfit, garmentForTryOn, clearGarmentForTryOn, startTryOnJob, setActiveTab, filteredProducts, productsLoading } = useAppContext();
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [jobSubmitted, setJobSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationReason, setValidationReason] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (garmentForTryOn) {
      setSelectedGarment(garmentForTryOn);
      clearGarmentForTryOn();
      if (!personPreview) {
        setError("Great choice! Now upload or capture your photo to try it on.");
      }
    }
  }, [garmentForTryOn, personPreview, clearGarmentForTryOn]);

  const runValidation = async (dataUrl: string) => {
    setValidationState('validating');
    setValidationReason('');
    const result = await validatePersonImage(dataUrl);
    if (result.valid) {
      setValidationState('valid');
      setValidationReason(result.reason);
    } else {
      setValidationState('invalid');
      setValidationReason(result.reason);
    }
  };

  const handlePersonFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError(null);
    setJobSubmitted(false);
    setValidationState('idle');
    setValidationReason('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPersonPreview(dataUrl);
      runValidation(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCapture = (imageDataUrl: string) => {
    setPersonPreview(imageDataUrl);
    setIsCameraOpen(false);
    setValidationState('idle');
    setValidationReason('');
    runValidation(imageDataUrl);
  };

  const clearPersonImage = () => {
    setPersonPreview(null);
    setValidationState('idle');
    setValidationReason('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!personPreview || !selectedGarment) {
      setError('Please add your photo and select a garment to begin.');
      return;
    }
    if (validationState === 'invalid') {
      setError('Please upload a valid photo first. ' + validationReason);
      return;
    }
    setError(null);
    startTryOnJob(personPreview, selectedGarment);
    addTriedOnOutfit(selectedGarment);
    setJobSubmitted(true);
    setPersonPreview(null);
    setSelectedGarment(null);
    setValidationState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (jobSubmitted) {
    return (
      <div className="text-center max-w-lg mx-auto bg-surface p-12 rounded-xl shadow-lg animate-fade-in border border-textSecondary/5">
        <svg className="mx-auto h-16 w-16 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-textPrimary mt-4">Your Creation is in Progress!</h2>
        <p className="mt-2 text-md text-textSecondary">The AI is working its magic. Monitor the progress on your dashboard.</p>
        <div className="mt-6 flex justify-center gap-4">
          <button onClick={() => setActiveTab('Dashboard')} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            Go to Dashboard
          </button>
          <button onClick={() => setJobSubmitted(false)} className="px-6 py-2 bg-background text-textPrimary font-semibold rounded-lg hover:bg-background/80 transition-colors">
            Create Another
          </button>
        </div>
      </div>
    );
  }

  const isGenerateBlocked = !personPreview || !selectedGarment || validationState === 'validating' || validationState === 'invalid';

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {isCameraOpen && <CameraCapture onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-textPrimary">Virtual Try-On Studio</h2>
        <p className="mt-2 text-md text-textSecondary">Upload your photo, or use your camera, and select an item to see your new look.</p>
      </div>
      {error && <p className="text-error text-center bg-error/10 border border-error rounded-md p-3 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Photo panel ── */}
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-textSecondary/5">
          <label className="block text-lg font-medium text-textPrimary mb-4">1. Your Photo</label>
          <div className="relative mt-1 flex justify-center items-center h-96 px-6 pt-5 pb-6 border-2 border-textSecondary/20 border-dashed rounded-md">
            {personPreview ? (
              <>
                <img src={personPreview} alt="Your photo" className="max-h-full max-w-full object-contain rounded-lg" />

                {/* Remove button */}
                <button
                  onClick={clearPersonImage}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-opacity z-10"
                  aria-label="Remove photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Validation badge */}
                {validationState === 'validating' && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <div className="flex items-center gap-2 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing photo...
                    </div>
                  </div>
                )}
                {validationState === 'valid' && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <div className="flex items-center gap-1.5 bg-success/90 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Photo looks good
                    </div>
                  </div>
                )}
                {validationState === 'invalid' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-black/60 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-error mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p className="text-white text-sm font-semibold text-center mb-1">Photo not suitable</p>
                    <p className="text-white/80 text-xs text-center mb-3">{validationReason}</p>
                    <button
                      onClick={clearPersonImage}
                      className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Choose a Different Photo
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-textSecondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-textSecondary">Full upper body required — head to waist minimum.</p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-2 bg-background text-textPrimary font-semibold rounded-lg hover:bg-textSecondary/10 border border-textSecondary/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Photo
                  </button>
                  <button type="button" onClick={() => setIsCameraOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-background text-textPrimary font-semibold rounded-lg hover:bg-textSecondary/10 border border-textSecondary/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use Camera
                  </button>
                </div>
              </div>
            )}
            <input id="person-upload" name="person-upload" type="file" ref={fileInputRef} className="sr-only" onChange={(e) => e.target.files && handlePersonFileSelect(e.target.files[0])} accept="image/*" />
          </div>
        </div>

        {/* ── Garment panel ── */}
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-textSecondary/5">
          <label className="block text-lg font-medium text-textPrimary mb-4">2. Select Garment</label>
          {productsLoading ? (
            <div className="h-96 flex items-center justify-center"><Spinner /></div>
          ) : (
            <div className="h-96 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.length > 0 ? filteredProducts.map((outfit) => (
                <div key={outfit.id} onClick={() => setSelectedGarment(outfit)} className={`cursor-pointer rounded-lg p-2 transition-all duration-200 border ${selectedGarment?.name === outfit.name ? 'ring-2 ring-primary bg-primary/10 border-primary' : 'bg-background border-transparent hover:border-textSecondary/20'}`}>
                  <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-32 object-contain" />
                  <p className="text-center text-xs font-medium mt-2 truncate text-textPrimary">{outfit.name}</p>
                </div>
              )) : <p className="col-span-full text-center text-textSecondary">No garments found for your profile.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerateBlocked}
          className="w-full max-w-md flex justify-center items-center gap-2 bg-primary text-white font-bold py-4 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-md"
        >
          {validationState === 'validating' ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing photo...</>
          ) : (
            'Generate Try-On'
          )}
        </button>
        {validationState === 'invalid' && (
          <p className="mt-2 text-sm text-error">Fix the photo issue above before generating.</p>
        )}
      </div>
    </div>
  );
};

export default VirtualTryOn;
