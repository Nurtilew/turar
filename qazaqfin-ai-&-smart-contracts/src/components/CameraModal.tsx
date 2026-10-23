import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, FlipHorizontal } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера бұл құрылғыда қолжетімді емес');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const isDenied = err instanceof Error && err.name === 'NotAllowedError';
      setCameraError(
        isDenied
          ? 'Камераға рұқсат берілмеді. Браузер параметрлерінен рұқсат беріңіз немесе файл таңдаңыз.'
          : 'Камераны қосу мүмкін болмады. Галереядан суретті жүктей аласыз.'
      );
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100a06]/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#221710] border border-[#4a3325] rounded-3xl overflow-hidden shadow-2xl flex flex-col text-[#f7ede2]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3a271c] bg-[#1a100a]/80 z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#dba77b]" />
            <h3 className="text-sm font-bold text-[#f7ede2]">
              {capturedImage ? 'Түсірілген құжат / чек' : 'Чекті немесе тауарды сканерлеу'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#c98e60] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder or Preview */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : cameraError ? (
            <div className="p-6 text-center max-w-xs space-y-3">
              <AlertCircle className="w-10 h-10 text-[#d4a373] mx-auto" />
              <p className="text-xs text-[#ebd3be] leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Coffee bean style targeting brackets */}
              <div className="absolute inset-8 border-2 border-[#dba77b]/50 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-[#dba77b]"></span>
                  <span className="w-4 h-4 border-t-2 border-r-2 border-[#dba77b]"></span>
                </div>
                <div className="text-center text-[11px] text-[#f7ede2] font-medium bg-[#1a100a]/80 px-3 py-1 rounded-full self-center backdrop-blur-sm border border-[#dba77b]/30">
                  Чекті немесе ценникті рамка ішіне келтіріңіз
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-[#dba77b]"></span>
                  <span className="w-4 h-4 border-b-2 border-r-2 border-[#dba77b]"></span>
                </div>
              </div>
              {isInitializing && (
                <div className="absolute inset-0 bg-[#150d08]/85 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-[#dba77b] animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-[#1a100a] flex items-center justify-between gap-3 border-t border-[#3a271c]">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#f7ede2] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#c98e60]" />
                Қайта түсіру
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] hover:brightness-110 text-[#110905] text-xs font-bold shadow-md shadow-[#b5805a]/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Қабылдау
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#dba77b] transition-colors cursor-pointer"
                title="Камераны ауыстыру"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleCapture}
                disabled={Boolean(cameraError) || isInitializing}
                className="w-16 h-16 rounded-full bg-[#f7ede2] hover:bg-[#ebd3be] p-1 shadow-xl transition-transform active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                <div className="w-full h-full rounded-full border-2 border-[#1a100a] bg-[#f7ede2] flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8f6449] to-[#c98e60]"></div>
                </div>
              </button>
              <div className="w-11" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
