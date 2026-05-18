import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<Props> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      });
  }, []);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (mode: 'user' | 'environment') => {
    stopStream();
    setIsStarting(true);
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setStream(newStream);
    } catch (err) {
      console.error("Camera error:", err);
      let message = "Could not access camera. Please ensure permissions are granted in your browser settings.";
      if (err instanceof Error && err.name === 'NotAllowedError') {
        message = "Camera access denied. Please enable camera permissions to use this feature.";
      }
      setError(message);
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => stopStream();
  }, [facingMode]);

  const handleSwitchCamera = () => {
    setCapturedPreview(null);
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        if (facingMode === 'user') {
          context.translate(videoRef.current.videoWidth, 0);
          context.scale(-1, 1);
        }

        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        setCapturedPreview(dataUrl);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedPreview) {
      stopStream();
      onCapture(capturedPreview);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in p-4" onClick={capturedPreview ? undefined : onClose}>
      <div className="relative bg-black rounded-lg w-full max-w-2xl aspect-video overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Camera init loading */}
        {isStarting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 gap-3">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
            <p className="text-lg text-error">{error}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-lg">Close</button>
          </div>
        ) : capturedPreview ? (
          /* Capture preview */
          <>
            <img src={capturedPreview} alt="Captured preview" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-4">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
                </svg>
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Use this photo
              </button>
            </div>
          </>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* Controls — only shown during live view */}
        {!capturedPreview && !error && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
            <div className="absolute left-4 bottom-4">
              {hasMultipleCameras && (
                <button onClick={handleSwitchCamera} className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors" aria-label="Switch Camera">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={handleCapture} disabled={isStarting} className="w-20 h-20 bg-white rounded-full border-4 border-black/30 ring-4 ring-white/30 disabled:opacity-50" aria-label="Capture Photo" />
            <div className="absolute right-4 bottom-4">
              <button onClick={onClose} className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors" aria-label="Close Camera">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
