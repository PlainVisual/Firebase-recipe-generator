
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

export function ThemeToggleButton() {
  // Initialize state from localStorage or default to 'light'
  // This ensures the button state matches the actual theme on hydration
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const localTheme = localStorage.getItem("theme") as Theme | null;
      if (localTheme) {
        return localTheme;
      }
    }
    return "light"; // Default theme
  });

  React.useEffect(() => {
    // Effect to apply the class and update localStorage when theme state changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);


  // Effect to set initial theme based on localStorage on component mount
  // This covers cases where localStorage might be set by another tab or previous session
  React.useEffect(() => {
    const localTheme = localStorage.getItem("theme") as Theme | null;
    if (localTheme) {
        setThemeState(localTheme); // This will trigger the above useEffect to apply class
    } else {
        // If no theme in localStorage, ensure 'light' is set and no 'dark' class
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        setThemeState("light");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  const toggleTheme = () => {
    setThemeState(prevTheme => (prevTheme === "dark" ? "light" : "dark"));
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
