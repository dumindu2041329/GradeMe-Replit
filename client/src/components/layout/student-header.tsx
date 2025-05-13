import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, GraduationCap, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface StudentHeaderProps {
  onMenuClick?: () => void;
}

export function StudentHeader({ onMenuClick }: StudentHeaderProps = {}) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      // Use the auth context's logout function to properly clear user state
      await logout();
      // Use setTimeout to ensure state updates before navigation
      setTimeout(() => {
        // Use replace: true to ensure back button doesn't return to dashboard
        navigate("/student/login", { replace: true });
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account",
        });
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-border px-4 flex items-center justify-between bg-background">
      <div className="md:hidden flex items-center gap-3">
        {onMenuClick && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="mr-1">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link href="/student/dashboard">
          <div className="flex items-center gap-2 cursor-pointer">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold text-primary">GradeMe</span>
          </div>
        </Link>
      </div>
      
      <div className="flex items-center gap-4 ml-auto">
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImage || undefined} alt={user?.name || 'User'} />
                <AvatarFallback>
                  {user?.name ? getInitials(user.name) : "S"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/student/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}