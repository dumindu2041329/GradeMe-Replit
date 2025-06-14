import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, BarChart2, Award, ArrowRight, TrendingUp, Target, Calendar, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { StudentHeader } from "@/components/layout/student-header";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts";
import { Badge } from "@/components/ui/badge";

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
        
        {/* Enhanced Stats cards with progress indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/10 dark:border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-950/20 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{dashboardData?.totalExams || 0}</span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/10 dark:border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 dark:bg-purple-950/20 p-3 rounded-full">
                  <BarChart2 className="h-6 w-6 text-purple-600 dark:text-purple-500" />
                </div>
                <span className="text-3xl font-bold">{dashboardData?.averageScore ? dashboardData.averageScore.toFixed(1) : '0'}%</span>
              </div>
              <Progress value={dashboardData?.averageScore || 0} className="h-2" />
            </CardContent>
          </Card>
          
          <Card className="border-primary/10 dark:border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Best Rank</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="bg-amber-100 dark:bg-amber-950/20 p-3 rounded-full">
                <Award className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{dashboardData?.bestRank || '-'}</span>
                {dashboardData?.examHistory && dashboardData.examHistory.length > 0 && dashboardData.examHistory[0].totalParticipants && (
                  <span className="text-xs text-muted-foreground">of {dashboardData.examHistory[0].totalParticipants}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 dark:border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progress Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-950/20 p-3 rounded-full">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
                <span className="text-3xl font-bold">
                  {dashboardData?.averageScore && dashboardData.averageScore >= 80 ? '🎯' : 
                   dashboardData?.averageScore && dashboardData.averageScore >= 70 ? '📈' : '💪'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {dashboardData?.averageScore && dashboardData.averageScore >= 80 ? 'Target Achieved!' : 
                 dashboardData?.averageScore && dashboardData.averageScore >= 70 ? 'Almost There!' : 'Keep Going!'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend Chart */}
          <Card className="border-primary/10 dark:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.examHistory && dashboardData.examHistory.length > 0 ? (
                <ChartContainer
                  config={{
                    percentage: {
                      label: "Score %",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <AreaChart
                    data={dashboardData.examHistory
                      .slice()
                      .reverse()
                      .map((exam, index) => ({
                        exam: `Exam ${index + 1}`,
                        percentage: exam.percentage,
                        name: exam.exam.name.length > 15 ? exam.exam.name.substring(0, 15) + '...' : exam.exam.name
                      }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="exam" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grade Distribution */}
          <Card className="border-primary/10 dark:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.examHistory && dashboardData.examHistory.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const gradeDistribution = dashboardData.examHistory.reduce((acc, exam) => {
                      let grade;
                      if (exam.percentage >= 90) grade = "A+";
                      else if (exam.percentage >= 80) grade = "A";
                      else if (exam.percentage >= 70) grade = "B";
                      else if (exam.percentage >= 60) grade = "C";
                      else if (exam.percentage >= 50) grade = "D";
                      else grade = "F";
                      
                      acc[grade] = (acc[grade] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    const total = dashboardData.examHistory.length;
                    const grades = ["A+", "A", "B", "C", "D", "F"];
                    const colors = ["bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-orange-500", "bg-red-400", "bg-red-600"];

                    return grades.map((grade, index) => {
                      const count = gradeDistribution[grade] || 0;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      
                      return (
                        <div key={grade} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Grade {grade}</span>
                            <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${colors[index]}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No grade data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Upcoming Exams with Enhanced Design */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-primary/10 dark:border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.availableExams?.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No exams scheduled at the moment.</p>
                    <p className="text-sm text-muted-foreground mt-2">Check back later for new assignments.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.availableExams?.map((exam) => {
                      const examDate = new Date(exam.date);
                      const isToday = examDate.toDateString() === new Date().toDateString();
                      const isUpcoming = examDate > new Date();
                      
                      return (
                        <div 
                          key={exam.id} 
                          className="p-6 border border-border rounded-lg hover:border-primary/30 transition-colors relative overflow-hidden group"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50"></div>
                          
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{exam.name}</h3>
                                {isToday && (
                                  <Badge variant="destructive" className="text-xs">
                                    Today
                                  </Badge>
                                )}
                                {isUpcoming && !isToday && (
                                  <Badge variant="secondary" className="text-xs">
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-medium">{exam.subject}</p>
                            </div>
                            <Button 
                              className="flex items-center gap-2 group-hover:scale-105 transition-transform" 
                              onClick={() => navigate(`/student/exam/${exam.id}`)}
                            >
                              <BookOpen className="h-4 w-4" />
                              Start Exam 
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{examDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{exam.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span>{exam.totalMarks} marks</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Personalized Recommendations */}
          <Card className="border-primary/10 dark:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Study Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData?.examHistory && dashboardData.examHistory.length > 0 ? (
                <>
                  {(() => {
                    const avgScore = dashboardData.averageScore || 0;
                    const recentExams = dashboardData.examHistory.slice(0, 3);
                    const improvementNeeded = avgScore < 75;
                    
                    return (
                      <>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2">Performance Insights</h4>
                          <div className="space-y-2 text-sm">
                            {avgScore >= 85 && (
                              <div className="flex items-center gap-2 text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Excellent performance! Keep it up!
                              </div>
                            )}
                            {avgScore >= 70 && avgScore < 85 && (
                              <div className="flex items-center gap-2 text-blue-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Good progress. Aim for 85%+
                              </div>
                            )}
                            {avgScore < 70 && (
                              <div className="flex items-center gap-2 text-orange-600">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                Focus on improvement areas
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium">Quick Tips</h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {improvementNeeded ? (
                              <>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Review previous exam topics</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Practice time management</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Focus on weak areas</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Maintain consistent study schedule</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Challenge yourself with harder topics</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Help classmates to reinforce learning</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Complete your first exam to get personalized recommendations!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
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
                  {dashboardData?.examHistory?.map((result) => {
                    // Calculate grade based on percentage
                    let grade;
                    if (result.percentage >= 90) grade = "A+";
                    else if (result.percentage >= 80) grade = "A";
                    else if (result.percentage >= 70) grade = "B";
                    else if (result.percentage >= 60) grade = "C";
                    else if (result.percentage >= 50) grade = "D";
                    else grade = "F";
                    
                    // Determine progress bar color based on percentage
                    let progressColor;
                    if (result.percentage >= 80) progressColor = "bg-green-500 dark:bg-green-600";
                    else if (result.percentage >= 70) progressColor = "bg-blue-500 dark:bg-blue-600";
                    else if (result.percentage >= 60) progressColor = "bg-amber-500 dark:bg-amber-600";
                    else if (result.percentage >= 50) progressColor = "bg-orange-500 dark:bg-orange-600";
                    else progressColor = "bg-red-500 dark:bg-red-600";
                    
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          <div>
                            {result.exam.name}
                            {/* Include subject if available in the data model */}
                            {'subject' in result.exam && (
                              <p className="text-xs text-muted-foreground">{(result.exam as any).subject}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(result.submittedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{result.percentage}%</span>
                              <span>{result.score}/{result.exam.totalMarks} marks</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${progressColor}`} 
                                style={{ width: `${result.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                              {result.rank} of {result.totalParticipants}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}