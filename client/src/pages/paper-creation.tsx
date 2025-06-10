import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute, useLocation } from "wouter";
import { Exam, ExamPaper, Question as DbQuestion, insertExamPaperSchema, insertQuestionSchema } from "@shared/schema";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest } from "@/lib/queryClient";

// Use schemas from shared schema with extended validation
const paperFormSchema = insertExamPaperSchema.omit({ examId: true, totalQuestions: true, totalMarks: true }).extend({
  instructions: z.string().optional(),
});

const questionFormSchema = insertQuestionSchema.omit({ paperId: true, orderIndex: true }).extend({
  type: z.enum(["mcq", "written"]),
  marks: z.coerce.number().min(1, "Marks must be at least 1"),
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

type PaperFormValues = z.infer<typeof paperFormSchema>;
type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function PaperCreationPage() {
  const [match, params] = useRoute("/exams/:examId/paper");
  const examId = params?.examId ? parseInt(params.examId) : null;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch exam details to get the exam name
  const { data: exam } = useQuery<Exam>({
    queryKey: [`/api/exams/${examId}`],
    enabled: !!examId,
  });

  // Fetch existing paper for this exam with optimized refresh
  const { data: paper, isLoading: isPaperLoading } = useQuery<ExamPaper>({
    queryKey: [`/api/papers/${examId}`],
    enabled: !!examId,
    refetchInterval: 1000, // Automatically refresh every 1 second
    refetchIntervalInBackground: false, // Reduce background network usage
    staleTime: 500, // Cache for 500ms to reduce redundant calls
    gcTime: 30000, // Keep in cache for 30 seconds (updated from cacheTime)
  });

  // Local state for questions (managed in frontend until paper update)
  const [localQuestions, setLocalQuestions] = useState<DbQuestion[]>([]);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DbQuestion | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<DbQuestion | null>(null);
  
  // Ref for scrolling to question form
  const questionFormRef = useRef<HTMLDivElement>(null);

  // Fetch questions for the paper with optimized automatic refresh
  const { data: savedQuestions = [], isLoading: isQuestionsLoading, refetch: refetchQuestions } = useQuery<DbQuestion[]>({
    queryKey: [`/api/questions/${paper?.id}`],
    enabled: !!paper?.id,
    staleTime: 500, // Cache for 500ms to reduce redundant network calls
    gcTime: 30000, // Keep in cache for 30 seconds (updated from cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Reduce unnecessary refetches on focus
    refetchInterval: 1000, // Automatically refresh every 1 second (1000ms)
    refetchIntervalInBackground: false, // Optimize background performance
  });

  // Initialize local questions from saved questions and set up real-time updates
  useEffect(() => {
    if (savedQuestions && Array.isArray(savedQuestions)) {
      if (savedQuestions.length > 0) {
        setLocalQuestions(savedQuestions);
      } else if (savedQuestions.length === 0 && paper?.id) {
        // Reset local questions when navigating to a different paper
        setLocalQuestions([]);
      }
    }
  }, [savedQuestions, paper?.id]);

  // Force refresh questions when paper changes (remove examId dependency to prevent excessive calls)
  useEffect(() => {
    if (paper?.id) {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${paper.id}`] });
    }
  }, [paper?.id, queryClient]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (!paper?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected for real-time updates');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'questions_updated' || message.type === 'paper_updated') {
          console.log('Received update:', message.data);
          // Force refetch both paper and questions data
          queryClient.invalidateQueries({ queryKey: [`/api/papers/${examId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/questions/${paper.id}`] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [paper?.id, queryClient, examId]);

  // Paper form
  const paperForm = useForm<PaperFormValues>({
    resolver: zodResolver(paperFormSchema),
    defaultValues: {
      title: "",
      instructions: "",
    },
  });

  // Question form
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      type: "mcq",
      questionText: "",
      marks: 1,
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      expectedAnswer: "",
      answerGuidelines: "",
    },
  });

  // Update paper form when paper data is loaded
  useEffect(() => {
    if (paper) {
      paperForm.reset({
        title: paper.title,
        instructions: paper.instructions || "",
      });
    } else if (exam) {
      paperForm.reset({
        title: `${exam.name} Question Paper`,
        instructions: "Read all questions carefully before answering.",
      });
    }
  }, [paper?.id, exam?.id, paper?.title, exam?.name]); // Use specific properties to prevent infinite loop

  const selectedQuestionType = questionForm.watch("type");

  // Mutations for paper operations
  const createPaperMutation = useMutation({
    mutationFn: async (data: PaperFormValues) => {
      return apiRequest("POST", "/api/papers", {
        examId: examId!,
        title: data.title,
        instructions: data.instructions || "",
        totalQuestions: 0,
        totalMarks: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/papers/${examId}`] });
      toast({
        title: "Success",
        description: "Paper details saved successfully",
      });
      
      // Automatically reload the page after successful creation
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Wait 1 second to allow toast to be seen
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save paper details",
        variant: "destructive",
      });
    },
  });

  const updatePaperMutation = useMutation({
    mutationFn: async (data: PaperFormValues) => {
      // Update paper with all local questions
      return apiRequest("PUT", `/api/papers/${paper!.id}`, {
        title: data.title,
        instructions: data.instructions || "",
        questions: localQuestions.map(q => ({
          type: q.type,
          question: q.questionText,
          marks: q.marks,
          orderIndex: q.orderIndex,
          options: q.type === 'mcq' ? [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean) : undefined,
          correctAnswer: q.correctAnswer || q.expectedAnswer || null
        })),
        totalQuestions: localQuestions.length,
        totalMarks: localQuestions.reduce((sum, q) => sum + q.marks, 0)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/papers/${examId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${paper?.id}`] });
      toast({
        title: "Success",
        description: `Paper updated with ${localQuestions.length} questions saved to storage`,
      });
      
      // Automatically reload the page after successful update
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Wait 1 second to allow toast to be seen
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update paper details",
        variant: "destructive",
      });
    },
  });

  // Local question operations (no API calls until paper update)
  const addQuestionToLocal = (data: QuestionFormValues) => {
    const newQuestion: DbQuestion = {
      id: Date.now(), // Temporary ID for local state
      paperId: paper?.id || 0,
      type: data.type,
      questionText: data.questionText,
      marks: data.marks,
      orderIndex: localQuestions.length,
      optionA: data.optionA || null,
      optionB: data.optionB || null,
      optionC: data.optionC || null,
      optionD: data.optionD || null,
      correctAnswer: data.correctAnswer || null,
      expectedAnswer: data.expectedAnswer || null,
      answerGuidelines: data.answerGuidelines || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLocalQuestions(prev => [...prev, newQuestion]);
    questionForm.reset({
      type: "mcq",
      questionText: "",
      marks: 1,
      optionA: undefined,
      optionB: undefined,
      optionC: undefined,
      optionD: undefined,
      correctAnswer: undefined,
      expectedAnswer: undefined,
      answerGuidelines: undefined,
    });
    setIsCreatingQuestion(false);
    toast({
      title: "Success",
      description: "Question added to paper (will be saved when you update paper details)",
    });
  };



  const onPaperSubmit = (data: PaperFormValues) => {
    if (paper) {
      updatePaperMutation.mutate(data);
    } else {
      createPaperMutation.mutate(data);
    }
  };

  const onQuestionSubmit = (data: QuestionFormValues) => {
    if (editingQuestion) {
      updateQuestionLocal(editingQuestion.id, data);
    } else {
      addQuestionToLocal(data);
    }
  };

  const updateQuestionLocal = (questionId: number, data: QuestionFormValues) => {
    setLocalQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? {
            ...q,
            type: data.type,
            questionText: data.questionText,
            marks: data.marks,
            optionA: data.optionA || null,
            optionB: data.optionB || null,
            optionC: data.optionC || null,
            optionD: data.optionD || null,
            correctAnswer: data.correctAnswer || null,
            expectedAnswer: data.expectedAnswer || null,
            answerGuidelines: data.answerGuidelines || null,
            updatedAt: new Date(),
          }
        : q
    ));
    setEditingQuestion(null);
    questionForm.reset();
    toast({
      title: "Success",
      description: "Question updated (will be saved when you update paper details)",
    });
  };

  const handleDeleteQuestion = (questionId: number) => {
    const question = localQuestions.find(q => q.id === questionId);
    if (question) {
      setQuestionToDelete(question);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      setLocalQuestions(prev => prev.filter(q => q.id !== questionToDelete.id));
      toast({
        title: "Success",
        description: "Question deleted (will be saved when you update paper details)",
      });
      setIsDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const scrollToQuestionForm = () => {
    setTimeout(() => {
      questionFormRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleEditQuestion = (question: DbQuestion) => {
    setEditingQuestion(question);
    questionForm.reset({
      type: question.type,
      questionText: question.questionText,
      marks: question.marks,
      optionA: question.optionA || undefined,
      optionB: question.optionB || undefined,
      optionC: question.optionC || undefined,
      optionD: question.optionD || undefined,
      correctAnswer: question.correctAnswer || undefined,
      expectedAnswer: question.expectedAnswer || undefined,
      answerGuidelines: question.answerGuidelines || undefined,
    });
    setIsCreatingQuestion(true);
    scrollToQuestionForm();
  };

  if (!match || !examId) {
    return <div>Invalid exam ID</div>;
  }

  return (
    <AppShell title="Create Question Paper">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Question Paper</h1>
            <p className="text-muted-foreground">
              <span className="text-lg font-semibold text-primary block">
                {exam?.name || `Exam ${examId}`}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              {localQuestions.length} Questions
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
                Questions ({localQuestions.length})
              </span>
              <Button
                onClick={() => {
                  setIsCreatingQuestion(true);
                  scrollToQuestionForm();
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading state */}
            {isQuestionsLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading questions...</p>
              </div>
            )}
            
            {/* Existing Questions */}
            {!isQuestionsLoading && localQuestions.map((question: DbQuestion, index: number) => (
              <div key={`${question.id}-${question.updatedAt || Date.now()}`} className="border rounded-lg p-4 space-y-2 bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={question.type === "mcq" ? "default" : "secondary"}>
                        {question.type === "mcq" ? "MCQ" : question.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Question {index + 1} • {question.marks} marks
                      </span>
                    </div>
                    <p className="font-medium mb-3">{question.questionText}</p>
                    
                    {question.type === "mcq" && (
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-600">A)</span>
                          <span>{question.optionA}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-600">B)</span>
                          <span>{question.optionB}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-600">C)</span>
                          <span>{question.optionC}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-600">D)</span>
                          <span>{question.optionD}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <span className="text-green-600 font-medium">
                            Correct: {question.correctAnswer}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {question.type === "written" && question.answerGuidelines && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <strong className="text-foreground">Guidelines:</strong> 
                        <span className="text-muted-foreground ml-1">{question.answerGuidelines}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuestion(question)}
                      className="hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="hover:bg-red-50 hover:border-red-300 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {!isQuestionsLoading && localQuestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No questions added yet</p>
                <p className="text-sm">Click "Add Question" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Paper Details Button */}
        <div className="flex justify-center">
          <Button 
            onClick={paperForm.handleSubmit(onPaperSubmit)}
            disabled={createPaperMutation.isPending || updatePaperMutation.isPending}
            size="lg"
            className="min-w-48"
          >
            {createPaperMutation.isPending || updatePaperMutation.isPending ? "Saving..." : paper ? "Update Paper Details" : "Save Paper Details"}
          </Button>
        </div>

        {/* Add Question Form */}
        {isCreatingQuestion && (
          <Card ref={questionFormRef}>
            <CardHeader>
              <CardTitle>
                {editingQuestion ? "Update Existing Question" : "Add New Question"}
              </CardTitle>
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
                            <Input type="number" min="1" {...field} />
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={questionForm.control}
                          name="optionA"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Option A</FormLabel>
                              <FormControl>
                                <Input placeholder="First option" {...field} />
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
                                <Input placeholder="Second option" {...field} />
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
                                <Input placeholder="Third option" {...field} />
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
                                <Input placeholder="Fourth option" {...field} />
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
                                  <SelectValue placeholder="Select correct option" />
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
                    </>
                  )}
                  
                  {selectedQuestionType === "written" && (
                    <>
                      <FormField
                        control={questionForm.control}
                        name="expectedAnswer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Answer (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Sample answer or key points..."
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
                                placeholder="Guidelines for marking this question..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={!paper}
                    >
                      {editingQuestion 
                        ? "Update Question" 
                        : "Add Question"
                      }
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreatingQuestion(false);
                        setEditingQuestion(null);
                        questionForm.reset();
                      }}
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
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => navigate("/exams")}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              Delete Question?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Are you sure you want to delete this question? This action cannot be undone.</p>
              
              {questionToDelete && (
                <div className="p-3 bg-muted rounded-lg border-l-4 border-l-red-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={questionToDelete.type === "mcq" ? "default" : "secondary"} className="text-xs">
                      {questionToDelete.type.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {questionToDelete.marks} marks
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {questionToDelete.questionText}
                  </p>
                  {questionToDelete.type === "mcq" && questionToDelete.correctAnswer && (
                    <p className="text-xs text-green-600 mt-1">
                      Correct Answer: {questionToDelete.correctAnswer}
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuestionToDelete(null)}>
              Keep Question
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteQuestion}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}