import { useState, useEffect } from 'react';
import { tournamentsAPI, Tournament } from '../lib/api';

export function useTournaments(filters?: { status?: string; fromDate?: string }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
  }, [filters?.status, filters?.fromDate]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const tournamentsData = await tournamentsAPI.getAll(filters);
      setTournaments(tournamentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
      console.error('Error loading tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTournaments = () => {
    loadTournaments();
  };

  return { tournaments, loading, error, refreshTournaments };
}

export function useTournamentRegistration(tournamentId: number) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkRegistration();
  }, [tournamentId]);

  const checkRegistration = async () => {
    try {
      const { isRegistered: registered } = await tournamentsAPI.checkRegistration(tournamentId);
      setIsRegistered(registered);
    } catch (err) {
      console.error('Error checking registration:', err);
    }
  };

  const toggleRegistration = async () => {
    try {
      setLoading(true);
      if (isRegistered) {
        await tournamentsAPI.unregister(tournamentId);
        setIsRegistered(false);
      } else {
        await tournamentsAPI.register(tournamentId);
        setIsRegistered(true);
      }
    } catch (err) {
      console.error('Error toggling registration:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { isRegistered, loading, toggleRegistration, refreshRegistration: checkRegistration };
}

