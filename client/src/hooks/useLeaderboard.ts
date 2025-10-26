import { useState, useEffect } from 'react';
import { usersAPI, UserStats } from '../lib/api';

export function useLeaderboard(limit = 50) {
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const leaderboardData = await usersAPI.getLeaderboard(limit);
      setLeaderboard(leaderboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLeaderboard = () => {
    loadLeaderboard();
  };

  return { leaderboard, loading, error, refreshLeaderboard };
}

