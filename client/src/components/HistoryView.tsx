import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useGames } from '../hooks/useGames';
import { gamesAPI, Game } from '../lib/api';
import { useUser } from '../hooks/useUser';

// Helper function to format date
const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const monthsFull = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  return `${dateObj.getDate()} ${monthsFull[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};

const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  
  return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};

// Icon components
const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
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

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const MedalIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/>
    <path d="M11 12 5.12 2.2"/>
    <path d="m13 12 5.88-9.8"/>
    <path d="M8 7h8"/>
    <circle cx="12" cy="17" r="5"/>
    <path d="M12 18v-2h-.5"/>
  </svg>
);

const getInitials = (firstName: string, lastName?: string): string => {
  return `${firstName.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase();
};

type TabType = 'all' | 'my';

interface HistoryViewProps {
  onClose: () => void;
}

interface TournamentResults {
  game: Game;
  participants: Array<{
    user_id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    finish_place?: number;
    points_earned: number;
    bonus_points: number;
    total_points: number;
    participated: boolean;
  }>;
}

export function HistoryView({ onClose }: HistoryViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [tournamentResults, setTournamentResults] = useState<TournamentResults | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useUser();
  // Загружаем ТОЛЬКО завершенные турниры напрямую
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Загружаем все игры и фильтруем завершенные
  useEffect(() => {
    const loadFinishedGames = async () => {
      try {
        setGamesLoading(true);
        const response = await gamesAPI.getAll({});
        // Фильтруем только завершенные и со статусом 'completed'
        const finished = response.filter(g => 
          g.tournament_status === 'finished' || 
          g.status === 'completed'
        );
        setAllGames(finished);
      } catch (error) {
        console.error('Error loading finished games:', error);
        setAllGames([]);
      } finally {
        setGamesLoading(false);
      }
    };

    loadFinishedGames();
  }, []);

  const finishedGames = allGames;

  const tabs: TabType[] = ['all', 'my'];
  const activeIndex = tabs.indexOf(activeTab);

  // Проверяем участие пользователя в турнире
  const [myGameIds, setMyGameIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const checkParticipation = async () => {
      if (!user) return;
      
      const participatedGameIds = new Set<number>();
      
      for (const game of finishedGames) {
        try {
          const results = await gamesAPI.getTournamentResults(game.id);
          const userParticipated = results.participants.some(p => p.user_id === user.id && p.participated);
          if (userParticipated) {
            participatedGameIds.add(game.id);
          }
        } catch (error) {
          console.error(`Error checking participation for game ${game.id}:`, error);
        }
      }
      
      setMyGameIds(participatedGameIds);
    };

    checkParticipation();
  }, [finishedGames, user]);

  // Filter games based on active tab and selected date
  const filteredGames = finishedGames.filter(game => {
    const tabMatch = activeTab === 'all' || (activeTab === 'my' && myGameIds.has(game.id));
    
    if (!selectedDate) return tabMatch;
    
    // Date matching
    const gameDate = new Date(game.date);
    const sameDate = 
      gameDate.getDate() === selectedDate.getDate() &&
      gameDate.getMonth() === selectedDate.getMonth() &&
      gameDate.getFullYear() === selectedDate.getFullYear();
    
    return tabMatch && sameDate;
  });

  // Handle game click to show participants
  const handleGameClick = async (game: Game) => {
    try {
      setLoading(true);
      const results = await gamesAPI.getTournamentResults(game.id);
      setTournamentResults(results);
      setSelectedGame(game);
      setShowParticipants(true);
    } catch (error) {
      console.error('Error loading tournament results:', error);
      alert('Ошибка при загрузке результатов турнира');
    } finally {
      setLoading(false);
    }
  };

  // Get user's position in a game
  const getUserPosition = (gameId: number): number | undefined => {
    // This will be set when we load tournament results
    return undefined;
  };

  // If showing participants, render participants view
  if (showParticipants && tournamentResults && selectedGame) {
    const userParticipant = tournamentResults.participants.find(p => p.user_id === user?.id);

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowParticipants(false)}
              className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <h2 className="text-xl text-center flex-1">{selectedGame.name}</h2>
            <div className="w-10" /> {/* Spacer */}
          </div>
          <p className="text-sm text-gray-400 text-center">
            {formatDate(selectedGame.date)} в {selectedGame.time}
          </p>
        </div>

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="space-y-2">
            {tournamentResults.participants
              .filter(p => p.participated)
              .map((participant) => {
                const isCurrentUser = participant.user_id === user?.id;
                const place = participant.finish_place;

                return (
                  <div
                    key={participant.user_id}
                    className={`rounded-2xl p-4 flex items-center gap-3 ${
                      isCurrentUser
                        ? 'bg-gradient-to-br from-red-700/30 to-red-900/30 border border-red-700/50'
                        : place && place <= 3
                        ? 'bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 border border-yellow-700/30'
                        : 'bg-[#1a1a1a] border border-gray-800'
                    }`}
                  >
                    {/* Position Badge */}
                    {place && (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        place === 1
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                          : place === 2
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black'
                          : place === 3
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black'
                          : 'bg-gray-700 text-white'
                      }`}>
                        <span className="font-bold">{place}</span>
                      </div>
                    )}

                    {/* Avatar */}
                    {participant.photo_url ? (
                      <img
                        src={participant.photo_url}
                        alt={participant.first_name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0">
                        <span className="text-sm">{getInitials(participant.first_name, participant.last_name)}</span>
                      </div>
                    )}

                    {/* Name and Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm truncate">
                          {isCurrentUser ? 'Вы' : `${participant.first_name} ${participant.last_name || ''}`}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs bg-red-700/30 text-red-400 px-2 py-0.5 rounded-full shrink-0">
                            Вы
                          </span>
                        )}
                      </div>
                      {participant.username && (
                        <div className="text-xs text-gray-400">@{participant.username}</div>
                      )}
                    </div>

                    {/* Points */}
                    <div className="text-right shrink-0">
                      <div className="text-sm text-yellow-400">
                        +{participant.total_points}
                      </div>
                      {participant.bonus_points > 0 && (
                        <div className="text-xs text-gray-400">
                          ({participant.points_earned} + {participant.bonus_points})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">История</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="bg-[#1a1a1a] rounded-full p-1 mb-4">
          <div className="relative flex items-center">
            {/* Animated indicator */}
            <motion.div
              className="absolute bg-red-700 rounded-full"
              initial={false}
              animate={{
                left: `${(activeIndex / 2) * 100}%`,
                width: `${100 / 2}%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              style={{
                height: 'calc(100% - 8px)',
                top: '4px',
                left: `calc(${(activeIndex / 2) * 100}% + 4px)`,
                width: `calc(${100 / 2}% - 8px)`,
              }}
            />

            <button
              onClick={() => setActiveTab('all')}
              className="relative flex-1 py-2.5 z-10 transition-all text-center"
            >
              <span className={`transition-colors ${activeTab === 'all' ? 'text-white' : 'text-gray-400'}`}>
                Все
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my')}
              className="relative flex-1 py-2.5 z-10 transition-all text-center"
            >
              <span className={`transition-colors ${activeTab === 'my' ? 'text-white' : 'text-gray-400'}`}>
                Мои игры
              </span>
            </button>
          </div>
        </div>

        {/* Calendar Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full bg-[#1a1a1a] rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-[#252525] transition-colors">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">
                  {selectedDate ? formatDate(selectedDate) : 'Выбрать дату'}
                </span>
              </div>
              {selectedDate && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(undefined);
                  }}
                  className="text-red-600 text-sm hover:text-red-500 cursor-pointer"
                >
                  Сбросить
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-gray-800" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
              className="text-white"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Games List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {gamesLoading || loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : (
          <div className="space-y-3">
            {filteredGames.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-700/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-400">
                  {selectedDate ? 'Нет игр на выбранную дату' : 'История игр пуста'}
                </p>
              </div>
            ) : (
              filteredGames.map((game) => {
                const participated = myGameIds.has(game.id);

                return (
                  <div
                    key={game.id}
                    className={`rounded-3xl p-5 relative overflow-hidden cursor-pointer transition-all ${
                      participated
                        ? 'bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-900/30 hover:from-red-900/40 hover:to-red-950/40'
                        : 'bg-[#1a1a1a] border border-gray-800 hover:bg-[#252525]'
                    }`}
                    onClick={() => handleGameClick(game)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg">{game.name}</h3>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{formatDateShort(game.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="w-4 h-4" />
                            <span>{game.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Игроки</div>
                        <div className="flex items-center gap-1.5">
                          <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-300">{game.registered_count || 0}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Бай-ин</div>
                        <div className="text-sm text-gray-300">{game.buy_in || '—'}₽</div>
                      </div>
                    </div>

                    {participated && (
                      <div className="mt-3 pt-3 border-t border-red-900/30">
                        <div className="flex items-center gap-2 text-xs text-red-400">
                          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                          <span>Вы участвовали в этой игре</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

