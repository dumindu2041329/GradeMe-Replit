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
import { useEffect, useState, lazy, Suspense } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (!isLoading && user) {
      // Fade in the content when user is loaded
      const timer = setTimeout(() => {
        setIsContentVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? (
    <div className={`content-fade ${isContentVisible ? 'content-fade-visible' : ''}`}>
      {children}
    </div>
  ) : null;
}

// Fade transition component
function PageFade({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Set a small delay to allow for browser painting
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`page-fade ${isVisible ? 'page-fade-visible' : ''}`}>
      {children}
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Redirect from login page if already authenticated
  useEffect(() => {
    if (user && location === "/login") {
      navigate("/");
    }
  }, [user, location, navigate]);

  return (
    <div className="page-container">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <PageFade>
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
        </PageFade>
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
