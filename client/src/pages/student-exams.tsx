import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { StudentHeader } from "@/components/layout/student-header";
import { Exam } from "@shared/schema";

export default function StudentExams() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch all active and upcoming exams
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams/available"],
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
    <div className="min-h-screen bg-background">
      <StudentHeader />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Exams</h1>
        </div>
        
        <Card className="border-primary/10 dark:border-primary/20">
          <CardHeader>
            <CardTitle>Available Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {(!exams || exams.length === 0) ? (
              <p className="text-muted-foreground text-center py-4">No exams available at the moment.</p>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
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
      </main>
    </div>
  );
}