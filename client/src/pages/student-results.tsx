import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { StudentHeader } from "@/components/layout/student-header";
import { ResultWithDetails } from "@shared/schema";

export default function StudentResults() {
  const { user } = useAuth();

  // Fetch results for the student
  const { data: results, isLoading } = useQuery<ResultWithDetails[]>({
    queryKey: ["/api/student/results", user?.studentId],
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
          <h1 className="text-3xl font-bold">My Results</h1>
        </div>
        
        <Card className="border-primary/10 dark:border-primary/20">
          <CardHeader>
            <CardTitle>Exam History</CardTitle>
          </CardHeader>
          <CardContent>
            {(!results || results.length === 0) ? (
              <p className="text-muted-foreground text-center py-4">You haven't taken any exams yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.exam.name}</TableCell>
                      <TableCell>{result.exam.subject}</TableCell>
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