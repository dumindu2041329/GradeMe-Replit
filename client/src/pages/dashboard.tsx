import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, CheckCircle, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Exam } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data: exams, isLoading: isExamsLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

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
              <Card key={i} className="shadow">
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

      <Card className="shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Recent Exams</CardTitle>
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
                    <tr key={exam.id}>
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
