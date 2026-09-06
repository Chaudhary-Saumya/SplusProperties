import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      const timer = setTimeout(() => {
        setShowReconnectedBanner(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[9999] bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white py-2 px-4 shadow-lg text-center font-['Nunito_Sans',sans-serif] flex items-center justify-center gap-2 text-xs font-black tracking-wide"
        >
          <WifiOff size={15} className="animate-pulse shrink-0" />
          <span>You are offline &bull; Showing cached land & property data</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2.5 py-0.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <RefreshCw size={10} /> Retry
          </button>
        </motion.div>
      )}

      {isOnline && showReconnectedBanner && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[9999] bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white py-2 px-4 shadow-lg text-center font-['Nunito_Sans',sans-serif] flex items-center justify-center gap-2 text-xs font-black tracking-wide"
        >
          <Wifi size={15} className="shrink-0" />
          <span>Connected &bull; Back Online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatusBanner;
