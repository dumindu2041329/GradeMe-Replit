import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, BarChart2, Award, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { StudentHeader } from "@/components/layout/student-header";

interface DashboardData {
  totalExams: number;
  averageScore: number;
  bestRank: number;
  availableExams: Array<{
    id: number;
    name: string;
    subject: string;
    date: string;
    duration: number;
    totalMarks: number;
  }>;
  examHistory: Array<{
    id: number;
    exam: {
      name: string;
      totalMarks: number;
    };
    submittedAt: string;
    percentage: number;
    score: number;
    rank: number;
    totalParticipants: number;
  }>;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch student dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/student/dashboard", user?.studentId],
    enabled: !!user?.studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <StudentHeader />
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/10 dark:border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <span className="text-3xl font-bold">{dashboardData?.totalExams || 0}</span>
            </CardContent>
          </Card>
          
          <Card className="border-primary/10 dark:border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <span className="text-3xl font-bold">{dashboardData?.averageScore ? dashboardData.averageScore.toFixed(1) : '0'}%</span>
            </CardContent>
          </Card>
          
          <Card className="border-primary/10 dark:border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Best Rank</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <span className="text-3xl font-bold">{dashboardData?.bestRank || 0}</span>
            </CardContent>
          </Card>
        </div>
        
        {/* Available Exams */}
        <Card className="mb-8 border-primary/10 dark:border-primary/20">
          <CardHeader>
            <CardTitle>Available Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.availableExams?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No exams available at the moment.</p>
            ) : (
              <div className="space-y-4">
                {dashboardData?.availableExams?.map((exam) => (
                  <div 
                    key={exam.id} 
                    className="p-4 border border-border rounded-lg dark:bg-muted/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{exam.name}</h3>
                        <p className="text-sm text-muted-foreground">{exam.subject}</p>
                      </div>
                      <Button 
                        className="flex items-center gap-1" 
                        onClick={() => navigate(`/student/exam/${exam.id}`)}
                      >
                        Start Exam <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Date: {new Date(exam.date).toLocaleDateString()} | Duration: {exam.duration} minutes | Marks: {exam.totalMarks}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Exam History */}
        <Card className="border-primary/10 dark:border-primary/20">
          <CardHeader>
            <CardTitle>Exam History</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.examHistory?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No exam history available.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.examHistory?.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.exam.name}</TableCell>
                      <TableCell>{new Date(result.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={result.percentage} className="h-2 w-24" />
                          <span>{result.score}/{result.exam.totalMarks}</span>
                        </div>
                      </TableCell>
                      <TableCell>{result.rank || "-"} of {result.totalParticipants || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}