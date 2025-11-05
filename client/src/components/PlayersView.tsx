import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Input } from './ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { usersAPI, User } from '../lib/api';
import { getInitials } from '../lib/utils';

// Icon components
const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" x2="19" y1="8" y2="14"/>
    <line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

type TabType = 'all' | 'friends' | 'requests';

interface PlayersViewProps {
  onClose: () => void;
}

export function PlayersView({ onClose }: PlayersViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchAll, setSearchAll] = useState('');
  const [searchFriends, setSearchFriends] = useState('');
  const [searchRequests, setSearchRequests] = useState('');
  
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<number[]>(() => {
    // Загружаем из localStorage при инициализации
    const saved = localStorage.getItem('sentFriendRequests');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [playerToRemove, setPlayerToRemove] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs: TabType[] = ['all', 'friends', 'requests'];
  const activeIndex = tabs.indexOf(activeTab);

  // Сохраняем sentRequests в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('sentFriendRequests', JSON.stringify(sentRequests));
  }, [sentRequests]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading players data...');
      console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
      
      // Load data sequentially to see which request fails
      console.log('1. Loading all users...');
      const allUsersData = await usersAPI.getAll(100, 0);
      console.log('All users loaded:', allUsersData);
      setAllPlayers(allUsersData);
      
      console.log('2. Loading friends...');
      const friendsData = await usersAPI.getFriends();
      console.log('Friends loaded:', friendsData);
      setFriends(friendsData);
      
      console.log('3. Loading friend requests...');
      const requestsData = await usersAPI.getFriendRequests();
      console.log('Friend requests loaded:', requestsData);
      setFriendRequests(requestsData);
      
    } catch (error) {
      console.error('Error loading players data:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Don't show alert immediately - wait to see console logs
      setTimeout(() => {
        alert(`Ошибка загрузки данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}\n\nПроверьте консоль для деталей.`);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (player: User) => {
    try {
      await usersAPI.sendFriendRequest(player.id);
      setSentRequests([...sentRequests, player.id]);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (player: User) => {
    try {
      await usersAPI.acceptFriendRequest(player.id);
      setFriends([...friends, player]);
      setFriendRequests(friendRequests.filter(u => u.id !== player.id));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async (player: User) => {
    try {
      await usersAPI.declineFriendRequest(player.id);
      setFriendRequests(friendRequests.filter(u => u.id !== player.id));
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleRemoveFriend = async (player: User) => {
    try {
      await usersAPI.removeFriend(player.id);
      setFriends(friends.filter(u => u.id !== player.id));
      setPlayerToRemove(null);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleCancelRequest = async (playerId: number) => {
    try {
      await usersAPI.cancelFriendRequest(playerId);
      setSentRequests(sentRequests.filter(id => id !== playerId));
    } catch (error) {
      console.error('Error cancelling friend request:', error);
    }
  };

  // Filter players
  const filteredAllPlayers = allPlayers.filter(player =>
    player.first_name.toLowerCase().includes(searchAll.toLowerCase()) ||
    player.username?.toLowerCase().includes(searchAll.toLowerCase())
  );

  const filteredFriends = friends.filter(player =>
    player.first_name.toLowerCase().includes(searchFriends.toLowerCase()) ||
    player.username?.toLowerCase().includes(searchFriends.toLowerCase())
  );

  const filteredRequests = friendRequests.filter(player =>
    player.first_name.toLowerCase().includes(searchRequests.toLowerCase()) ||
    player.username?.toLowerCase().includes(searchRequests.toLowerCase())
  );

  // Check if user is already friend
  const isFriend = (userId: number) => friends.some(f => f.id === userId);
  const isRequestSent = (userId: number) => sentRequests.includes(userId);
  const isRequestReceived = (userId: number) => friendRequests.some(r => r.id === userId);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col pt-16">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">Игроки</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="bg-[#1a1a1a] rounded-full p-1">
          <div className="relative flex items-center">
            {/* Animated indicator */}
            <motion.div
              className="absolute bg-red-700 rounded-full"
              initial={false}
              animate={{
                left: `${(activeIndex / 3) * 100}%`,
                width: `${100 / 3}%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              style={{
                height: 'calc(100% - 8px)',
                top: '4px',
                left: `calc(${(activeIndex / 3) * 100}% + 4px)`,
                width: `calc(${100 / 3}% - 8px)`,
              }}
            />

            <button
              onClick={() => setActiveTab('all')}
              className="relative flex-1 py-2.5 z-10 transition-all text-center"
            >
              <span className={`text-sm font-semibold transition-colors ${
                activeTab === 'all' ? 'text-white' : 'text-gray-400'
              }`}>
                Все
              </span>
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className="relative flex-1 py-2.5 z-10 transition-all text-center"
            >
              <span className={`text-sm font-semibold transition-colors ${
                activeTab === 'friends' ? 'text-white' : 'text-gray-400'
              }`}>
                Друзья ({friends.length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className="relative flex-1 py-2.5 z-10 transition-all text-center"
            >
              <span className={`text-sm font-semibold transition-colors ${
                activeTab === 'requests' ? 'text-white' : 'text-gray-400'
              }`}>
                Запросы ({friendRequests.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Загрузка...</div>
          </div>
        ) : (
          <>
            {/* All Players Tab */}
            {activeTab === 'all' && (
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Поиск по имени..."
                    value={searchAll}
                    onChange={(e) => setSearchAll(e.target.value)}
                    className="pl-10 bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Players List */}
                <div className="space-y-2">
                  {filteredAllPlayers.map((player) => {
                    const playerIsFriend = isFriend(player.id);
                    const playerRequestSent = isRequestSent(player.id);
                    const playerRequestReceived = isRequestReceived(player.id);

                    return (
                      <div
                        key={player.id}
                        className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between border border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          {player.photo_url ? (
                            <img
                              src={player.photo_url}
                              alt={player.first_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-lg">
                              {getInitials(player.first_name, player.last_name)}
                            </div>
                          )}
                          <div>
                            <div className="text-base">{player.first_name} {player.last_name || ''}</div>
                            {player.username && (
                              <div className="text-xs text-gray-500">@{player.username}</div>
                            )}
                            {playerIsFriend ? (
                              <div className="text-xs text-green-500">Ваш друг</div>
                            ) : playerRequestReceived ? (
                              <div className="text-xs text-blue-500">Хочет добавить вас</div>
                            ) : playerRequestSent ? (
                              <div className="text-xs text-yellow-500">Запрос отправлен</div>
                            ) : null}
                          </div>
                        </div>
                        {playerRequestSent ? (
                          <button
                            onClick={() => handleCancelRequest(player.id)}
                            className="px-3 py-1.5 rounded-full bg-yellow-700/20 border border-yellow-700/50 hover:bg-yellow-700/30 transition-colors text-xs text-yellow-500"
                          >
                            Отменить
                          </button>
                        ) : !playerIsFriend && !playerRequestReceived ? (
                          <button
                            onClick={() => handleAddFriend(player)}
                            className="w-8 h-8 rounded-full bg-red-700 hover:bg-red-800 transition-colors flex items-center justify-center"
                          >
                            <UserPlusIcon className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Поиск по имени..."
                    value={searchFriends}
                    onChange={(e) => setSearchFriends(e.target.value)}
                    className="pl-10 bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Friends List */}
                <div className="space-y-2">
                  {filteredFriends.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="mb-2">У вас пока нет друзей</div>
                      <div className="text-sm">Добавьте игроков во вкладке "Все"</div>
                    </div>
                  ) : (
                    filteredFriends.map((player) => (
                      <div
                        key={player.id}
                        className="bg-gradient-to-br from-green-900/20 to-green-950/20 rounded-2xl p-4 flex items-center justify-between border border-green-900/30"
                      >
                        <div className="flex items-center gap-3">
                          {player.photo_url ? (
                            <img
                              src={player.photo_url}
                              alt={player.first_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center text-lg">
                              {getInitials(player.first_name, player.last_name)}
                            </div>
                          )}
                          <div>
                            <div className="text-base">{player.first_name} {player.last_name || ''}</div>
                            {player.username && (
                              <div className="text-xs text-gray-500">@{player.username}</div>
                            )}
                            <div className="text-xs text-green-400">Ваш друг</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setPlayerToRemove(player)}
                          className="w-8 h-8 rounded-full bg-red-700/20 hover:bg-red-700/30 transition-colors flex items-center justify-center"
                        >
                          <XIcon className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Поиск по имени..."
                    value={searchRequests}
                    onChange={(e) => setSearchRequests(e.target.value)}
                    className="pl-10 bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Requests List */}
                <div className="space-y-2">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="mb-2">Нет новых запросов</div>
                      <div className="text-sm">Здесь появятся запросы в друзья</div>
                    </div>
                  ) : (
                    filteredRequests.map((player) => (
                      <div
                        key={player.id}
                        className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 rounded-2xl p-4 border border-blue-900/30"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {player.photo_url ? (
                            <img
                              src={player.photo_url}
                              alt={player.first_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-lg">
                              {getInitials(player.first_name, player.last_name)}
                            </div>
                          )}
                          <div>
                            <div className="text-base">{player.first_name} {player.last_name || ''}</div>
                            {player.username && (
                              <div className="text-xs text-gray-500">@{player.username}</div>
                            )}
                            <div className="text-xs text-blue-400">Хочет добавить вас в друзья</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(player)}
                            className="flex-1 bg-green-700 hover:bg-green-800 transition-colors rounded-xl py-2.5 text-sm flex items-center justify-center gap-2"
                          >
                            <CheckIcon className="w-4 h-4" />
                            <span>Принять</span>
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(player)}
                            className="flex-1 bg-red-700/20 hover:bg-red-700/30 transition-colors rounded-xl py-2.5 text-sm text-red-400 flex items-center justify-center"
                          >
                            <span>Отклонить</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Remove Friend Confirmation Dialog */}
      {playerToRemove !== null && (
        <AlertDialog open={playerToRemove !== null} onOpenChange={() => setPlayerToRemove(null)}>
          <AlertDialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Удалить из друзей?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Вы уверены, что хотите удалить {playerToRemove.first_name} из списка друзей?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-700 hover:bg-red-800 text-white"
                onClick={() => {
                  if (playerToRemove) {
                    handleRemoveFriend(playerToRemove);
                  }
                }}
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
