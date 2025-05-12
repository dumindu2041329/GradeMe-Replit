import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavLink } from "@/components/ui/nav-link";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, GraduationCap, Home, BarChart2, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick }: SidebarProps = {}) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location === path;
  };

  const links = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      name: "Exams",
      href: "/exams",
      icon: BookOpen,
    },
    {
      name: "Students",
      href: "/students",
      icon: GraduationCap,
    },
    {
      name: "Results",
      href: "/results",
      icon: BarChart2,
    },
  ];

  const handleClick = () => {
    if (isMobile && onItemClick) {
      onItemClick();
    }
  };

  return (
    <div className={cn(
      "w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col",
      className || "h-screen hidden md:flex"
    )}>
      <div className="h-16 flex items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-primary">GradeMe</span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto sidebar-content">
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
          
          <Button
            variant="ghost"
            className="w-full justify-start font-normal h-10 hover:bg-sidebar-accent"
            onClick={async () => {
              await logout();
              handleClick();
            }}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
          
          <div className="w-full px-3 py-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
