import React from "react";
import { useLocation } from "wouter";

export default function StudentProfileFixed() {
  const [, navigate] = useLocation();

  // Automatically redirect to our improved profile page
  React.useEffect(() => {
    navigate("/student/profile-clear");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
