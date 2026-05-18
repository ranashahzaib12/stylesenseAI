import React, { useState } from 'react';
import { TryOnJob } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import StyleShareModal from '../Share/StyleShareModal';
import { generateAIEnhancedTryOn } from '../../services/geminiService';

// ─── AI Enhanced Result Modal ───────────────────────────────────────────────────

const EnhancedResultModal: React.FC<{
  imageUrl: string;
  garmentName: string;
  onClose: () => void;
}> = ({ imageUrl, garmentName, onClose }) => {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `stylesense-ai-enhanced-${garmentName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="relative bg-surface rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-textSecondary/10">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold text-textPrimary">AI Enhanced Result</span>
          </div>
          <button onClick={onClose} className="text-textSecondary hover:text-textPrimary transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="bg-background p-4">
          <img src={imageUrl} alt="AI enhanced try-on" className="w-full rounded-xl object-contain max-h-[420px]" />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-end gap-3 border-t border-textSecondary/10">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary border border-textSecondary/20 rounded-lg transition-colors">
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Job Item ───────────────────────────────────────────────────────────────────

const JobItem: React.FC<{ job: TryOnJob }> = ({ job }) => {
  const { retryTryOnJob } = useAppContext();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!job.resultImage) return;
    setEnhancing(true);
    setEnhanceError(null);
    try {
      const result = await generateAIEnhancedTryOn(
        job.personImage,
        job.garment.imageUrl,
        job.garment.name
      );
      setEnhancedImage(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Enhancement failed. Please try again.';
      setEnhanceError(msg);
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <>
      {job.status === 'completed' && job.resultImage && (
        <StyleShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          resultImage={job.resultImage}
          garmentName={job.garment.name}
        />
      )}

      {enhancedImage && (
        <EnhancedResultModal
          imageUrl={enhancedImage}
          garmentName={job.garment.name}
          onClose={() => setEnhancedImage(null)}
        />
      )}

      <div className="bg-background p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 animate-fade-in border border-textSecondary/10">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0">
          <img src={job.personImage} alt="Your photo" className="w-24 h-24 object-cover rounded-lg" />
          <img src={job.garment.imageUrl} alt={job.garment.name} className="absolute w-10 h-10 -bottom-2 -right-2 rounded-md border-2 border-surface shadow-lg" />
        </div>

        {/* Info */}
        <div className="flex-grow text-center sm:text-left">
          <p className="font-semibold text-textPrimary">{job.garment.name}</p>
          <p className="text-xs text-textSecondary">
            {job.status === 'completed' ? 'Ready to wear' : job.status === 'processing' ? 'Creating your look...' : 'Something went wrong'}
          </p>
          {enhanceError && (
            <p className="text-xs text-error mt-1">{enhanceError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="w-full sm:w-auto flex-shrink-0">
          {job.status === 'processing' && (
            <div className="flex items-center justify-center gap-3 p-2 rounded-lg bg-primary/10 text-primary">
              <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-current" />
              <span className="font-medium text-sm">Processing...</span>
            </div>
          )}

          {job.status === 'failed' && (
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-lg bg-error/10 text-error text-center">
                <p className="font-medium text-sm">Failed</p>
              </div>
              <button onClick={() => retryTryOnJob(job.id)} className="flex items-center gap-1 text-sm text-error hover:text-red-700 hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Retry
              </button>
            </div>
          )}

          {job.status === 'completed' && job.resultImage && (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <img src={job.resultImage} alt="Completed try-on" className="w-20 h-20 object-cover rounded-lg shadow-md border border-textSecondary/10" />
              <div className="flex flex-col gap-2">
                {/* AI Enhance button */}
                <button
                  onClick={handleEnhance}
                  disabled={enhancing}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-surface border border-primary/40 text-primary text-sm font-bold rounded-lg hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                  title="Generate a photorealistic AI-enhanced version using OpenAI"
                >
                  {enhancing ? (
                    <><div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Enhancing...</>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      AI Enhance
                    </>
                  )}
                </button>

                {/* Share button */}
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 shadow-sm transition-transform hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JobItem;
