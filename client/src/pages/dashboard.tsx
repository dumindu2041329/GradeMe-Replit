import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users, BookOpen, CheckCircle, Calendar, Clock, PlusCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Exam } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { useLocation } from "wouter";
import SpeedTestWidget from "@/components/SpeedTestWidget";

interface Statistics {
  totalStudents: number;
  activeExams: number;
  completedExams: number;
  upcomingExams: number;
}

export default function Dashboard() {
  const { data: statistics, isLoading: isStatsLoading } = useQuery<Statistics>({
    queryKey: ["/api/statistics"],
  });

  const { data: exams = [], isLoading: isExamsLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });
  
  const [, navigate] = useLocation();

  const recentExams = exams
    ? [...exams]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    : [];

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-none">
            Upcoming
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-none">
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-none">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isStatsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border shadow">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Students"
              value={statistics?.totalStudents || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Active Exams"
              value={statistics?.activeExams || 0}
              icon={BookOpen}
              color="green"
            />
            <StatCard
              title="Completed Exams"
              value={statistics?.completedExams || 0}
              icon={CheckCircle}
              color="purple"
            />
            <StatCard
              title="Upcoming Exams"
              value={statistics?.upcomingExams || 0}
              icon={Calendar}
              color="yellow"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SpeedTestWidget />
        <Card className="shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Quick Actions - Exams</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-muted-foreground mb-4">
              Manage, create and schedule exams for students
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                className="flex gap-2"
                onClick={() => navigate("/exams")}
              >
                <BookOpen className="h-4 w-4" />
                View All Exams
              </Button>
              <Button
                className="flex gap-2 bg-primary hover:bg-primary/90"
                onClick={() => {
                  navigate("/exams");
                  // We'll need to trigger the create modal on the exams page
                  sessionStorage.setItem("openExamCreateModal", "true");
                }}
              >
                <PlusCircle className="h-4 w-4" />
                Create New Exam
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Quick Actions - Students</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-muted-foreground mb-4">
              Manage students, enrollment and view their progress
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                className="flex gap-2"
                onClick={() => navigate("/students")}
              >
                <Users className="h-4 w-4" />
                View All Students
              </Button>
              <Button
                className="flex gap-2 bg-primary hover:bg-primary/90"
                onClick={() => {
                  navigate("/students");
                  // We'll need to trigger the create modal on the students page
                  sessionStorage.setItem("openStudentCreateModal", "true");
                }}
              >
                <PlusCircle className="h-4 w-4" />
                Add New Student
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow">
        <CardHeader className="pb-2 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Exams</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-primary" 
            onClick={() => navigate("/exams")}
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isExamsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-1/5" />
                  <Skeleton className="h-5 w-1/5" />
                </div>
              ))}
            </div>
          ) : recentExams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 px-4 text-xs uppercase font-medium text-muted-foreground tracking-wider">
                      Exam Name
                    </th>
                    <th className="py-3 px-4 text-xs uppercase font-medium text-muted-foreground tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-4 text-xs uppercase font-medium text-muted-foreground tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentExams.map((exam) => (
                    <tr 
                      key={exam.id}
                      className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                      onClick={() => {
                        navigate("/exams");
                        // Open the edit modal for this exam when navigating
                        sessionStorage.setItem("editExamId", String(exam.id));
                      }}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">{exam.name}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {format(new Date(exam.date), "yyyy-MM-dd")}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStatusBadge(exam.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="mx-auto h-8 w-8 mb-2 text-muted-foreground/60" />
              <p>No exams found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
