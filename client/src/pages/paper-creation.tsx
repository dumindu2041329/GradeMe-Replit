import { useState, useEffect } from "react";
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

  // Fetch existing paper for this exam
  const { data: paper, isLoading: isPaperLoading } = useQuery<ExamPaper>({
    queryKey: [`/api/papers/${examId}`],
    enabled: !!examId,
  });

  // Local state for questions (managed in frontend until paper update)
  const [localQuestions, setLocalQuestions] = useState<DbQuestion[]>([]);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DbQuestion | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Fetch questions for the paper only to initialize local state
  const { data: savedQuestions = [], isLoading: isQuestionsLoading } = useQuery<DbQuestion[]>({
    queryKey: [`/api/questions/${paper?.id}`],
    enabled: !!paper?.id,
  });

  // Initialize local questions from saved questions
  useEffect(() => {
    if (savedQuestions.length > 0) {
      setLocalQuestions(savedQuestions);
    }
  }, [savedQuestions]);

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
      optionA: undefined,
      optionB: undefined,
      optionC: undefined,
      optionD: undefined,
      correctAnswer: undefined,
      expectedAnswer: undefined,
      answerGuidelines: undefined,
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
  }, [paper, exam, paperForm]);

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
    if (confirm("Are you sure you want to delete this question?")) {
      setLocalQuestions(prev => prev.filter(q => q.id !== questionId));
      toast({
        title: "Success",
        description: "Question deleted (will be saved when you update paper details)",
      });
    }
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
                onClick={() => setIsCreatingQuestion(true)}
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
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
    </AppShell>
  );
}