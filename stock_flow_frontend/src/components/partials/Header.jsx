import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { LogOut, Package, Moon, Sun } from 'lucide-react';

function Header() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check if theme is saved in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = () => {
    localStorage.setItem('isAuthenticated', 'false');
    navigate('/login');
  };

  return (
    <>
      <header className=" bg-header border-header-border transition-colors duration-200">
        <div className="flex h-16 items-center px-4 justify-between">
          <div className="flex items-center">
            <Package className="h-6 w-6 mr-2 text-header-icon" />
            <h1 className="text-lg font-medium text-header-foreground">Stock Flow</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="rounded-full"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-header-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;