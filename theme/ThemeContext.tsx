import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StorageHelper } from '../utils/storage';

export type ThemeType = 'light' | 'dark';
export type TextSizeType = 'small' | 'medium' | 'large';

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  textSize: TextSizeType;
  setTextSize: (size: TextSizeType) => void;
  textSizePx: number;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const PRIMARY_COLOR = '#8b5cf6'; // Vibrant purple

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [textSize, setTextSizeState] = useState<TextSizeType>('medium');

  useEffect(() => {
    (async () => {
      const settings = await StorageHelper.getSettings();
      setThemeState(settings.theme || 'dark');
      setTextSizeState(settings.textSize || 'medium');
    })();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    const settings = await StorageHelper.getSettings();
    await StorageHelper.saveSettings({ ...settings, theme: newTheme });
  };

  const setTextSize = async (newSize: TextSizeType) => {
    setTextSizeState(newSize);
    const settings = await StorageHelper.getSettings();
    await StorageHelper.saveSettings({ ...settings, textSize: newSize });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Map text size to px value
  const textSizePx = textSize === 'small' ? 16 : textSize === 'large' ? 24 : 20;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, textSize, setTextSize, textSizePx }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}; 