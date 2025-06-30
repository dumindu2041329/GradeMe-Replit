import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Mail, Send, Users, Calendar, TestTube } from "lucide-react";
import type { Exam } from "@shared/schema";

interface EmailResponse {
  success: boolean;
  message: string;
  emailsSent?: number;
  totalEmailsSent?: number;
}

export default function AdminEmailManagement() {
  const [sendingStates, setSendingStates] = useState<Record<number, boolean>>({});

  // Fetch all exams to show upcoming ones
  const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Filter upcoming exams
  const upcomingExams = exams?.filter(exam => exam.status === 'upcoming') || [];

  // Send upcoming exam reminder for specific exam
  const sendExamReminderMutation = useMutation({
    mutationFn: async (examId: number): Promise<EmailResponse> => {
      const response = await fetch(`/api/email/upcoming-exam/${examId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send exam reminders');
      }

      return response.json();
    },
    onMutate: (examId) => {
      setSendingStates(prev => ({ ...prev, [examId]: true }));
    },
    onSuccess: (data, examId) => {
      setSendingStates(prev => ({ ...prev, [examId]: false }));
      toast({
        title: "Email reminders sent!",
        description: data.message,
      });
    },
    onError: (error, examId) => {
      setSendingStates(prev => ({ ...prev, [examId]: false }));
      toast({
        title: "Failed to send email reminders",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Send bulk upcoming exam reminders
  const sendBulkRemindersMutation = useMutation({
    mutationFn: async (): Promise<EmailResponse> => {
      const response = await fetch('/api/email/upcoming-exams-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send bulk reminders');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk email reminders sent!",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send bulk reminders",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Test email service
  const testEmailMutation = useMutation({
    mutationFn: async (): Promise<EmailResponse> => {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Email service test failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email service test successful!",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Email service test failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (examsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading email management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Email Management</h1>
      </div>

      {/* Email Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Email Service Status</span>
          </CardTitle>
          <CardDescription>
            Test the email service to ensure it's working properly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => testEmailMutation.mutate()}
            disabled={testEmailMutation.isPending}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testEmailMutation.isPending ? 'Testing...' : 'Test Email Service'}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Email Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Bulk Email Actions</span>
          </CardTitle>
          <CardDescription>
            Send email notifications to all students at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Send All Upcoming Exam Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Sends reminder emails for all upcoming exams (1-3 days away) to students with notifications enabled
                </p>
              </div>
              <Button
                onClick={() => sendBulkRemindersMutation.mutate()}
                disabled={sendBulkRemindersMutation.isPending}
                className="ml-4"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendBulkRemindersMutation.isPending ? 'Sending...' : 'Send All'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Exam Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Upcoming Exam Reminders</span>
          </CardTitle>
          <CardDescription>
            Send reminder emails for specific upcoming exams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingExams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming exams found</p>
              <p className="text-sm">Create an exam with 'upcoming' status to send reminders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{exam.name}</h3>
                      <Badge variant="secondary">{exam.subject}</Badge>
                    </div>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        📅 {formatDate(exam.date)}
                        {exam.startTime && (
                          <span className="ml-2">
                            ⏰ {exam.startTime instanceof Date ? exam.startTime.toLocaleTimeString() : exam.startTime}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ⏱️ {exam.duration} minutes • 📊 {exam.totalMarks} marks
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => sendExamReminderMutation.mutate(exam.id)}
                    disabled={sendingStates[exam.id] || sendExamReminderMutation.isPending}
                    className="ml-4"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingStates[exam.id] ? 'Sending...' : 'Send Reminder'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notification Settings</CardTitle>
          <CardDescription>
            Information about how email notifications work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Automatic Email Notifications</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Exam result emails are sent automatically when students complete exams</li>
                <li>• Students receive personalized results with their score, rank, and performance feedback</li>
                <li>• Only students with email notifications enabled will receive emails</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Manual Email Reminders</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use the buttons above to send upcoming exam reminders manually</li>
                <li>• Bulk reminders target exams that are 1-3 days away</li>
                <li>• Individual reminders can be sent for any upcoming exam</li>
                <li>• Only students with exam reminder notifications enabled will receive them</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Student Settings</h4>
              <p className="text-sm text-muted-foreground">
                Students can manage their email notification preferences in their profile settings. 
                They can enable/disable exam results emails and upcoming exam reminders independently.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}