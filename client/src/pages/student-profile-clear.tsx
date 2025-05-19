import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentHeader } from "@/components/layout/student-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from 'react-helmet';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpFromLine, Calendar, Phone, MapPin, User, Users, X } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface StudentProfileData {
  id: number;
  name: string;
  email: string;
  class: string;
  enrollmentDate: string;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  profileImage?: string | null;
}

// Form schemas
const personalInfoSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }).optional(),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.date().optional().nullable(),
  class: z.string().optional(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
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

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function StudentProfileClear() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Profile View Tab
  const { data: profileData, isLoading } = useQuery<StudentProfileData>({
    queryKey: ["/api/student/profile"],
    enabled: !!user?.studentId,
  });

  // Form states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.profileImage || null
  );

  // Forms initialization
  const personalInfoForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      dateOfBirth: null,
      class: '',
      guardianName: '',
      guardianPhone: '',
    },
  });
  
  // Update form values when profile data loads
  React.useEffect(() => {
    if (profileData) {
      personalInfoForm.setValue('name', profileData.name || user?.name || '');
      personalInfoForm.setValue('email', profileData.email || user?.email || '');
      personalInfoForm.setValue('phone', profileData.phone || '');
      personalInfoForm.setValue('address', profileData.address || '');
      personalInfoForm.setValue('class', profileData.class || '');
      personalInfoForm.setValue('guardianName', profileData.guardianName || '');
      personalInfoForm.setValue('guardianPhone', profileData.guardianPhone || '');
      
      if (profileData.dateOfBirth) {
        personalInfoForm.setValue('dateOfBirth', new Date(profileData.dateOfBirth));
      }
      
      if (profileData.profileImage) {
        setImagePreview(profileData.profileImage);
      }
    }
  }, [profileData, user, personalInfoForm]);

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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Personal info mutation
  const personalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfoFormValues) => {
      const requestBody = {
        email: data.email,
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : null,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        profileImage: imagePreview
      };
      
      console.log('Submitting profile update:', requestBody);
      
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update user state with new profile data
      if (user) {
        setUser({
          ...user,
          email: data.email,
          profileImage: data.profileImage,
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
      
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
      const response = await fetch('/api/student/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      const response = await fetch('/api/auth/reset-password', {
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
  const onPersonalInfoSubmit = (data: PersonalInfoFormValues) => {
    personalInfoMutation.mutate(data);
  };
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    notificationMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Convert enrollmentDate to formatted date if it exists
  const formattedEnrollmentDate = profileData?.enrollmentDate 
    ? format(new Date(profileData.enrollmentDate), "MMMM dd, yyyy") 
    : "N/A";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Student Profile | Exam Management System</title>
        <meta name="description" content="View and update your student profile, manage notification settings and change your password." />
      </Helmet>
      
      {/* Header */}
      <StudentHeader />
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4">Profile Settings</h1>
        
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="view">View Profile</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          </TabsList>
          
          {/* View Profile Tab */}
          <TabsContent value="view">
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      {profileData?.profileImage ? (
                        <AvatarImage src={profileData.profileImage} alt={profileData.name} />
                      ) : (
                        <AvatarFallback className="text-2xl">
                          {profileData?.name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <h2 className="text-xl font-semibold">{profileData?.name}</h2>
                    <p className="text-muted-foreground text-sm">{profileData?.email}</p>
                    <p className="text-primary font-medium mt-1">Class {profileData?.class}</p>
                  </div>
                  
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Phone Number</h3>
                        <p>{profileData?.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Date of Birth</h3>
                        <p>{profileData?.dateOfBirth ? format(new Date(profileData.dateOfBirth), "MMMM dd, yyyy") : "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Guardian Name</h3>
                        <p>{profileData?.guardianName || "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Guardian Phone</h3>
                        <p>{profileData?.guardianPhone || "Not provided"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                        <p>{profileData?.address || "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Enrollment Date</h3>
                        <p>{formattedEnrollmentDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Edit Profile Tab */}
          <TabsContent value="edit">
            <Tabs defaultValue="personal" className="w-full space-y-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card className="border shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your personal details and contact information
                      </p>
                    </div>
                    
                    <Form {...personalInfoForm}>
                      <form id="studentPersonalInfoForm" onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                        {/* Profile Image */}
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
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-medium">Basic Information</h4>
                            
                            {/* Name (Read-only) */}
                            <FormField
                              control={personalInfoForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center">
                                    <FormLabel>Full Name</FormLabel>
                                    <span className="ml-1 text-xs text-muted-foreground">(Read-only)</span>
                                  </div>
                                  <FormControl>
                                    <Input {...field} disabled />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Email */}
                            <FormField
                              control={personalInfoForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center">
                                    <FormLabel>Email</FormLabel>
                                    <span className="ml-1 text-xs text-muted-foreground">(Read-only)</span>
                                  </div>
                                  <FormControl>
                                    <Input {...field} disabled />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Phone Number - CLEARABLE */}
                            <FormField
                              control={personalInfoForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <div className="flex items-center">
                                    <FormControl className="flex-1">
                                      <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                          className="pl-10" 
                                          value={field.value || ''} 
                                          onChange={(e) => field.onChange(e.target.value)}
                                        />
                                      </div>
                                    </FormControl>
                                    {field.value && (
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm" 
                                        className="ml-2" 
                                        onClick={() => field.onChange(null)}
                                      >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Clear</span>
                                      </Button>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Date of Birth */}
                            <FormField
                              control={personalInfoForm.control}
                              name="dateOfBirth"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Date of Birth</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={field.value || undefined}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                          date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-medium">School Information</h4>
                            
                            {/* Class (Read-only) */}
                            <FormField
                              control={personalInfoForm.control}
                              name="class"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center">
                                    <FormLabel>Class</FormLabel>
                                    <span className="ml-1 text-xs text-muted-foreground">(Read-only)</span>
                                  </div>
                                  <FormControl>
                                    <Input {...field} disabled />
                                  </FormControl>
                                  <FormDescription>
                                    Your class assignment can only be changed by an administrator
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Address - CLEARABLE */}
                            <FormField
                              control={personalInfoForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <div className="flex items-center">
                                    <FormControl className="flex-1">
                                      <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                          className="pl-10 min-h-[80px]" 
                                          value={field.value || ''} 
                                          onChange={(e) => field.onChange(e.target.value)}
                                        />
                                      </div>
                                    </FormControl>
                                    {field.value && (
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm" 
                                        className="ml-2" 
                                        onClick={() => field.onChange(null)}
                                      >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Clear</span>
                                      </Button>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Guardian Information */}
                            <h4 className="font-medium mt-6">Guardian Information</h4>
                            
                            {/* Guardian Name */}
                            <FormField
                              control={personalInfoForm.control}
                              name="guardianName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Guardian Name</FormLabel>
                                  <div className="flex items-center">
                                    <FormControl className="flex-1">
                                      <div className="relative">
                                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                          className="pl-10" 
                                          value={field.value || ''} 
                                          onChange={(e) => field.onChange(e.target.value)}
                                        />
                                      </div>
                                    </FormControl>
                                    {field.value && (
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm" 
                                        className="ml-2" 
                                        onClick={() => field.onChange(null)}
                                      >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Clear</span>
                                      </Button>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Guardian Phone */}
                            <FormField
                              control={personalInfoForm.control}
                              name="guardianPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Guardian Phone</FormLabel>
                                  <div className="flex items-center">
                                    <FormControl className="flex-1">
                                      <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                          className="pl-10" 
                                          value={field.value || ''} 
                                          onChange={(e) => field.onChange(e.target.value)}
                                        />
                                      </div>
                                    </FormControl>
                                    {field.value && (
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm" 
                                        className="ml-2" 
                                        onClick={() => field.onChange(null)}
                                      >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Clear</span>
                                      </Button>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-4 pt-4">
                          <div className="bg-muted/50 p-4 rounded-md flex flex-col md:flex-row items-center justify-between">
                            <div className="flex items-center space-x-3 mb-3 md:mb-0">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <ArrowUpFromLine className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Reset all form data</h4>
                                <p className="text-muted-foreground text-xs">Clear all fields and start fresh</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex items-center space-x-2 bg-background"
                              onClick={() => {
                                // Reset form fields to empty values
                                Object.keys(personalInfoForm.getValues()).forEach(key => {
                                  if (key === 'name') {
                                    personalInfoForm.setValue('name', user?.name || '');
                                  }
                                  else if (key === 'email') {
                                    personalInfoForm.setValue('email', user?.email || '');
                                  }
                                  else if (key === 'class') {
                                    personalInfoForm.setValue('class', '');
                                  }
                                  else if (key === 'dateOfBirth') {
                                    personalInfoForm.setValue('dateOfBirth', null);
                                  }
                                  else {
                                    // For phone, address, guardian name/phone
                                    personalInfoForm.setValue(key as any, '');
                                  }
                                });
                                
                                // Show feedback toast
                                toast({
                                  title: "Form Reset",
                                  description: "All form fields have been reset to empty values.",
                                });
                              }}
                            >
                              <X className="h-4 w-4 mr-1" /> Reset All Fields
                            </Button>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <input 
                              type="reset" 
                              value="Reset" 
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
                            />
                            <Button type="submit" disabled={personalInfoMutation.isPending}>
                              {personalInfoMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <Card className="border shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">Notification Preferences</h3>
                      <p className="text-sm text-muted-foreground">
                        Control how and when you receive notifications
                      </p>
                    </div>
                    
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">Email Notifications</h4>
                            
                            <FormField
                              control={notificationForm.control}
                              name="emailNotifications"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Email Notifications
                                    </FormLabel>
                                    <FormDescription>
                                      Receive all notifications via email
                                    </FormDescription>
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
                              name="emailExamResults"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel>Exam Results</FormLabel>
                                    <FormDescription>
                                      Receive notifications when exam results are available
                                    </FormDescription>
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
                        
                        <div className="flex justify-end space-x-2 pt-4">
                          <input 
                            type="reset" 
                            value="Reset" 
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
                          />
                          <Button type="submit" disabled={notificationMutation.isPending}>
                            {notificationMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card className="border shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">Security Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your password and account security
                      </p>
                    </div>
                    
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="font-medium">Change Password</h4>
                          
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
                          
                          <div className="pt-2">
                            <Button type="submit" disabled={passwordMutation.isPending}>
                              {passwordMutation.isPending ? "Updating..." : "Update Password"}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}