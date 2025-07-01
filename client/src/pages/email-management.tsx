import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Mail, Send, TestTube, Users, User } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

interface Exam {
  id: number;
  name: string;
  subject: string;
  date: string;
  status: string;
  duration: number;
  totalMarks: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  class: string;
}

export default function EmailManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [sendingType, setSendingType] = useState<"bulk" | "individual">("bulk");
  const [showTestDialog, setShowTestDialog] = useState(false);

  // Fetch exams for reminder sending
  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    enabled: !!user,
  });

  // Fetch students for individual reminders
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testEmail: email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send test email");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test email",
      });
      setShowTestDialog(false);
      setTestEmail("");
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Test Email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Send exam reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async ({ examId, studentId }: { examId: number; studentId?: number }) => {
      const response = await fetch(`/api/email/upcoming-exam/${examId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentId ? { studentId } : {}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reminder");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminder Sent Successfully",
        description: data.message,
      });
      // Reset form
      setSelectedExam("");
      setSelectedStudent("");
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Reminder",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate(testEmail);
  };

  const handleSendReminder = () => {
    if (!selectedExam) {
      toast({
        title: "Exam Required",
        description: "Please select an exam to send reminders for",
        variant: "destructive",
      });
      return;
    }

    if (sendingType === "individual" && !selectedStudent) {
      toast({
        title: "Student Required",  
        description: "Please select a student for individual reminder",
        variant: "destructive",
      });
      return;
    }

    const examId = parseInt(selectedExam);
    const studentId = sendingType === "individual" ? parseInt(selectedStudent) : undefined;

    sendReminderMutation.mutate({ examId, studentId });
  };

  const upcomingExams = exams.filter(exam => exam.status === "upcoming");
  const activeExams = exams.filter(exam => exam.status === "active");

  return (
    <AppShell title="Email Management" sidebar="admin">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Email Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Email Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Test Email Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a test email to verify your SendGrid configuration is working correctly.
            </p>
            
            <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <TestTube className="mr-2 h-4 w-4" />
                  Send Test Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Test Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="testEmail">Email Address</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      placeholder="Enter email address to test"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleTestEmail}
                    disabled={testEmailMutation.isPending}
                  >
                    {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Exam Reminder Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Send Exam Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send upcoming exam reminders to students via email.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="sendingType">Sending Type</Label>
                <Select value={sendingType} onValueChange={(value: "bulk" | "individual") => setSendingType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bulk">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Send to All Students</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="individual">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Send to Individual Student</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="examSelect">Select Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {upcomingExams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{exam.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {exam.subject}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                    {activeExams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{exam.name}</span>
                          <Badge variant="default" className="ml-2">
                            Active
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {sendingType === "individual" && (
                <div>
                  <Label htmlFor="studentSelect">Select Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          <div className="flex flex-col">
                            <span>{student.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {student.email} • Class {student.class}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleSendReminder}
                disabled={sendReminderMutation.isPending}
                className="w-full"
              >
                {sendReminderMutation.isPending ? (
                  "Sending Reminders..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {sendingType === "bulk" ? "Send to All Students" : "Send to Selected Student"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notification Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How Email Notifications Work:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• <strong>Automatic Result Emails:</strong> Sent automatically when students complete exams</li>
              <li>• <strong>Manual Reminders:</strong> Send upcoming exam reminders using the form above</li>
              <li>• <strong>Student Preferences:</strong> Students can control their email preferences in their profile</li>
              <li>• <strong>Admin Notifications:</strong> You can control your email preferences in your profile settings</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>
    </AppShell>
  );
}