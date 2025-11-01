import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { games as initialGames } from './gamesData';

export type PlayerSeating = {
  playerId: number;
  playerName: string;
  table: number;
  seat: number;
  isEliminated: boolean;
  finishPlace?: number;
  pointsEarned?: number;
  bonusPoints?: number;
};

export type Tournament = {
  id: number;
  name: string;
  players: string;
  currentPlayers: number;
  maxPlayers: number;
  queueCount: number;
  time: string;
  date: string;
  location: string;
  status: string;
  description: string;
  hasFriendRegistered: boolean;
  registeredPlayers: any[];
  pointDistribution?: Array<{ place: number; points: number }>;
  autoBalance?: boolean;
  tournamentStatus?: 'upcoming' | 'started' | 'finished';
  seating?: PlayerSeating[];
};

interface TournamentsContextType {
  tournaments: Tournament[];
  addTournament: (tournament: Tournament) => void;
  deleteTournament: (id: number) => void;
  updateTournament: (id: number, updates: Partial<Tournament>) => void;
}

const TournamentsContext = createContext<TournamentsContextType | undefined>(undefined);

export function TournamentsProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    // Load tournaments from localStorage, or use initial games
    const saved = localStorage.getItem('tournaments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tournaments from localStorage', e);
        return initialGames;
      }
    }
    return initialGames;
  });

  // Sort tournaments by date and time (nearest first)
  const sortedTournaments = useMemo(() => {
    return [...tournaments].sort((a, b) => {
      // Combine date and time into a single comparable value
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      
      // Sort ascending (earliest first)
      return dateTimeA - dateTimeB;
    });
  }, [tournaments]);

  // Save to localStorage whenever tournaments change
  useEffect(() => {
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  const addTournament = (tournament: Tournament) => {
    setTournaments(prev => [...prev, tournament]);
  };

  const deleteTournament = (id: number) => {
    setTournaments(prev => prev.filter(t => t.id !== id));
  };

  const updateTournament = (id: number, updates: Partial<Tournament>) => {
    setTournaments(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  return (
    <TournamentsContext.Provider
      value={{ tournaments: sortedTournaments, addTournament, deleteTournament, updateTournament }}
    >
      {children}
    </TournamentsContext.Provider>
  );
}

export function useTournaments() {
  const context = useContext(TournamentsContext);
  if (context === undefined) {
    throw new Error('useTournaments must be used within TournamentsProvider');
  }
  return context;
}






