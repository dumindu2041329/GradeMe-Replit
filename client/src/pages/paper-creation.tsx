import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileText, Edit2, Trash2, Search, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schemas
const examFormSchema = insertExamSchema.extend({
  description: z.string().optional(),
});

const questionFormSchema = z.object({
  question: z.string().min(1, "Question is required"),
  type: z.enum(["multiple_choice", "short_answer", "essay", "true_false"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  marks: z.number().min(1, "Marks must be at least 1"),
});

type ExamFormValues = z.infer<typeof examFormSchema>;
type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface Question {
  id: string;
  question: string;
  type: "multiple_choice" | "short_answer" | "essay" | "true_false";
  options?: string[];
  correctAnswer?: string;
  marks: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export default function PaperCreationPage() {
  const [match, params] = useRoute("/exams/:examId/paper");
  const examId = params?.examId ? parseInt(params.examId) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for UI
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch exam data
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      if (!examId) return null;
      const response = await apiRequest('GET', `/api/exams/${examId}`);
      return response as Exam;
    },
    enabled: !!examId,
  });

  // Fetch questions data
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['questions', examId],
    queryFn: async () => {
      if (!examId) return [];
      const response = await apiRequest('GET', `/api/questions/paper_${examId}_new`);
      return response as Question[];
    },
    enabled: !!examId,
  });

  // Forms
  const examForm = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      date: new Date(),
      duration: 60,
      totalMarks: 100,
      status: "upcoming",
      description: "",
    },
  });

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 1,
    },
  });

  // Update exam form when data loads
  useEffect(() => {
    if (exam) {
      examForm.reset({
        name: exam.name || "",
        subject: exam.subject || "",
        date: exam.date ? new Date(exam.date) : new Date(),
        duration: exam.duration || 60,
        totalMarks: exam.totalMarks || 100,
        status: exam.status || "upcoming",
        description: exam.description || "",
      });
    }
  }, [exam, examForm]);

  // Mutations
  const updateExamMutation = useMutation({
    mutationFn: async (data: ExamFormValues) => {
      if (!examId) throw new Error("Exam ID is required");
      return apiRequest("PUT", `/api/exams/${examId}`, data);
    },
    onSuccess: () => {
      toast({ title: "Exam updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setIsEditingExam(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating exam",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      if (!examId) throw new Error("Exam ID is required");
      return apiRequest("POST", `/api/questions`, {
        ...data,
        paperId: `paper_${examId}_new`,
        examId: examId,
        orderIndex: questions.length,
      });
    },
    onSuccess: () => {
      toast({ title: "Question created successfully" });
      queryClient.invalidateQueries({ queryKey: ['questions', examId] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      setEditingQuestion(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues & { id: string }) => {
      return apiRequest("PUT", `/api/questions/${data.id}`, {
        ...data,
        paperId: `paper_${examId}_new`,
        examId: examId,
      });
    },
    onSuccess: () => {
      toast({ title: "Question updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['questions', examId] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      setEditingQuestion(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      return apiRequest("DELETE", `/api/questions/${questionId}`, {
        paperId: `paper_${examId}_new`,
        examId: examId,
      });
    },
    onSuccess: () => {
      toast({ title: "Question deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['questions', examId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleExamSubmit = (data: ExamFormValues) => {
    updateExamMutation.mutate(data);
  };

  const handleQuestionSubmit = (data: QuestionFormValues) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ ...data, id: editingQuestion.id });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    questionForm.reset({
      question: question.question,
      type: question.type,
      options: question.options || ["", "", "", ""],
      correctAnswer: question.correctAnswer || "",
      marks: question.marks,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestionMutation.mutate(questionId);
  };

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!examId) {
    return (
      <AppShell title="Paper Creation">
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">No exam selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please select an exam to create or edit its paper.
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

  if (examLoading) {
    return (
      <AppShell title="Paper Creation">
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
      <AppShell title="Paper Creation">
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

  return (
    <AppShell title="Paper Creation">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Paper Creation</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage exam details and questions for {exam.name}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={exam.status === "active" ? "default" : "secondary"}>
              {exam.status}
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/exams")}
              size="sm"
              className="whitespace-nowrap"
            >
              Back to Exams
            </Button>
          </div>
        </div>

        {/* Exam Details Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exam Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingExam(!isEditingExam)}
                className="self-start sm:self-auto"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {isEditingExam ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditingExam ? (
              <Form {...examForm}>
                <form onSubmit={examForm.handleSubmit(handleExamSubmit)} className="space-y-4">
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

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditingExam(false)}
                      className="order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateExamMutation.isPending}
                      className="order-1 sm:order-2"
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
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{exam.description || "No description provided"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle>Questions ({questions.length})</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingQuestion(null);
                      questionForm.reset();
                    }} className="whitespace-nowrap w-full sm:w-auto">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto w-[calc(100vw-2rem)] sm:w-full">
                    <DialogHeader>
                      <DialogTitle>
                        {editingQuestion ? "Edit Question" : "Add New Question"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...questionForm}>
                      <form onSubmit={questionForm.handleSubmit(handleQuestionSubmit)} className="space-y-4">
                        <FormField
                          control={questionForm.control}
                          name="question"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter question" {...field} className="min-h-[80px]" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={questionForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="short_answer">Short Answer</SelectItem>
                                    <SelectItem value="essay">Essay</SelectItem>
                                    <SelectItem value="true_false">True/False</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={questionForm.control}
                            name="marks"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Marks</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter marks" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {questionForm.watch("type") === "multiple_choice" && (
                          <div className="space-y-2">
                            <FormLabel>Options</FormLabel>
                            {[0, 1, 2, 3].map((index) => (
                              <FormField
                                key={index}
                                control={questionForm.control}
                                name={`options.${index}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        placeholder={`Option ${String.fromCharCode(65 + index)}`} 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        )}

                        {questionForm.watch("type") === "multiple_choice" && (
                          <FormField
                            control={questionForm.control}
                            name="correctAnswer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Correct Answer</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select correct answer" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {questionForm.watch("options")?.map((option, index) => (
                                      option && (
                                        <SelectItem key={index} value={option}>
                                          {String.fromCharCode(65 + index)}. {option}
                                        </SelectItem>
                                      )
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {questionForm.watch("type") === "true_false" && (
                          <FormField
                            control={questionForm.control}
                            name="correctAnswer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Correct Answer</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select correct answer" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="True">True</SelectItem>
                                    <SelectItem value="False">False</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsQuestionDialogOpen(false)}
                            className="order-2 sm:order-1"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                            className="order-1 sm:order-2"
                          >
                            {editingQuestion ? "Update Question" : "Add Question"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="text-center py-8">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  {searchTerm ? "No questions found" : "No questions yet"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm ? "Try adjusting your search term" : "Start by adding your first question"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <Card key={question.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {question.type.replace("_", " ")}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {question.marks} marks
                            </Badge>
                          </div>
                          <h4 className="font-medium mb-2 break-words">
                            Q{index + 1}. {question.question}
                          </h4>
                          {question.options && question.options.length > 0 && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="break-words">
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </div>
                              ))}
                            </div>
                          )}
                          {question.correctAnswer && (
                            <p className="text-sm text-green-600 mt-2 break-words">
                              <strong>Answer:</strong> {question.correctAnswer}
                            </p>
                          )}
                        </div>
                        <div className="flex w-full sm:w-auto gap-2 mt-3 sm:mt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                            className="flex-1 sm:flex-initial min-h-[40px]"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-initial min-h-[40px]">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md mx-4">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this question? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="order-2 sm:order-1">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 order-1 sm:order-2"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}