import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { PlusCircle, Pencil, Trash2, Users, Search } from "lucide-react";
import { Student } from "@shared/schema";
import { StudentModal } from "@/components/modals/student-modal";
import { format } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Search students only by name
  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return student.name.toLowerCase().includes(query);
  });

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      await apiRequest("DELETE", `/api/students/${selectedStudent.id}`);
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Student,
    },
    {
      header: "Email",
      accessorKey: "email" as keyof Student,
    },
    {
      header: "Class",
      accessorKey: "class" as keyof Student,
    },
    {
      header: "Enrollment Date",
      accessorKey: "enrollmentDate" as keyof Student,
      cell: (student: Student) => format(new Date(student.enrollmentDate), "MM/dd/yyyy"),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Student,
      cell: (student: Student) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)}>
            <Pencil className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Students">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Students</h1>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredStudents}
          isLoading={isLoading}
          emptyState={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first student to get started.
              </p>
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          }
        />
      </div>

      <StudentModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
      />

      {selectedStudent && (
        <StudentModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          student={selectedStudent}
          mode="edit"
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student "{selectedStudent?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStudent} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
