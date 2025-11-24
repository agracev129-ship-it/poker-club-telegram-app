import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ratingSeasonsAPI, RatingSeason as APISeason } from '../lib/api';

export interface RatingSeason {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface RatingSeasonsContextType {
  seasons: RatingSeason[];
  loading: boolean;
  addSeason: (season: Omit<RatingSeason, 'id'>) => Promise<void>;
  updateSeason: (id: number, updates: Partial<RatingSeason>) => Promise<void>;
  deleteSeason: (id: number) => Promise<void>;
  setActiveSeason: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

const RatingSeasonsContext = createContext<RatingSeasonsContextType | undefined>(undefined);

// Convert API season to context season format
const convertAPISeasonToContext = (apiSeason: APISeason): RatingSeason => ({
  id: apiSeason.id,
  name: apiSeason.name,
  startDate: apiSeason.start_date,
  endDate: apiSeason.end_date,
  isActive: apiSeason.is_active,
});

// Convert context season to API season format
const convertContextSeasonToAPI = (contextSeason: Partial<RatingSeason>): Partial<Omit<APISeason, 'id' | 'created_at' | 'updated_at'>> => ({
  name: contextSeason.name,
  start_date: contextSeason.startDate,
  end_date: contextSeason.endDate,
  is_active: contextSeason.isActive,
});

export function RatingSeasonsProvider({ children }: { children: ReactNode }) {
  const [seasons, setSeasons] = useState<RatingSeason[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const apiSeasons = await ratingSeasonsAPI.getAll();
      const convertedSeasons = apiSeasons.map(convertAPISeasonToContext);
      setSeasons(convertedSeasons);
    } catch (error) {
      console.error('Error fetching rating seasons:', error);
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  const addSeason = async (season: Omit<RatingSeason, 'id'>) => {
    try {
      const apiData = convertContextSeasonToAPI(season);
      const createdSeason = await ratingSeasonsAPI.create(apiData as any);
      const convertedSeason = convertAPISeasonToContext(createdSeason);
      setSeasons(prev => [...prev, convertedSeason]);
    } catch (error) {
      console.error('Error adding season:', error);
      throw error;
    }
  };

  const updateSeason = async (id: number, updates: Partial<RatingSeason>) => {
    try {
      const apiData = convertContextSeasonToAPI(updates);
      const updatedSeason = await ratingSeasonsAPI.update(id, apiData);
      const convertedSeason = convertAPISeasonToContext(updatedSeason);
      setSeasons(prev => prev.map(s => (s.id === id ? convertedSeason : s)));
    } catch (error) {
      console.error('Error updating season:', error);
      throw error;
    }
  };

  const deleteSeason = async (id: number) => {
    try {
      await ratingSeasonsAPI.delete(id);
      setSeasons(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting season:', error);
      throw error;
    }
  };

  const setActiveSeason = async (id: number) => {
    try {
      await ratingSeasonsAPI.setActive(id);
      // Refetch all seasons to ensure correct state
      await fetchSeasons();
    } catch (error) {
      console.error('Error setting active season:', error);
      throw error;
    }
  };

  return (
    <RatingSeasonsContext.Provider
      value={{
        seasons,
        loading,
        addSeason,
        updateSeason,
        deleteSeason,
        setActiveSeason,
        refetch: fetchSeasons,
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

