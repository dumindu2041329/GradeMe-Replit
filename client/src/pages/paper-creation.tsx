import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute, useLocation } from "wouter";
import { Exam, insertExamSchema } from "@shared/schema";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Exam form schema for the 4-table structure
const examFormSchema = insertExamSchema.extend({
  description: z.string().optional(),
});

type ExamFormValues = z.infer<typeof examFormSchema>;

export default function PaperCreationPage() {
  const [match, params] = useRoute("/exams/:examId/paper");
  const examId = params?.examId ? parseInt(params.examId) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch exam data
  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      if (!examId) return null;
      const response = await apiRequest(`/api/exams/${examId}`);
      return response.data as Exam;
    },
    enabled: !!examId,
  });

  // Form for exam details
  const examForm = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      name: exam?.name || "",
      subject: exam?.subject || "",
      date: exam?.date ? new Date(exam.date) : new Date(),
      duration: exam?.duration || 60,
      totalMarks: exam?.totalMarks || 100,
      status: exam?.status || "upcoming",
      description: exam?.description || "",
    },
  });

  // Update exam mutation
  const updateExamMutation = useMutation({
    mutationFn: async (data: ExamFormValues) => {
      if (!examId) throw new Error("Exam ID is required");
      return apiRequest(`/api/exams/${examId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Exam updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating exam",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!examId) {
    return (
      <AppShell>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">No exam selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please select an exam to create or edit its details.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setLocation("/exams")}>
                    <Plus className="mr-2 h-4 w-4" />
                    View Exams
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">Loading exam details...</div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!exam) {
    return (
      <AppShell>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-foreground">Exam not found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The requested exam could not be found.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setLocation("/exams")}>
                    Back to Exams
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const onSubmit = (data: ExamFormValues) => {
    updateExamMutation.mutate(data);
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Details</h1>
            <p className="text-muted-foreground">
              Manage exam information and settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={exam.status === "active" ? "default" : "secondary"}>
              {exam.status}
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/exams")}
            >
              Back to Exams
            </Button>
          </div>
        </div>

        {/* Exam Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exam Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...examForm}>
                <form onSubmit={examForm.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={examForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter exam name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={examForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter subject" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={examForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter duration" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={examForm.control}
                      name="totalMarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Marks</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter total marks" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={examForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={examForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                              value={field.value instanceof Date ? 
                                field.value.toISOString().slice(0, 16) : 
                                field.value
                              }
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={examForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter exam description" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateExamMutation.isPending}
                    >
                      {updateExamMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{exam.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subject</label>
                    <p className="text-sm">{exam.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duration</label>
                    <p className="text-sm">{exam.duration} minutes</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Marks</label>
                    <p className="text-sm">{exam.totalMarks}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-sm">{new Date(exam.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm capitalize">{exam.status}</p>
                  </div>
                </div>
                {exam.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm">{exam.description}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}