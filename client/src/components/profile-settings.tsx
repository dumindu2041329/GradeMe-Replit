import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowUpFromLine } from 'lucide-react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';
import { PhotoGuidelines } from '@/components/photo-guidelines';

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  profileImage: z.any().optional(),
  // Student-specific fields removed - now read-only
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(false),
  smsNotifications: z.boolean().default(false),
  emailExamResults: z.boolean().default(false),
  emailUpcomingExams: z.boolean().default(false),
  smsExamResults: z.boolean().default(false),
  smsUpcomingExams: z.boolean().default(false),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  newPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  confirmPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

// Type definitions
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface ProfileSettingsProps {
  userRole: 'admin' | 'student';
  profileEndpoint?: string;
  notificationEndpoint?: string;
  passwordEndpoint?: string;
}

export function ProfileSettings({
  userRole,
  profileEndpoint = '/api/users/profile',
  notificationEndpoint = '/api/users/notifications',
  passwordEndpoint = '/api/users/password',
}: ProfileSettingsProps) {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  
  // State for showing/hiding passwords
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for profile image previewing
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.profileImage || null
  );
  
  // Define type for student profile data
  interface StudentProfile {
    id: number;
    name: string;
    email: string;
    class: string;
    enrollmentDate: string;
    password?: string;
  }

  // For student profile, fetch additional student data
  const { data: studentProfile, isLoading: isLoadingProfile } = useQuery<StudentProfile>({
    queryKey: ["/api/student/profile"],
    enabled: userRole === 'student' && !!user?.studentId,
  });
  
  // Initialize profile form with user data
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });
  
  // Update form values when student profile data is loaded
  React.useEffect(() => {
    if (studentProfile && userRole === 'student') {
      profileForm.setValue('name', studentProfile.name || user?.name || '');
      profileForm.setValue('email', studentProfile.email || user?.email || '');
    }
  }, [studentProfile, user, profileForm, userRole]);
  
  // Initialize notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: user?.emailNotifications || false,
      smsNotifications: user?.smsNotifications || false,
      emailExamResults: user?.emailExamResults || false,
      emailUpcomingExams: user?.emailUpcomingExams || false,
      smsExamResults: user?.smsExamResults || false,
      smsUpcomingExams: user?.smsUpcomingExams || false,
    },
  });
  
  // Initialize password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Handle profile image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
          profileForm.setValue('profileImage', file);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // Prepare the request body based on user role
      const requestBody = userRole === 'admin' 
        ? {
            // For admins, allow name and email updates
            name: data.name,
            email: data.email,
            profileImage: imagePreview
          } 
        : {
            // For students, only allow email updates
            // Name, class, and enrollment date can only be updated by admins
            name: data.name,  // Include name, even though server might not use it
            email: data.email,
            profileImage: imagePreview
          };
      
      console.log('Submitting profile update:', requestBody);
      
      // For file uploads, we'll add support later using FormData
      
      const response = await fetch(profileEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update error:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update user state with new profile data
      if (user) {
        setUser({
          ...user,
          name: data.name,
          email: data.email,
          profileImage: data.profileImage,
        });
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your profile.",
        variant: "destructive",
      });
    }
  });
  
  // Notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      // Prepare request body based on user role
      const requestBody = userRole === 'student' 
        ? {
            // For student role, send detailed notification preferences
            emailExamResults: data.emailExamResults,
            emailUpcomingExams: data.emailUpcomingExams,
            smsExamResults: data.smsExamResults,
            smsUpcomingExams: data.smsUpcomingExams,
          }
        : {
            // For admin role, just use the basic email/sms flags
            emailNotifications: data.emailNotifications,
            smsNotifications: data.smsNotifications,
          };
      
      const response = await fetch(notificationEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update notification settings');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update user state with notification preferences
      if (user) {
        setUser({
          ...user,
          emailNotifications: data.emailNotifications,
          smsNotifications: data.smsNotifications,
          emailExamResults: data.emailExamResults,
          emailUpcomingExams: data.emailUpcomingExams,
          smsExamResults: data.smsExamResults,
          smsUpcomingExams: data.smsUpcomingExams
        });
      }
      
      toast({
        title: "Settings Updated",
        description: "Your notification settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your notification settings.",
        variant: "destructive",
      });
    }
  });
  
  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await fetch(passwordEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear password form
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your password.",
        variant: "destructive",
      });
    }
  });
  
  // Form submit handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    notificationMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };
  
  return (
    <div className="space-y-6">
      {/* Profile Information Form */}
      <Card className="border shadow-sm mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">
            <span className="inline-flex items-center">
              <span className="mr-2">Personal Information</span>
            </span>
          </h3>
          
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-[#070b14] relative group">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-white">
                      {user?.name?.charAt(0) || 'U'}{user?.name?.split(' ')[1]?.charAt(0) || ''}
                    </span>
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="profile-image"
                      className="cursor-pointer"
                    >
                      <div className="rounded-full p-1 bg-black/30">
                        <ArrowUpFromLine className="h-5 w-5 text-white" />
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Upload a new profile picture
                  </p>
                  <div className="flex items-center justify-center space-x-1">
                    <PhotoGuidelines />
                  </div>
                </div>
              </div>
              
              {/* Full Name field - only visible to admins */}
              {userRole === 'admin' && (
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-row space-x-2">
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    if (userRole === 'student' && studentProfile) {
                      profileForm.reset({
                        email: studentProfile.email
                      });
                    } else if (userRole === 'admin' && user) {
                      profileForm.reset({
                        name: user.name || '',
                        email: user.email || ''
                      });
                      setImagePreview(user.profileImage || null);
                    }
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Notification Settings Form */}
      <Card className="border shadow-sm mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">
            <span className="inline-flex items-center">
              <span className="mr-2">Notification Settings</span>
            </span>
          </h3>
          
          <Form {...notificationForm}>
            <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
              {userRole === 'student' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Email Notifications</h4>
                      
                      <FormField
                        control={notificationForm.control}
                        name="emailExamResults"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel>Exam Results</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Receive notifications when exam results are available
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="emailUpcomingExams"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel>Upcoming Exams</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Receive reminders about upcoming exams
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">SMS Notifications</h4>
                      
                      <FormField
                        control={notificationForm.control}
                        name="smsExamResults"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel>Exam Results</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Receive notifications when exam results are available
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="smsUpcomingExams"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel>Upcoming Exams</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Receive reminders about upcoming exams
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {userRole === 'admin' && (
                <>
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Email Notifications</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Receive system notifications via email
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="smsNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>SMS Notifications</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Receive system notifications via SMS
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <div className="flex flex-row space-x-2">
                <Button type="submit" disabled={notificationMutation.isPending}>
                  {notificationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    if (userRole === 'student') {
                      notificationForm.reset({
                        emailExamResults: user?.emailExamResults || false,
                        emailUpcomingExams: user?.emailUpcomingExams || false,
                        smsExamResults: user?.smsExamResults || false,
                        smsUpcomingExams: user?.smsUpcomingExams || false,
                      });
                    } else if (userRole === 'admin') {
                      notificationForm.reset({
                        emailNotifications: user?.emailNotifications || false,
                        smsNotifications: user?.smsNotifications || false,
                      });
                    }
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Password Form */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">
            <span className="inline-flex items-center">
              <span className="mr-2">Change Password</span>
            </span>
          </h3>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showCurrentPassword ? "text" : "password"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showCurrentPassword ? "Hide" : "Show"} password
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? "text" : "password"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showNewPassword ? "Hide" : "Show"} password
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showConfirmPassword ? "Hide" : "Show"} password
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-row space-x-2">
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    passwordForm.reset({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}