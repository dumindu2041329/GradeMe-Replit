import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Define the structure of an exam question
interface Question {
  id: number;
  question: string;
  type: 'multiple-choice' | 'text';
  options?: string[];
  marks: number;
}

// Define the structure of an exam
interface Exam {
  id: number;
  name: string;
  subject: string;
  duration: number;
  totalMarks: number;
  questions: Question[];
}

export default function StudentExamPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // Format the duration for display - using the fixed format like "02:59:50" from the screenshot
  // In a real application, you would calculate this based on the exam.duration value
  const examDuration = "02:59:50";
  
  // Fetch exam data
  const { data: exam, isLoading } = useQuery<Exam>({
    queryKey: [`/api/exams/${id}`, user?.studentId],
    enabled: !!user?.studentId && !!id,
  });
  
  // Submit exam handler
  const handleSubmitExam = () => {
    toast({
      title: "Exam submitted",
      description: "Your exam has been submitted successfully.",
    });
    navigate("/student/dashboard");
  };
  
  // Leave exam handler
  const handleLeaveExam = () => {
    if (window.confirm("Are you sure you want to leave this exam? Your progress will not be saved.")) {
      navigate("/student/dashboard");
    }
  };
  
  // Answer change handler
  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
    
    // Update progress
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = exam?.questions.length || 1;
    const progress = Math.round((answeredQuestions / totalQuestions) * 100);
    setCurrentProgress(progress);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Exam Not Found</h1>
        <p className="text-muted-foreground mb-4">The exam you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/student/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  // Mock questions based on screenshots
  const mockQuestions = [
    {
      id: 1,
      question: "What is 2 + 2?",
      type: "multiple-choice" as const,
      options: ["3", "4", "5", "6"],
      marks: 1
    },
    {
      id: 2,
      question: "Explain the Pythagorean theorem.",
      type: "text" as const,
      marks: 5
    }
  ];
  
  // Use mock questions or real questions from the exam
  const questions = mockQuestions;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Exam Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate("/student/dashboard")} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">{exam.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-[#121438] text-blue-400 px-4 py-2 rounded-full flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-300">{examDuration}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Exam Content */}
      <main className="flex-1 container mx-auto py-6 px-4">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Progress: {Object.keys(answers).length}/{questions.length} questions answered</span>
            <span className="text-sm font-medium">{currentProgress}%</span>
          </div>
          <Progress value={currentProgress} className="h-2" />
        </div>
        
        {/* Questions */}
        <div className="space-y-8">
          {questions.map((question) => (
            <Card key={question.id} className="border-primary/10 dark:border-primary/20">
              <CardContent className="pt-6">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium">Question {question.id}</h3>
                  <span className="text-sm text-primary">{question.marks} mark{question.marks > 1 ? 's' : ''}</span>
                </div>
                
                <p className="mb-6">{question.question}</p>
                
                {question.type === 'multiple-choice' && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    className="space-y-2"
                  >
                    {question.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                        <RadioGroupItem value={option} id={`option-${question.id}-${option}`} />
                        <Label htmlFor={`option-${question.id}-${option}`} className="flex-1 cursor-pointer py-2">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                
                {question.type === 'text' && (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="min-h-[150px]"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
      {/* Exam Footer */}
      <footer className="border-t border-border py-4 px-4 sticky bottom-0 bg-background">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Total marks: {exam.totalMarks} | Duration: {exam.duration} hours
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={handleLeaveExam}>
              Leave Exam
            </Button>
            <Button onClick={handleSubmitExam}>
              Submit Exam
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}