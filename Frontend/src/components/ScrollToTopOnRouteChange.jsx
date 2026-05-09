import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures route changes start at the top.
 * Also disables browser native scroll restoration to avoid middle/end jumps.
 */
export default function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    // Prevent browser from restoring previous scroll position.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Jump to top instantly on every route change.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash]);

  return null;
}

