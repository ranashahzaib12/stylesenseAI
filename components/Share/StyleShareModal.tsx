import React, { useEffect, useState, useCallback } from 'react';
import { generateSocialMediaCaptions } from '../../services/geminiService';
import Spinner from '../Spinner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resultImage: string;
  garmentName: string;
}

const StyleShareModal: React.FC<Props> = ({ isOpen, onClose, resultImage, garmentName }) => {
  const [captions, setCaptions] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [captionError, setCaptionError] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadCaptions = useCallback(async () => {
    setLoading(true);
    setCaptionError(false);
    try {
      const result = await generateSocialMediaCaptions(garmentName);
      setCaptions(result);
    } catch {
      setCaptionError(true);
    } finally {
      setLoading(false);
    }
  }, [garmentName]);

  useEffect(() => {
    if (isOpen && garmentName) {
      loadCaptions();
    }
  }, [isOpen, garmentName, loadCaptions]);

  if (!isOpen) return null;

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'StyleSense-AI-Look.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(captions.twitter || '')}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=https://stylesense.ai&quote=${encodeURIComponent(captions.facebook || '')}`,
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-md w-full border border-textSecondary/5" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-center mb-2 text-textPrimary">Share Your Style</h3>
        <p className="text-center text-textSecondary mb-6">Let your friends see your new look!</p>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-primary mx-auto"></div>
              <p className="mt-3 text-textSecondary">Generating captions...</p>
            </div>
          </div>
        ) : captionError ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-error/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-textSecondary text-sm text-center">Couldn't generate captions.<br />Please check your connection and try again.</p>
            <button
              onClick={loadCaptions}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Share on X (Twitter)
            </a>
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors">
              Share on Facebook
            </a>
            <div className="text-center bg-background p-4 rounded-lg border border-textSecondary/10">
              <p className="font-semibold text-textPrimary">Share on Instagram</p>
              <p className="text-sm text-textSecondary mt-2 border-t border-textSecondary/10 pt-2">"{captions.instagram}"</p>
              <div className="flex gap-2 mt-3">
                <button onClick={downloadImage} className="flex-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  1. Download Image
                </button>
                <button onClick={() => copyToClipboard(captions.instagram)} className="flex-1 px-4 py-2 bg-textSecondary/20 text-textPrimary text-sm font-semibold rounded-lg hover:bg-textSecondary/30 transition-colors">
                  {copied ? 'Copied!' : '2. Copy Caption'}
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-background text-textPrimary font-semibold rounded-lg hover:bg-background/80 transition-colors border border-textSecondary/10">
          Close
        </button>
      </div>
    </div>
  );
};

export default StyleShareModal;
