import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { usersAPI, userManagementAPI, User } from '../lib/api';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Button } from './ui/button';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const ShieldOffIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m3 3 18 18"/>
  </svg>
);

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

interface PlayersManagementViewProps {
  onClose: () => void;
}

export function PlayersManagementView({ onClose }: PlayersManagementViewProps) {
  const [players, setPlayers] = useState<User[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setFilteredPlayers(players);
    }
  }, [searchQuery, players]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAll(1000, 0);
      setPlayers(data);
      setFilteredPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredPlayers(players);
      return;
    }

    try {
      const results = await userManagementAPI.search(searchQuery);
      setFilteredPlayers(results);
    } catch (error) {
      console.error('Error searching players:', error);
      // Fallback to client-side search
      const filtered = players.filter(player => 
        player.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  };

  const handleBlock = async (userId: number) => {
    setActionLoading(userId);
    try {
      await userManagementAPI.block(userId);
      toast.success('Пользователь заблокирован');
      await loadPlayers();
    } catch (error: any) {
      console.error('Error blocking user:', error);
      toast.error(error.message || 'Ошибка при блокировке');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (userId: number) => {
    setActionLoading(userId);
    try {
      await userManagementAPI.unblock(userId);
      toast.success('Пользователь разблокирован');
      await loadPlayers();
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      toast.error(error.message || 'Ошибка при разблокировке');
    } finally {
      setActionLoading(null);
    }
  };

  const getDisplayName = (player: User) => {
    return player.first_name + (player.last_name ? ` ${player.last_name}` : '');
  };

  return (
    <div className="fixed inset-0 bg-black z-[60] overflow-y-auto overscroll-contain pt-16">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 py-4 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <UsersIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl">Управление игроками</h2>
          </div>
          <span className="text-xs px-3 py-1.5 bg-blue-600/20 border border-blue-600/40 rounded-full text-blue-400">
            {filteredPlayers.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени..."
            className="bg-[#1a1a1a] border-gray-800 pl-10 text-white"
          />
        </div>
      </div>

      <div className="px-4 py-6 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Загрузка...</div>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPlayers.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-4 border transition-all ${
                  player.is_blocked
                    ? 'bg-red-900/20 border-red-700/50'
                    : 'bg-[#1a1a1a] border-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                    player.is_blocked
                      ? 'bg-gradient-to-br from-red-700 to-red-900 border-red-600'
                      : 'bg-gradient-to-br from-blue-700 to-blue-900 border-blue-600'
                  }`}>
                    {player.photo_url ? (
                      <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{getDisplayName(player).charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm truncate">{getDisplayName(player)}</div>
                      {player.is_admin && (
                        <div className="px-1.5 py-0.5 bg-red-700/20 border border-red-700/50 rounded text-xs text-red-400 shrink-0">
                          Admin
                        </div>
                      )}
                      {player.is_blocked && (
                        <div className="px-1.5 py-0.5 bg-red-700/20 border border-red-700/50 rounded text-xs text-red-400 shrink-0">
                          Заблокирован
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      @{player.username || 'user'} • ID: {player.telegram_id}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <TrophyIcon className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-400">{(player as any).games_played || 0} игр</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">{(player as any).total_points || 0} очков</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {player.is_admin ? (
                      <div className="text-xs text-gray-500 px-3 py-2">
                        Администратор
                      </div>
                    ) : (
                      <Button
                        onClick={() => player.is_blocked ? handleUnblock(player.id) : handleBlock(player.id)}
                        disabled={actionLoading === player.id}
                        size="sm"
                        variant="outline"
                        className={`${
                          player.is_blocked
                            ? 'bg-green-700/20 border-green-700/50 hover:bg-green-700/30 text-green-400'
                            : 'bg-red-700/20 border-red-700/50 hover:bg-red-700/30 text-red-400'
                        }`}
                      >
                        {actionLoading === player.id ? (
                          'Обработка...'
                        ) : player.is_blocked ? (
                          <>
                            <ShieldCheckIcon className="w-4 h-4 mr-1" />
                            Разблокировать
                          </>
                        ) : (
                          <>
                            <ShieldOffIcon className="w-4 h-4 mr-1" />
                            Заблокировать
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

