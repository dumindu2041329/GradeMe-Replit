import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentHeader } from "@/components/layout/student-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from 'react-helmet';
import { Card, CardContent } from "@/components/ui/card";
import { ProfileSettings } from "@/components/profile-settings";

interface StudentProfileData {
  id: number;
  name: string;
  email: string;
  class: string;
  enrollmentDate: string;
}

export default function StudentProfile() {
  const { user } = useAuth();

  // Fetch student profile data
  const { data: profileData, isLoading } = useQuery<StudentProfileData>({
    queryKey: ["/api/student/profile"],
    enabled: !!user?.studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Convert enrollmentDate to formatted date if it exists
  const formattedEnrollmentDate = profileData?.enrollmentDate 
    ? format(new Date(profileData.enrollmentDate), "MMMM dd, yyyy") 
    : "N/A";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Student Profile | Exam Management System</title>
        <meta name="description" content="View and update your student profile, manage notification settings and change your password." />
      </Helmet>
      
      {/* Header */}
      <StudentHeader />
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4">Profile Settings</h1>
        
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="view">View Profile</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          </TabsList>
          
          {/* View Profile Tab */}
          <TabsContent value="view" className="space-y-6">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center p-6 bg-slate-950 rounded-md text-white">
                  <Avatar className="h-24 w-24 mb-4 bg-slate-800">
                    <AvatarImage src={user?.profileImage || ""} alt={user?.name || "Student"} />
                    <AvatarFallback className="text-3xl">
                      {user?.name?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-semibold">{profileData?.name || user?.name}</h2>
                  <p className="text-slate-300">{profileData?.email || user?.email}</p>
                  <p className="text-sm text-slate-400 mt-1 bg-slate-800 px-3 py-1 rounded-full">Student</p>
                </div>
                
                <div className="mt-8 space-y-4">
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Class</h3>
                        <p>{profileData?.class || "N/A"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Enrollment Date</h3>
                        <p>{formattedEnrollmentDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Edit Profile Tab - Using the reusable ProfileSettings component */}
          <TabsContent value="edit">
            <ProfileSettings 
              userRole="student"
              profileEndpoint="/api/student/profile"
              notificationEndpoint="/api/student/notifications" 
              passwordEndpoint="/api/auth/reset-password"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}