import { useState, useEffect } from 'react';
import { usersAPI, UserProfile } from '../lib/api';

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading user data...');
      const userData = await usersAPI.getMe();
      console.log('✅ User data loaded:', { id: userData.id, username: userData.username });
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user';
      setError(errorMessage);
      console.error('❌ Error loading user:', err);
      console.error('   Error details:', {
        message: errorMessage,
        status: (err as any)?.status,
        response: (err as any)?.response
      });
      
      // Если ошибка авторизации, логируем дополнительную информацию
      if ((err as any)?.status === 401) {
        console.error('💡 401 Unauthorized - Check BOT_TOKEN on server');
        console.error('   Make sure BOT_TOKEN matches the bot that opens the app');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = () => {
    loadUser();
  };

  return { user, loading, error, refreshUser };
}

