import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [location] = useLocation();

  // Track location changes and animate transitions
  useEffect(() => {
    setIsTransitioning(true);
    
    // Short timeout to ensure new content is rendered during transition
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location, children]);

  return (
    <div 
      className={`page-transition ${isTransitioning ? "transitioning" : ""}`}
    >
      {displayChildren}
    </div>
  );
}