import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Share2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { triggerHaptic } from '../utils/haptics';

const PhotoLightbox = ({ images = [], initialIndex = 0, isOpen, onClose, title = "Property Photos" }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    triggerHaptic('light');
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    triggerHaptic('light');
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const fullUrl = getImageUrl(currentImage);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/95 backdrop-blur-md select-none font-['Nunito_Sans',sans-serif]">
        
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-slate-900/80 border-b border-slate-800 text-white shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-black uppercase tracking-widest text-[#c9a84c] px-2.5 py-1 bg-[#c9a84c]/10 rounded-lg border border-[#c9a84c]/20">
              {currentIndex + 1} / {images.length}
            </span>
            <h3 className="text-xs sm:text-sm font-bold truncate text-slate-300 max-w-xs sm:max-w-md">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isZoomed ? "Zoom Out" : "Zoom In"}
            >
              {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
            </button>

            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`property-photo-${currentIndex + 1}.jpg`}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Open Original"
            >
              <Download size={16} />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close Gallery (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Main Photo Viewer Area ── */}
        <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden">
          
          {/* Left Arrow Button */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-[#c9a84c] text-white hover:text-slate-950 flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer border border-slate-700"
              title="Previous Photo"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image Display */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={fullUrl}
              alt={`${title} - Photo ${currentIndex + 1}`}
              className="max-h-[75vh] sm:max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>

          {/* Right Arrow Button */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-[#c9a84c] text-white hover:text-slate-950 flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer border border-slate-700"
              title="Next Photo"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* ── Bottom Thumbnail Strip ── */}
        {images.length > 1 && (
          <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  triggerHaptic('light');
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  currentIndex === idx
                    ? 'border-[#c9a84c] scale-105 shadow-md shadow-[#c9a84c]/20'
                    : 'border-slate-700 opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={getImageUrl(img)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

      </div>
    </AnimatePresence>
  );
};

export default PhotoLightbox;
