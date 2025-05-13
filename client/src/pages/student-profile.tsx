import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Bell } from "lucide-react";
import { StudentHeader } from "@/components/layout/student-header";

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("view");
  
  // Form state
  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState(user?.name || "");
  
  const [emailNotifications, setEmailNotifications] = useState({
    examResults: true,
    upcomingExams: true,
  });
  
  const [smsNotifications, setSmsNotifications] = useState({
    examResults: false,
    upcomingExams: false,
  });
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Save changes handler
  const handleSaveChanges = () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would typically make an API call to update the user's profile
    // For this example, we'll just show a success toast
    
    toast({
      title: "Settings saved",
      description: "Your profile settings have been updated successfully.",
    });
    
    // In a real implementation, you would update the user context after a successful API call
  };
  
  // Update state when user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setFullName(user.name || "");
    }
  }, [user]);
  
  // Change password handler
  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    
    // Reset password fields
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StudentHeader />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        
        <Tabs defaultValue="view" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="view" className="text-base">View Profile</TabsTrigger>
            <TabsTrigger value="edit" className="text-base">Edit Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 overflow-hidden">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={user.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-4xl font-bold text-primary">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{fullName}</h2>
                  <p className="text-muted-foreground">{email}</p>
                  <div className="mt-2 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    Student
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 overflow-hidden">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={user.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-4xl font-bold text-primary">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="flex items-center text-lg font-semibold mb-4">
                    <Bell className="mr-2 h-5 w-5" />
                    Notification Settings
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Email Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Exam Results</p>
                            <p className="text-sm text-muted-foreground">Get notified when exam results are published</p>
                          </div>
                          <Switch
                            checked={emailNotifications.examResults}
                            onCheckedChange={(checked) => 
                              setEmailNotifications(prev => ({ ...prev, examResults: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Upcoming Exams</p>
                            <p className="text-sm text-muted-foreground">Get notified about upcoming exams</p>
                          </div>
                          <Switch
                            checked={emailNotifications.upcomingExams}
                            onCheckedChange={(checked) => 
                              setEmailNotifications(prev => ({ ...prev, upcomingExams: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">SMS Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Exam Results</p>
                            <p className="text-sm text-muted-foreground">Get SMS alerts when exam results are published</p>
                          </div>
                          <Switch
                            checked={smsNotifications.examResults}
                            onCheckedChange={(checked) => 
                              setSmsNotifications(prev => ({ ...prev, examResults: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Upcoming Exams</p>
                            <p className="text-sm text-muted-foreground">Get SMS alerts about upcoming exams</p>
                          </div>
                          <Switch
                            checked={smsNotifications.upcomingExams}
                            onCheckedChange={(checked) => 
                              setSmsNotifications(prev => ({ ...prev, upcomingExams: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-6" 
                    onClick={handleSaveChanges}
                    variant="default"
                  >
                    Save Changes
                  </Button>
                </div>
                
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      variant="default"
                      onClick={handleChangePassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}