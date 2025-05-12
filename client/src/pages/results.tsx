import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { Download, BarChart2 } from "lucide-react";
import { ResultWithDetails } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Results() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: results = [], isLoading } = useQuery<ResultWithDetails[]>({
    queryKey: ["/api/results"],
  });

  const filteredResults = results.filter((result) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      result.student?.name.toLowerCase().includes(query) ||
      result.exam?.name.toLowerCase().includes(query) ||
      result.exam?.subject.toLowerCase().includes(query)
    );
  });

  const handleExport = () => {
    try {
      // Generate CSV content
      const headers = ["Student", "Exam", "Score", "Percentage", "Date"];
      const csvContent = [
        headers.join(","),
        ...filteredResults.map((result) => {
          return [
            `"${result.student.name}"`,
            `"${result.exam.name}"`,
            result.score,
            `${result.percentage}%`,
            format(new Date(result.submittedAt), "yyyy-MM-dd"),
          ].join(",");
        }),
      ].join("\n");

      // Create blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `results-${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Results have been exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting results:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export results",
        variant: "destructive",
      });
    }
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-none">{percentage}%</Badge>;
    } else if (percentage >= 70) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-none">{percentage}%</Badge>;
    } else if (percentage >= 50) {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-none">{percentage}%</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-none">{percentage}%</Badge>;
    }
  };

  const columns = [
    {
      header: "Student",
      accessorKey: "student" as keyof ResultWithDetails,
      cell: (result: ResultWithDetails) => result.student.name,
    },
    {
      header: "Exam",
      accessorKey: "exam" as keyof ResultWithDetails,
      cell: (result: ResultWithDetails) => result.exam.name,
    },
    {
      header: "Score",
      accessorKey: "percentage" as keyof ResultWithDetails,
      cell: (result: ResultWithDetails) => getScoreBadge(result.percentage),
    },
    {
      header: "Date",
      accessorKey: "submittedAt" as keyof ResultWithDetails,
      cell: (result: ResultWithDetails) => format(new Date(result.submittedAt), "MM/dd/yyyy"),
    },
  ];

  return (
    <AppShell title="Results">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Results</h1>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
        </div>

        <SearchInput
          placeholder="Search results..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <DataTable
          columns={columns}
          data={filteredResults}
          isLoading={isLoading}
          emptyState={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <BarChart2 className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Results will appear here once exams are completed.
              </p>
            </div>
          }
        />
      </div>
    </AppShell>
  );
}
