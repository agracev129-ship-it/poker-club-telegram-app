import { useState, useEffect } from 'react';
import { gamesAPI, usersAPI, User } from '../lib/api';

/**
 * Хук для получения участников игры и проверки друзей среди них
 */
export function useGameParticipants(gameId: number) {
  const [participants, setParticipants] = useState<User[]>([]);
  const [hasFriendRegistered, setHasFriendRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadParticipants = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      
      // Загружаем участников игры
      const gameParticipants = await gamesAPI.getRegistrations(gameId);
      setParticipants(gameParticipants);
      
      // Проверяем есть ли друзья среди участников
      try {
        const friends = await usersAPI.getFriends();
        const friendIds = friends.map(f => f.id);
        const participantIds = gameParticipants.map(p => p.id);
        
        const hasFriend = friendIds.some(fId => participantIds.includes(fId));
        setHasFriendRegistered(hasFriend);
      } catch (friendError) {
        console.error('Error checking friends:', friendError);
        // Если ошибка с друзьями, просто не показываем индикатор
        setHasFriendRegistered(false);
      }
      
    } catch (error) {
      console.error('Error loading participants:', error);
      setParticipants([]);
      setHasFriendRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [gameId]);

  return {
    participants,
    hasFriendRegistered,
    loading,
    refresh: loadParticipants,
  };
}



