import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SkillLevel, Handedness, GuitarType } from '../types';

export interface Settings {
  skillLevel: SkillLevel;
  handedness: Handedness;
  guitarType: GuitarType;
  theme: 'light' | 'dark' | 'system';
  language: string;
  a4Frequency: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  skillLevel: 'beginner',
  handedness: 'right',
  guitarType: 'acoustic',
  theme: 'light',
  language: 'en',
  a4Frequency: 440,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
