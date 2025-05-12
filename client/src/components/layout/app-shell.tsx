import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { DialogTitle } from "@/components/ui/dialog";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  // Close sidebar when switching to desktop view
  useEffect(() => {
    if (!isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile, isMobileSidebarOpen]);

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar className="h-screen hidden md:flex" />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile sidebar with sheet component - positioned absolutely over content */}
        <Sheet 
          open={isMobileSidebarOpen} 
          onOpenChange={setIsMobileSidebarOpen}
          modal={false}
        >
          <SheetContent 
            side="left" 
            closeButton={false}
            className="w-64 p-0 flex flex-col shadow-xl animate-slide-in border-r border-sidebar-border !opacity-100 mobile-sidebar"
            style={{ 
              backgroundColor: "hsl(224, 71%, 4%)", /* Hard-coded background color value */
              backgroundImage: "none",
              opacity: 1,
              backdropFilter: "none",
              position: "fixed",
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: 100
            }}
          >
            <Button 
              className="absolute right-3 top-3 z-50 rounded-full size-8 p-0" 
              variant="outline"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
            <DialogTitle className="sr-only">Navigation menu</DialogTitle>
            <Sidebar 
              className="h-full flex" 
              onItemClick={closeMobileSidebar} 
            />
          </SheetContent>
        </Sheet>
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full hover:bg-secondary transition-all"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
