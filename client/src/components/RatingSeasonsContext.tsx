import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface RatingSeason {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface RatingSeasonsContextType {
  seasons: RatingSeason[];
  addSeason: (season: Omit<RatingSeason, 'id'>) => void;
  updateSeason: (id: number, updates: Partial<RatingSeason>) => void;
  deleteSeason: (id: number) => void;
  setActiveSeason: (id: number) => void;
}

const RatingSeasonsContext = createContext<RatingSeasonsContextType | undefined>(undefined);

const STORAGE_KEY = 'rating_seasons';

// Default seasons
const defaultSeasons: RatingSeason[] = [
  {
    id: 1,
    name: 'Сезон 1',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    isActive: true,
  },
  {
    id: 2,
    name: 'Сезон 2',
    startDate: '2024-07-01',
    endDate: '2024-12-31',
    isActive: false,
  },
];

export function RatingSeasonsProvider({ children }: { children: ReactNode }) {
  const [seasons, setSeasons] = useState<RatingSeason[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading rating seasons:', error);
    }
    return defaultSeasons;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seasons));
    } catch (error) {
      console.error('Error saving rating seasons:', error);
    }
  }, [seasons]);

  const addSeason = (season: Omit<RatingSeason, 'id'>) => {
    const newId = seasons.length > 0 ? Math.max(...seasons.map(s => s.id)) + 1 : 1;
    setSeasons(prev => [...prev, { ...season, id: newId }]);
  };

  const updateSeason = (id: number, updates: Partial<RatingSeason>) => {
    setSeasons(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSeason = (id: number) => {
    setSeasons(prev => prev.filter(s => s.id !== id));
  };

  const setActiveSeason = (id: number) => {
    setSeasons(prev =>
      prev.map(s => ({
        ...s,
        isActive: s.id === id,
      }))
    );
  };

  return (
    <RatingSeasonsContext.Provider
      value={{
        seasons,
        addSeason,
        updateSeason,
        deleteSeason,
        setActiveSeason,
      }}
    >
      {children}
    </RatingSeasonsContext.Provider>
  );
}

export function useRatingSeasons() {
  const context = useContext(RatingSeasonsContext);
  if (context === undefined) {
    throw new Error('useRatingSeasons must be used within a RatingSeasonsProvider');
  }
  return context;
}

