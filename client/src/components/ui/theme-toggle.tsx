import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useTheme, useThemeDetection } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const { isDark } = useThemeDetection();

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleTheme}
      className="flex items-center gap-2 w-full justify-center bg-opacity-10 hover:bg-opacity-20"
    >
      {isDark ? (
        <Sun className="h-[1rem] w-[1rem] text-amber-400" />
      ) : (
        <Moon className="h-[1rem] w-[1rem] text-indigo-400" />
      )}
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </Button>
  );
}
