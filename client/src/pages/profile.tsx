import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Upload } from "lucide-react";
import { PhotoGuidelines } from "@/components/photo-guidelines";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  profileImage: z.string().optional(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password is required" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Form types
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
    
  // Profile image update mutation
  const profileImageMutation = useMutation({
    mutationFn: async (base64Image: string) => {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileImage: base64Image }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the auth context
      setUser(data.user);
      
      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been updated successfully.",
      });
      
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your profile image.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setImageLoading(false);
    }
  });
  
  // Handle profile image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    setImageLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      
      // Update the form
      profileForm.setValue('profileImage', base64Image);
      
      // Call the mutation
      profileImageMutation.mutate(base64Image);
    };
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "There was a problem reading the image file.",
        variant: "destructive",
      });
      setImageLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      profileImage: user?.profileImage || "",
    },
  });
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user, profileForm]);

  // Notification form setup
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: user?.notificationPreferences?.email ?? true,
      smsNotifications: user?.notificationPreferences?.sms ?? false,
    },
  });
  
  // Update notification form when user data changes
  useEffect(() => {
    if (user?.notificationPreferences) {
      notificationForm.reset({
        emailNotifications: user.notificationPreferences.email,
        smsNotifications: user.notificationPreferences.sms
      });
    }
  }, [user, notificationForm]);

  // Password form setup
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          // Only include profileImage if it was changed
          ...(data.profileImage !== user?.profileImage ? { profileImage: data.profileImage } : {})
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the auth context
      setUser(data.user);
      
      // Show success message
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
      
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your profile.",
        variant: "destructive",
      });
    }
  });
  
  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };

  // Notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const response = await fetch('/api/users/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications: data.emailNotifications,
          smsNotifications: data.smsNotifications
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update notification settings');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // If user state needs to be updated with notification preferences
      if (user && data.notificationPreferences) {
        setUser({
          ...user,
          notificationPreferences: data.notificationPreferences
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
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    notificationMutation.mutate(data);
  };

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      
      // Reset the form
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
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
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };

  return (
    <AppShell title="Profile Settings">
      <Tabs defaultValue="view" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="view">View Profile</TabsTrigger>
          <TabsTrigger value="edit">Edit Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view">
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-6">
                <Avatar className="h-24 w-24 bg-primary text-2xl">
                  {user?.profileImage ? (
                    <AvatarImage src={user.profileImage} alt={user.name} />
                  ) : (
                    <AvatarFallback>{initials}</AvatarFallback>
                  )}
                </Avatar>
                
                <div className="space-y-2 text-center md:text-left">
                  <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold">{user?.name}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  
                  <div className="flex justify-center md:justify-start">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-none">
                      {user?.isAdmin ? "Administrator" : "User"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 space-y-6">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h4>
                      <p>{user?.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Email Address</h4>
                      <p>{user?.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Account Type</h4>
                      <p>{user?.isAdmin ? "Administrator" : "User"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="edit">
          {/* Profile Information Form */}
          <Card className="border shadow-sm mb-6">
            <CardContent className="p-6">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-6 mb-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 bg-primary text-2xl">
                        {user?.profileImage ? (
                          <AvatarImage src={user.profileImage} alt={user.name} />
                        ) : (
                          <AvatarFallback>{initials}</AvatarFallback>
                        )}
                      </Avatar>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageLoading || profileImageMutation.isPending}
                      >
                        {imageLoading || profileImageMutation.isPending ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg, image/png, image/gif, image/webp"
                        onChange={handleImageUpload}
                      />
                    </div>
                    
                    <div className="text-center md:text-left">
                      <p className="text-sm text-muted-foreground mb-1">
                        Upload a new profile picture
                      </p>
                      <div className="flex items-center space-x-1">
                        <PhotoGuidelines />
                      </div>
                    </div>
                  </div>
                  
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
                  
                  <Button type="submit" disabled={profileMutation.isPending}>
                    {profileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
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
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Email Notifications</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Receive exam submission notifications via email
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
                            Receive exam submission notifications via SMS
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
                  
                  <Button type="submit" disabled={notificationMutation.isPending}>
                    {notificationMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
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
                  
                  <Button type="submit" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}