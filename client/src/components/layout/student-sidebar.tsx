import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavLink } from "@/components/ui/nav-link";
import { BookOpen, GraduationCap, LayoutDashboard, History, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StudentSidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export function StudentSidebar({ className, onItemClick }: StudentSidebarProps = {}) {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();

  const links = [
    {
      name: "Dashboard",
      href: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Available Exams",
      href: "/student/exams",
      icon: BookOpen,
    },
    {
      name: "Exam History",
      href: "/student/history",
      icon: History,
    },
    {
      name: "Profile",
      href: "/student/profile",
      icon: User,
    },
  ];

  const handleClick = () => {
    if (isMobile && onItemClick) {
      onItemClick();
    }
  };

  const goToHome = () => {
    navigate('/student/dashboard');
    handleClick();
  };

  return (
    <div className={cn(
      "w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col",
      className || "h-screen max-h-screen hidden md:flex"
    )}>
      <div className="h-16 min-h-16 flex items-center border-b border-sidebar-border px-6">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={goToHome}
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-primary">GradeMe</span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto sidebar-content" style={{ maxHeight: "calc(100vh - 4rem)" }}>
        <nav className="px-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.href}
                href={link.href}
                className="sidebar-link"
                activeClassName="active"
                onClick={handleClick}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto px-3 space-y-1">
          <Separator className="my-4 bg-sidebar-border" />
          
          <div className="w-full px-3 py-2">
            <ThemeToggle />
          </div>
          
          <NavLink
            href="/api/auth/logout"
            className="sidebar-link text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            onClick={(e) => {
              e.preventDefault();
              fetch('/api/auth/logout', { method: 'POST' })
                .then(() => navigate('/student/login'))
                .catch(err => console.error('Logout error:', err));
            }}
          >
            <span>Logout</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}