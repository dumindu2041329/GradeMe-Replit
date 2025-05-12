import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';

// Cache for preloaded routes
const preloadedRoutes = new Set<string>();

// Track route changes and provide instant transitions
export function useRouteTransition() {
  const [location, navigate] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousLocation = useRef(location);
  
  // Monitor route changes to handle transitions
  useEffect(() => {
    // When location changes, briefly mark as transitioning
    if (previousLocation.current !== location) {
      // Almost immediately finish transitioning
      previousLocation.current = location;
      
      // Preload adjacent routes for faster navigation next time
      preloadAdjacentRoutes();
    }
  }, [location]);
  
  // Preload adjacent routes
  const preloadAdjacentRoutes = useCallback(() => {
    const routes = ["/", "/exams", "/students", "/results"];
    
    routes.forEach(route => {
      if (route !== location && !preloadedRoutes.has(route)) {
        // Mark as preloaded
        preloadedRoutes.add(route);
        
        // Trigger a non-rendering navigation request to preload
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      }
    });
  }, [location]);
  
  // Virtually instant navigation with no delay
  const navigateWithTransition = useCallback((to: string) => {
    // Only navigate if going to a different route
    if (to !== location) {
      // No delay, navigate immediately
      navigate(to);
    }
  }, [location, navigate]);
  
  return {
    isTransitioning: false, // Always false for instant navigation
    navigateWithTransition,
    currentLocation: location
  };
}