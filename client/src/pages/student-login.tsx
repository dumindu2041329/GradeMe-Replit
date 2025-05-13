import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const studentLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

type StudentLoginFormValues = z.infer<typeof studentLoginSchema>;

export default function StudentLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);

  const form = useForm<StudentLoginFormValues>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  
  // Check if user is already logged in
  useEffect(() => {
    if (user && user.role === "student") {
      setLoginSuccess(true);
    }
  }, [user]);

  const onSubmit = async (values: StudentLoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/student/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      toast({
        title: "Login successful",
        description: "You have successfully logged in",
      });
      
      // Set login success to display the success message
      setLoginSuccess(true);
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Student Login</CardTitle>
            <CardDescription>
              {loginSuccess 
                ? "You are currently logged in as a student"
                : "Enter your email and password to login"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loginSuccess ? (
              <>
                <Alert className="mb-4">
                  <AlertTitle>Successfully logged in</AlertTitle>
                  <AlertDescription>
                    Welcome back, {user?.name}. You have successfully logged into your student account.
                  </AlertDescription>
                </Alert>
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/auth/logout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                      });
                      
                      if (response.ok) {
                        toast({
                          title: "Logged out successfully",
                          description: "You have been signed out of your account",
                        });
                        setLoginSuccess(false);
                        // Force page reload to clear user state
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error("Logout error:", error);
                      toast({
                        variant: "destructive",
                        title: "Logout failed",
                        description: "There was a problem logging you out."
                      });
                    }
                  }}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="student@example.com" 
                              {...field} 
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button className="w-full" type="submit" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-4 text-center text-sm">
                  <a href="#" className="text-primary hover:underline">
                    Forgot your password?
                  </a>
                </div>
              </>
            )}
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col space-y-4 mt-4">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Are you an administrator? </span>
              <a href="/login" className="text-primary hover:underline">
                Login here
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}