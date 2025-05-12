import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';

// Track route changes and provide smooth transitions
export function useRouteTransition() {
  const [location, navigate] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousLocation = useRef(location);
  
  // Monitor route changes to trigger transitions
  useEffect(() => {
    // When location changes, mark as transitioning
    if (previousLocation.current !== location) {
      setIsTransitioning(true);
      
      // After a very short delay, finish the transition
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        previousLocation.current = location;
      }, 250); // This should match your CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  // Enhanced navigation function with transitions
  const navigateWithTransition = useCallback((to: string) => {
    // Only trigger transition if going to a different route
    if (to !== location) {
      setIsTransitioning(true);
      
      // Small delay to let fade-out animation start before changing route
      setTimeout(() => {
        navigate(to);
      }, 50);
    }
  }, [location, navigate]);
  
  return {
    isTransitioning,
    navigateWithTransition,
    currentLocation: location
  };
}