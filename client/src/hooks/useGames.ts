import { useState, useEffect } from 'react';
import { gamesAPI, Game } from '../lib/api';

export function useGames(filters?: { status?: string; fromDate?: string; toDate?: string }) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
  }, [filters?.status, filters?.fromDate, filters?.toDate]);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const gamesData = await gamesAPI.getAll(filters);
      setGames(gamesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshGames = () => {
    loadGames();
  };

  return { games, loading, error, refreshGames };
}

export function useGameRegistration(gameId: number) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkRegistration();
  }, [gameId]);

  const checkRegistration = async () => {
    try {
      const { isRegistered: registered } = await gamesAPI.checkRegistration(gameId);
      setIsRegistered(registered);
    } catch (err) {
      console.error('Error checking registration:', err);
    }
  };

  const toggleRegistration = async () => {
    try {
      setLoading(true);
      if (isRegistered) {
        await gamesAPI.unregister(gameId);
        setIsRegistered(false);
      } else {
        await gamesAPI.register(gameId);
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

