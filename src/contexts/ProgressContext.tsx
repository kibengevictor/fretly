import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchProgress, saveProgress } from '../services/progressApi';
import { useAuth } from './AuthContext';

export interface Progress {
  completedLessons: string[];
  learnedChords: string[];
  practicedSongs: string[];
  practiceTimeMinutes: number;
  currentStreak: number;
  lastPracticeDate?: string;
}

interface ProgressContextType {
  progress: Progress;
  markLessonComplete: (lessonId: string) => void;
  markChordLearned: (chordId: string) => void;
  markSongPracticed: (songId: string) => void;
  addPracticeTime: (minutes: number) => void;
}

const defaultProgress: Progress = {
  completedLessons: [],
  learnedChords: [],
  practicedSongs: [],
  practiceTimeMinutes: 0,
  currentStreak: 0,
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    setProgress(defaultProgress);
    fetchProgress().then((remote) => {
      if (remote) setProgress(remote);
    }).catch(() => {
      // Local progress remains usable when the account API is unavailable.
    }).finally(() => setHydrated(true));
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated) return;
    saveProgress(progress).catch(() => {
      // The in-memory state remains authoritative until the next successful sync.
    });
  }, [hydrated, progress]);

  const markLessonComplete = (lessonId: string) => {
    setProgress((prev) => ({
      ...prev,
      completedLessons: prev.completedLessons.includes(lessonId)
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId],
    }));
  };

  const markChordLearned = (chordId: string) => {
    setProgress((prev) => ({
      ...prev,
      learnedChords: prev.learnedChords.includes(chordId)
        ? prev.learnedChords
        : [...prev.learnedChords, chordId],
    }));
  };

  const addPracticeTime = (minutes: number) => {
    setProgress((prev) => ({
      ...prev,
      practiceTimeMinutes: prev.practiceTimeMinutes + minutes,
    }));
  };

  const markSongPracticed = (songId: string) => {
    setProgress((prev) => ({
      ...prev,
      practicedSongs: prev.practicedSongs.includes(songId)
        ? prev.practicedSongs
        : [...prev.practicedSongs, songId],
    }));
  };

  return (
    <ProgressContext.Provider value={{ progress, markLessonComplete, markChordLearned, markSongPracticed, addPracticeTime }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
