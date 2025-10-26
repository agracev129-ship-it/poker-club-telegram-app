import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GameRegistrationContextType {
  registeredGames: Set<number>;
  toggleRegistration: (gameId: number) => void;
  isRegistered: (gameId: number) => boolean;
}

const GameRegistrationContext = createContext<GameRegistrationContextType | undefined>(undefined);

export function GameRegistrationProvider({ children }: { children: ReactNode }) {
  const [registeredGames, setRegisteredGames] = useState<Set<number>>(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('registeredGames');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return new Set(parsed);
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  // Save to localStorage whenever registeredGames changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('registeredGames', JSON.stringify(Array.from(registeredGames)));
    }
  }, [registeredGames]);

  const toggleRegistration = (gameId: number) => {
    setRegisteredGames((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  const isRegistered = (gameId: number) => {
    return registeredGames.has(gameId);
  };

  return (
    <GameRegistrationContext.Provider value={{ registeredGames, toggleRegistration, isRegistered }}>
      {children}
    </GameRegistrationContext.Provider>
  );
}

export function useGameRegistration() {
  const context = useContext(GameRegistrationContext);
  if (context === undefined) {
    throw new Error('useGameRegistration must be used within a GameRegistrationProvider');
  }
  return context;
}

