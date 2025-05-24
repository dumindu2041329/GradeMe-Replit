import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, Search, Pencil, Trash2, Users } from "lucide-react";

// Define Student interface
interface Student {
  id: number;
  name: string;
  email: string;
  class: string;
  enrollmentDate: string;
  password?: string;
}

// Form schema for create/edit student
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  class: z.string().min(1, { message: "Class is required" }),
  password: z.string().optional(),
  enrollmentDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date",
  })
});

type StudentFormValues = z.infer<typeof formSchema>;

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Search students by name or email
  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return student.name.toLowerCase().includes(query) || 
           student.email.toLowerCase().includes(query) ||
           student.class.toLowerCase().includes(query);
  });

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const onCreateSubmit = async (data: StudentFormValues) => {
    try {
      // Validate that password is provided for new students
      if (!data.password || data.password.trim() === "") {
        toast({
          title: "Error",
          description: "Password is required when creating a new student",
          variant: "destructive",
        });
        return;
      }
      
      if (data.password.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }
      
      setIsSubmitting(true);
      
      const newStudent = await apiRequest<Student>("POST", "/api/students", data);
      console.log("Created student:", newStudent);
      
      toast({
        title: "Success",
        description: `Student "${newStudent.name}" created successfully`,
      });
      
      // Force refresh to get the latest data
      await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      
      // Reset the form and close the modal
      createForm.reset();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating student:", error);
      toast({
        title: "Error",
        description: "Failed to create student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onEditSubmit = async (data: StudentFormValues) => {
    if (!selectedStudent) return;
    
    try {
      // For edit, if password is provided, check length
      if (data.password && data.password.trim() !== "" && data.password.length < 6) {
        toast({
          title: "Error", 
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }
      
      setIsSubmitting(true);
      
      const updatedStudent = await apiRequest<Student>("PUT", `/api/students/${selectedStudent.id}`, data);
      console.log("Updated student:", updatedStudent);
      
      toast({
        title: "Success",
        description: `Student "${updatedStudent.name}" updated successfully`,
      });
      
      // Force refresh to get the latest data
      await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      
      setIsEditModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        title: "Error",
        description: "Failed to update student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onDeleteConfirm = async () => {
    if (!selectedStudent) return;
    
    try {
      setIsSubmitting(true);
      
      const result = await apiRequest<{success: boolean}>("DELETE", `/api/students/${selectedStudent.id}`);
      console.log("Delete student result:", result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Student "${selectedStudent.name}" deleted successfully`,
        });
        
        // Force refresh to get the latest data
        await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      }
      
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form for creating a new student
  const createForm = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      class: "",
      password: "",
      enrollmentDate: new Date().toISOString().split('T')[0],
    },
  });
  
  // Form for editing an existing student
  const editForm = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      class: "",
      password: "",
      enrollmentDate: new Date().toISOString().split('T')[0],
    },
  });
  
  // Check if we should open create modal from dashboard
  useEffect(() => {
    const shouldOpenModal = sessionStorage.getItem("openStudentCreateModal");
    if (shouldOpenModal === "true") {
      setIsCreateModalOpen(true);
      sessionStorage.removeItem("openStudentCreateModal");
    }
  }, []);

  // Reset edit form when selected student changes
  useEffect(() => {
    if (selectedStudent) {
      editForm.reset({
        name: selectedStudent.name,
        email: selectedStudent.email,
        class: selectedStudent.class,
        password: "",
        enrollmentDate: selectedStudent.enrollmentDate ? new Date(selectedStudent.enrollmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    }
  }, [selectedStudent, editForm]);

  return (
    <AppShell title="Students" sidebar="admin">
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
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Class</TableHead>
                <TableHead className="font-medium">Enrollment Date</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.enrollmentDate ? format(new Date(student.enrollmentDate), "MM/dd/yyyy") : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)} className="text-blue-500 hover:text-blue-400">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student)} className="text-red-500 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center p-8">
                      <Users className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No students found</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add your first student to get started.
                      </p>
                      <Button 
                        className="mt-4 bg-primary hover:bg-primary/90"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Create Student Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>
              Create a new student account in the system
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <Input placeholder="10A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Student"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <Input placeholder="10A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (leave blank to keep current)</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Student"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student <strong>{selectedStudent?.name}</strong> and remove all their associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
