import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute, useLocation } from "wouter";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Plus, FileText, CheckCircle, Trash2, Edit2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Exam, ExamPaper, Question, insertExamPaperSchema, insertQuestionSchema } from "@shared/schema";

const paperSchema = insertExamPaperSchema.extend({
  title: z.string().min(2, "Title must be at least 2 characters"),
  instructions: z.string().optional(),
});

const questionSchema = insertQuestionSchema.extend({
  questionText: z.string().min(5, "Question text must be at least 5 characters"),
  marks: z.coerce.number().min(1, "Marks must be at least 1"),
  // Make MCQ options required when type is MCQ
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.string().optional(),
  expectedAnswer: z.string().optional(),
  answerGuidelines: z.string().optional(),
}).refine((data) => {
  if (data.type === "mcq") {
    return data.optionA && data.optionB && data.optionC && data.optionD && data.correctAnswer;
  }
  return true;
}, {
  message: "All options and correct answer are required for MCQ questions",
  path: ["optionA"]
});

type PaperFormValues = z.infer<typeof paperSchema>;
type QuestionFormValues = z.infer<typeof questionSchema>;

export default function PaperCreationPage() {
  const [match, params] = useRoute("/admin/exams/:examId/paper");
  const examId = params?.examId ? parseInt(params.examId) : null;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Fetch exam details
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ["/api/exams", examId],
    enabled: !!examId,
  });

  // Fetch or create paper for this exam
  const { data: paper, isLoading: paperLoading } = useQuery<ExamPaper>({
    queryKey: ["/api/papers", examId],
    enabled: !!examId,
  });

  // Fetch questions for this paper
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", paper?.id],
    enabled: !!paper?.id,
  });

  // Paper form
  const paperForm = useForm<PaperFormValues>({
    resolver: zodResolver(paperSchema),
    defaultValues: {
      examId: examId || 0,
      title: paper?.title || `${exam?.name} Question Paper`,
      instructions: paper?.instructions || "Read all questions carefully before answering.",
      totalQuestions: paper?.totalQuestions || 0,
      totalMarks: paper?.totalMarks || 0,
    },
  });

  // Question form
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      paperId: paper?.id || 0,
      type: "mcq",
      questionText: "",
      marks: 1,
      orderIndex: questions.length,
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      expectedAnswer: "",
      answerGuidelines: "",
    },
  });

  const selectedQuestionType = questionForm.watch("type");

  // Create or update paper
  const paperMutation = useMutation({
    mutationFn: async (data: PaperFormValues) => {
      if (paper?.id) {
        return apiRequest<ExamPaper>("PUT", `/api/papers/${paper.id}`, data);
      } else {
        return apiRequest<ExamPaper>("POST", "/api/papers", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Paper details saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/papers", examId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save paper details",
        variant: "destructive",
      });
    },
  });

  // Add question
  const addQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const questionData = {
        ...data,
        paperId: paper?.id || 0,
        orderIndex: questions.length,
      };
      return apiRequest<Question>("POST", "/api/questions", questionData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question added successfully",
      });
      questionForm.reset({
        paperId: paper?.id || 0,
        type: "mcq",
        questionText: "",
        marks: 1,
        orderIndex: questions.length + 1,
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
        expectedAnswer: "",
        answerGuidelines: "",
      });
      setIsCreatingQuestion(false);
      queryClient.invalidateQueries({ queryKey: ["/api/questions", paper?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/papers", examId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive",
      });
    },
  });

  // Delete question
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return apiRequest("DELETE", `/api/questions/${questionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions", paper?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/papers", examId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  const onPaperSubmit = (data: PaperFormValues) => {
    paperMutation.mutate(data);
  };

  const onQuestionSubmit = (data: QuestionFormValues) => {
    addQuestionMutation.mutate(data);
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  if (!match || !examId) {
    return <div>Invalid exam ID</div>;
  }

  if (examLoading || paperLoading) {
    return (
      <AppShell title="Create Question Paper">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading exam details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Create Question Paper">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Question Paper</h1>
            <p className="text-muted-foreground">
              {exam?.name} - {exam?.subject}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              {questions.length} Questions
            </Badge>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>

        {/* Paper Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Paper Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...paperForm}>
              <form onSubmit={paperForm.handleSubmit(onPaperSubmit)} className="space-y-4">
                <FormField
                  control={paperForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paper Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Mathematics Final Exam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={paperForm.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Read all questions carefully before answering..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={paperMutation.isPending}>
                  {paperMutation.isPending ? "Saving..." : "Save Paper Details"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Questions ({questions.length})
              </span>
              <Button
                onClick={() => setIsCreatingQuestion(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Questions */}
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={question.type === "mcq" ? "default" : "secondary"}>
                        {question.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Question {index + 1} • {question.marks} marks
                      </span>
                    </div>
                    <p className="font-medium">{question.questionText}</p>
                    
                    {question.type === "mcq" && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>A) {question.optionA}</div>
                        <div>B) {question.optionB}</div>
                        <div>C) {question.optionC}</div>
                        <div>D) {question.optionD}</div>
                        <div className="col-span-2 text-green-600 font-medium">
                          Correct: {question.correctAnswer}
                        </div>
                      </div>
                    )}
                    
                    {question.type === "written" && question.answerGuidelines && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Guidelines:</strong> {question.answerGuidelines}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingQuestion(question)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={deleteQuestionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No questions added yet</p>
                <p className="text-sm">Click "Add Question" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Question Form */}
        {isCreatingQuestion && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...questionForm}>
                <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={questionForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                              <SelectItem value="written">Written Answer</SelectItem>
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
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={questionForm.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your question here..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedQuestionType === "mcq" && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium">Multiple Choice Options</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={questionForm.control}
                            name="optionA"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Option A</FormLabel>
                                <FormControl>
                                  <Input placeholder="Option A" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={questionForm.control}
                            name="optionB"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Option B</FormLabel>
                                <FormControl>
                                  <Input placeholder="Option B" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={questionForm.control}
                            name="optionC"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Option C</FormLabel>
                                <FormControl>
                                  <Input placeholder="Option C" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={questionForm.control}
                            name="optionD"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Option D</FormLabel>
                                <FormControl>
                                  <Input placeholder="Option D" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
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
                                  <SelectItem value="A">Option A</SelectItem>
                                  <SelectItem value="B">Option B</SelectItem>
                                  <SelectItem value="C">Option C</SelectItem>
                                  <SelectItem value="D">Option D</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {selectedQuestionType === "written" && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium">Written Answer Details</h4>
                        
                        <FormField
                          control={questionForm.control}
                          name="expectedAnswer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Answer (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide a model answer or key points..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={questionForm.control}
                          name="answerGuidelines"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Answer Guidelines (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide guidelines for marking this answer..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={addQuestionMutation.isPending}>
                      {addQuestionMutation.isPending ? "Adding..." : "Add Question"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreatingQuestion(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Paper Creation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel creating this question paper? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Working</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate("/exams")}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}