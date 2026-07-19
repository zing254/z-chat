import { createContext, useContext, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('cyber-phantom');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'cyber-phantom' ? 'midnight' : 'cyber-phantom');
  }, []);

  const themeClass = theme === 'midnight' ? 'theme-midnight' : theme === 'ghost' ? 'theme-ghost' : '';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`${themeClass} h-full`}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}