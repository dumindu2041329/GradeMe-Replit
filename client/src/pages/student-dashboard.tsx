import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpenText, 
  Calendar, 
  Clock, 
  Award, 
  BarChart, 
  BookCheck, 
  Trophy, 
  ChevronRight 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

// Function to format date with day suffix (1st, 2nd, 3rd, etc.)
function formatDateWithSuffix(date: Date) {
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  return format(date, `MMMM d'${suffix}', yyyy`);
}

function getDaySuffix(day: number) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Grade badge component based on percentage
const GradeBadge = ({ percentage }: { percentage: number }) => {
  let color;
  let grade;

  if (percentage >= 90) {
    color = "bg-green-500";
    grade = "A";
  } else if (percentage >= 80) {
    color = "bg-green-400";
    grade = "B";
  } else if (percentage >= 70) {
    color = "bg-yellow-400";
    grade = "C";
  } else if (percentage >= 60) {
    color = "bg-orange-400";
    grade = "D";
  } else {
    color = "bg-red-500";
    grade = "F";
  }

  return (
    <Badge className={`${color} text-white font-bold text-sm`}>
      {grade}
    </Badge>
  );
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch student dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["/api/student/dashboard"],
    enabled: !!user?.studentId
  });

  if (isLoadingDashboard) {
    return (
      <AppShell title="Student Dashboard">
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="w-full h-12 bg-gray-200 animate-pulse rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full h-36 bg-gray-200 animate-pulse rounded-md" />
              <div className="w-full h-36 bg-gray-200 animate-pulse rounded-md" />
              <div className="w-full h-36 bg-gray-200 animate-pulse rounded-md" />
            </div>
            <div className="w-full h-64 bg-gray-200 animate-pulse rounded-md" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!dashboardData) {
    return (
      <AppShell title="Student Dashboard">
        <div className="p-6">
          <div className="text-center py-8">
            <h2 className="text-2xl font-semibold mb-2">Data Not Available</h2>
            <p className="text-muted-foreground">Unable to load dashboard data. Please try again later.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { 
    totalExams, 
    averageScore, 
    bestRank, 
    availableExams, 
    examHistory 
  } = dashboardData;

  return (
    <AppShell title="Student Dashboard">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">Here's an overview of your academic performance</p>
        </div>

        <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="exams">Upcoming Exams</TabsTrigger>
            <TabsTrigger value="history">Exam History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <BookOpenText className="mr-2 h-4 w-4" />
                    Total Exams Taken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalExams}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <BarChart className="mr-2 h-4 w-4" />
                    Average Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Math.round(averageScore)}%</div>
                  <Progress value={averageScore} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Trophy className="mr-2 h-4 w-4" />
                    Best Rank
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">#{bestRank}</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Next Exam Card */}
            {availableExams.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Next Exam</CardTitle>
                  <CardDescription>Prepare for your upcoming exams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-primary/10 p-3 rounded-full mr-4">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{availableExams[0].name}</h3>
                        <p className="text-muted-foreground">{availableExams[0].subject}</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatDateWithSuffix(new Date(availableExams[0].date))}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{availableExams[0].duration} minutes</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{availableExams[0].totalMarks} marks</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => setActiveTab("exams")}>
                    View All Upcoming Exams
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Recent Results */}
            {examHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Results</CardTitle>
                  <CardDescription>Your latest exam performances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {examHistory.slice(0, 3).map((result) => (
                      <div key={result.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center">
                          <div className="mr-4">
                            <GradeBadge percentage={result.percentage} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{result.exam.name}</h4>
                            <p className="text-muted-foreground text-sm">{result.exam.subject}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{result.score}/{result.exam.totalMarks}</div>
                          <div className="text-muted-foreground text-sm">{result.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("history")}>
                    View All Results
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Exams</CardTitle>
                <CardDescription>Be prepared for these upcoming exams</CardDescription>
              </CardHeader>
              <CardContent>
                {availableExams.length === 0 ? (
                  <div className="text-center py-12">
                    <BookCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Upcoming Exams</h3>
                    <p className="text-muted-foreground">You're all caught up! Check back later for new exams.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {availableExams.map((exam) => (
                      <div key={exam.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="mb-2 md:mb-0">
                            <h3 className="font-bold text-lg">{exam.name}</h3>
                            <p className="text-muted-foreground">{exam.subject}</p>
                          </div>
                          <Badge variant={exam.status === 'active' ? 'destructive' : 'outline'}>
                            {exam.status === 'active' ? 'Active' : 'Upcoming'}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex flex-col sm:flex-row gap-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{format(new Date(exam.date), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{exam.duration} minutes</span>
                          </div>
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{exam.totalMarks} marks</span>
                          </div>
                        </div>
                        {exam.status === 'active' && (
                          <div className="mt-4">
                            <Button className="w-full sm:w-auto">
                              Start Exam
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Exam History</CardTitle>
                <CardDescription>Review your past exam performances</CardDescription>
              </CardHeader>
              <CardContent>
                {examHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <BookCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Exam History</h3>
                    <p className="text-muted-foreground">You haven't taken any exams yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {examHistory.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center mb-2 md:mb-0">
                            <div className="mr-4">
                              <GradeBadge percentage={result.percentage} />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{result.exam.name}</h3>
                              <p className="text-muted-foreground">{result.exam.subject}</p>
                            </div>
                          </div>
                          <div className="text-lg font-bold">
                            {result.score}/{result.exam.totalMarks}
                            <span className="text-muted-foreground text-sm ml-2">({result.percentage}%)</span>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex flex-col sm:flex-row gap-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Taken on {format(new Date(result.submittedAt), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{result.exam.duration} minutes</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button variant="outline" className="w-full sm:w-auto">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}