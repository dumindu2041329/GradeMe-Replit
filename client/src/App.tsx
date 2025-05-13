import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Exams from "@/pages/exams";
import Students from "@/pages/students";
import Results from "@/pages/results";
import Profile from "@/pages/profile";
import StudentLogin from "@/pages/student-login";

import { useEffect, useState, useRef, lazy, Suspense } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  // Always start visible for faster transitions
  const [isContentVisible, setIsContentVisible] = useState(true);
  
  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to appropriate login page based on the current path
      if (location.startsWith("/student")) {
        navigate("/student/login");
      } else {
        navigate("/login");
      }
    } else if (!isLoading && user) {
      // Check if student is trying to access admin pages
      const isStudentPath = location.startsWith("/student");
      const isStudentUser = user.role === "student";
      
      if (isStudentPath && !isStudentUser && location !== "/student/login") {
        // Admin trying to access student login page
        navigate("/");
      } else if (!isStudentPath && isStudentUser && location !== "/login" && location !== "/student/login") {
        // Student has logged in but student dashboard is removed, redirect to login
        navigate("/student/login");
      } else {
        // User is allowed to access the requested page
        setIsContentVisible(true);
      }
    }
  }, [user, isLoading, navigate, location]);

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
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/student/login" component={StudentLogin} />
          
          {/* Admin routes */}
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
          
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
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
