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
import StudentDashboard from "@/pages/student-dashboard";
import StudentExams from "@/pages/student-exams";
import StudentResults from "@/pages/student-results";
import StudentExamPage from "@/pages/student-exam-page";
import StudentProfile from "@/pages/student-profile";

import { useEffect, useState, useRef, lazy, Suspense } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  // Always start visible for faster transitions
  const [isContentVisible, setIsContentVisible] = useState(true);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (!isLoading && user) {
      // User is allowed to access the requested page
      setIsContentVisible(true);
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

function ProtectedStudentRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  // Always start visible for faster transitions
  const [isContentVisible, setIsContentVisible] = useState(true);
  
  useEffect(() => {
    console.log("ProtectedStudentRoute - Current user:", user, "Location:", location);
    if (!isLoading) {
      if (!user) {
        console.log("ProtectedStudentRoute - No user, redirecting to student login");
        navigate("/student/login");
      } else if (user.role !== "student") {
        // User is not a student, redirect to student login
        console.log("ProtectedStudentRoute - User is not a student, redirecting to student login");
        navigate("/student/login");
      } else {
        // User is allowed to access the requested page
        console.log("ProtectedStudentRoute - User is a student, showing content");
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
  return user && user.role === "student" ? (
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
  
  // Redirect based on user role when already authenticated
  useEffect(() => {
    if (user) {
      // If on login page, redirect to appropriate dashboard
      if (location === "/login") {
        navigate("/", { replace: true });
      } 
      // If on student login page and user is a student, redirect to student dashboard
      else if (location === "/student/login" && user.role === "student") {
        navigate("/student/dashboard", { replace: true });
      }
      // If on student login page and user is an admin, redirect to admin dashboard
      else if (location === "/student/login" && user.role !== "student") {
        navigate("/", { replace: true });
      }
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
          {/* Admin routes */}
          <Route path="/login" component={Login} />
          <Route path="/reset-password" component={ResetPassword} />
          
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
          
          {/* Student routes */}
          <Route path="/student/login" component={StudentLogin} />
          
          <Route path="/student/dashboard">
            <ProtectedStudentRoute>
              <StudentDashboard />
            </ProtectedStudentRoute>
          </Route>
          
          <Route path="/student/exams">
            <ProtectedStudentRoute>
              <StudentExams />
            </ProtectedStudentRoute>
          </Route>
          
          <Route path="/student/results">
            <ProtectedStudentRoute>
              <StudentResults />
            </ProtectedStudentRoute>
          </Route>
          
          <Route path="/student/exam/:id">
            <ProtectedStudentRoute>
              <StudentExamPage />
            </ProtectedStudentRoute>
          </Route>
          
          <Route path="/student/profile">
            <ProtectedStudentRoute>
              <StudentProfile />
            </ProtectedStudentRoute>
          </Route>
          
          {/* Root student dashboard route - should be last in the student routes */}
          <Route path="/student">
            <ProtectedStudentRoute>
              <StudentDashboard />
            </ProtectedStudentRoute>
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
