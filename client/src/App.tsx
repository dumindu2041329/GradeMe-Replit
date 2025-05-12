import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Exams from "@/pages/exams";
import Students from "@/pages/students";
import Results from "@/pages/results";
import { useEffect, useState, useRef, lazy, Suspense } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  // Always start visible for faster transitions
  const [isContentVisible, setIsContentVisible] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (!isLoading && user) {
      // No delay, show content immediately
      setIsContentVisible(true);
    }
  }, [user, isLoading, navigate]);

  // Simplified loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Always use content-fade-visible for instant display
  return user ? (
    <div className="content-fade content-fade-visible bg-background">
      {children}
    </div>
  ) : null;
}

// Optimized fade transition component for fast navigation
function PageFade({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();
  const prevLocationRef = useRef(location);
  
  useEffect(() => {
    // No initial delay, immediate visibility
    setIsVisible(true);
  }, []);
  
  // Handle location changes with minimal animation
  useEffect(() => {
    if (prevLocationRef.current !== location) {
      // Skip the fade out completely for faster navigation
      setIsVisible(true);
      prevLocationRef.current = location;
    }
  }, [location]);
  
  return (
    <div className="page-fade page-fade-visible">
      {children}
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Immediately redirect from login page if already authenticated
  useEffect(() => {
    if (user && location === "/login") {
      navigate("/", { replace: true });
    }
  }, [user, location, navigate]);

  // Optimize the suspense fallback to match the background color
  return (
    <div className="page-container bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        {/* Skip PageFade for faster navigation */}
        <Switch>
          <Route path="/login" component={Login} />
          
          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/exams">
            <ProtectedRoute>
              <Exams />
            </ProtectedRoute>
          </Route>
          
          <Route path="/students">
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          </Route>
          
          <Route path="/results">
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
