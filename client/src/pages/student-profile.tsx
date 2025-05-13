import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentHeader } from "@/components/layout/student-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

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
      {/* Header */}
      <StudentHeader />
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Student Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="border-primary/10 dark:border-primary/20 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user?.profileImage || ""} alt={user?.name || "Student"} />
                <AvatarFallback className="text-3xl">
                  {user?.name?.charAt(0) || "S"}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold">{profileData?.name || user?.name}</h2>
              <p className="text-muted-foreground">{profileData?.email || user?.email}</p>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 gap-4 w-full text-left">
                <div>
                  <Label className="text-muted-foreground">Student ID</Label>
                  <p className="text-foreground font-medium">#{profileData?.id || user?.studentId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Class</Label>
                  <p className="text-foreground font-medium">{profileData?.class || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Enrollment Date</Label>
                  <p className="text-foreground font-medium">{formattedEnrollmentDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Academic Information */}
          <Card className="border-primary/10 dark:border-primary/20 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>Your academic details and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Current Class</Label>
                  <p className="text-lg font-medium">{profileData?.class || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Student Since</Label>
                  <p className="text-lg font-medium">{formattedEnrollmentDate}</p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <h3 className="text-lg font-semibold mb-4">Academic Journey</h3>
              <div className="relative pl-6 border-l border-muted">
                <div className="mb-6 relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary"></div>
                  <p className="font-medium">Enrolled</p>
                  <p className="text-sm text-muted-foreground">{formattedEnrollmentDate}</p>
                </div>
                <div className="mb-6 relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary/70"></div>
                  <p className="font-medium">Current Semester</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}