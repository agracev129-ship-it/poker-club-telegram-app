import { useState, useEffect } from 'react';
import { useGames, useGameRegistration } from '../hooks/useGames';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useGameRegistration as useLocalGameRegistration } from './GameRegistrationContext';
import { formatDate, formatTime, getInitials } from '../lib/utils';
import { Game, User, usersAPI, gamesAPI } from '../lib/api';
import { vibrate } from '../lib/telegram';
import { useGameParticipants } from '../hooks/useGameParticipants';

// Icon components as inline SVGs
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

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const UserCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <polyline points="16 11 18 13 22 9"/>
  </svg>
);

// Компонент для отображения игры с проверкой друзей
function GameCard({ game, onJoinClick, onShowParticipants }: {
  game: Game;
  onJoinClick: (game: Game) => void;
  onShowParticipants: (game: Game) => void;
}) {
  const [friends, setFriends] = useState<User[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [hasFriend, setHasFriend] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  
  // Проверяем статус турнира
  const isStarted = game.tournament_status === 'started';
  const isUpcoming = !game.tournament_status || game.tournament_status === 'upcoming';

  useEffect(() => {
    // Проверяем регистрацию и друзей
    const loadData = async () => {
      try {
        setCheckingRegistration(true);
        
        // Проверяем регистрацию пользователя через API
        const { isRegistered: apiRegistered } = await gamesAPI.checkRegistration(game.id);
        setIsRegistered(apiRegistered);
        
        // Загружаем участников и друзей параллельно
        const [friendsData, participantsData] = await Promise.all([
          usersAPI.getFriends(),
          gamesAPI.getRegistrations(game.id),
        ]);
        
        setFriends(friendsData);
        setParticipants(participantsData);
        
        // Проверяем есть ли друзья среди участников
        const friendIds = friendsData.map(f => f.id);
        const participantIds = participantsData.map(p => p.id);
        const hasFriendRegistered = friendIds.some(fId => participantIds.includes(fId));
        
        setHasFriend(hasFriendRegistered);
      } catch (error) {
        console.error('Error loading game data:', error);
        setHasFriend(false);
        setIsRegistered(false);
      } finally {
        setCheckingRegistration(false);
      }
    };
    
    loadData();
  }, [game.id]);

  return (
    <div
      className={`rounded-2xl p-4 border transition-all relative ${
        isRegistered
          ? 'bg-gradient-to-br from-red-700/30 to-red-900/30 border-red-700/50'
          : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base mb-1">{game.name}</h3>
          <div className={`flex items-center gap-3 text-xs ${
            isRegistered ? 'text-gray-300' : 'text-gray-400'
          }`}>
            <div className="flex items-center gap-1">
              <UsersIcon className="w-3.5 h-3.5" />
              <span>{game.registered_count} / {game.max_players}</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              <span>{formatTime(game.time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{formatDate(game.date)}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onShowParticipants(game);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 hover:bg-red-700/30 transition-colors ${
            isRegistered ? 'bg-red-700/20' : 'bg-white/5'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Friend Registered Badge */}
      {hasFriend && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-red-500">
          <UserCheckIcon className="w-3.5 h-3.5" />
          <span>Ваш друг зарегистрирован!</span>
        </div>
      )}
      
      {isStarted ? (
        <div className="w-full bg-green-700/20 border border-green-700/50 rounded-xl py-2.5 text-sm text-center text-green-400 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Турнир в процессе</span>
        </div>
      ) : (
        <button
          className={`w-full transition-all rounded-xl py-2.5 text-sm text-center tracking-wide flex items-center justify-center gap-2 ${
            isRegistered
              ? 'bg-white hover:bg-gray-200 text-black'
              : 'bg-gradient-to-b from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white'
          }`}
          onClick={() => onJoinClick(game)}
          disabled={checkingRegistration}
        >
          {checkingRegistration ? (
            'Загрузка...'
          ) : (
            <>
              {isRegistered && <CheckIcon className="w-4 h-4" />}
              {isRegistered ? 'Вы зарегистрированы' : 'Присоединиться'}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function GamesTab() {
  const { games: allGames, loading, refreshGames } = useGames({ status: 'all' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isPlayersDialogOpen, setIsPlayersDialogOpen] = useState(false);
  const [selectedGameForPlayers, setSelectedGameForPlayers] = useState<Game | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Показываем только предстоящие и идущие турниры, исключаем завершенные
  const games = allGames.filter(g => g.tournament_status !== 'finished');
  
  const { isRegistered: isAPIRegistered, toggleRegistration, refreshRegistration } = useGameRegistration(selectedGame?.id || 0);
  const { isRegistered: checkIsRegistered, toggleRegistration: localToggle } = useLocalGameRegistration();
  
  // Получаем участников для выбранной игры в модальном окне
  const { participants, hasFriendRegistered, loading: participantsLoading, refresh: refreshParticipants } = useGameParticipants(selectedGameForPlayers?.id || 0);
  const [friendsList, setFriendsList] = useState<User[]>([]);

  // Загружаем список друзей для проверки
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friends = await usersAPI.getFriends();
        setFriendsList(friends);
      } catch (error) {
        console.error('Error loading friends:', error);
      }
    };
    loadFriends();
  }, []);

  const handleJoinClick = (game: Game) => {
    vibrate('light');
    setSelectedGame(game);
    setIsDialogOpen(true);
  };

  const handleShowParticipants = (game: Game) => {
    vibrate('light');
    setSelectedGameForPlayers(game);
    setIsPlayersDialogOpen(true);
    // Обновляем участников при открытии
    setTimeout(() => refreshParticipants(), 100);
  };

  const handleToggleRegistration = async () => {
    if (!selectedGame) return;
    
    try {
      vibrate('medium');
      // Update API registration
      await toggleRegistration();
      
      // Also update local context for SeatingView
      localToggle(selectedGame.id);
      
      // Refresh registration status to update button
      await refreshRegistration();
      
      // Refresh games list to update registered_count
      await refreshGames();
      
      // Всегда обновляем участников после регистрации/отмены
      await refreshParticipants();
      
      setIsDialogOpen(false);
      
      // Обновляем ключ для принудительного обновления GameCard
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при регистрации');
    }
  };

  const isRegistered = selectedGame ? (isAPIRegistered || checkIsRegistered(selectedGame.id)) : false;

  // Проверяем является ли участник другом
  const isFriend = (userId: number) => {
    return friendsList.some(f => f.id === userId);
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Compact Header */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl mb-1">Игры</h2>
        <p className="text-sm text-gray-400">Расписание предстоящих игр</p>
      </div>

      {/* Games List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Загрузка...</div>
        ) : games.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Нет предстоящих игр</div>
        ) : (
          games.map((game) => (
            <GameCard
              key={`${game.id}-${refreshKey}`}
              game={game}
              onJoinClick={handleJoinClick}
              onShowParticipants={handleShowParticipants}
            />
          ))
        )}
      </div>

      {/* Registration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              {selectedGame?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <div className="mt-4 space-y-6">
              {/* Game Info */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{formatDate(selectedGame.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{formatTime(selectedGame.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{selectedGame.registered_count} / {selectedGame.max_players}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl p-4 border border-red-900/30">
                <h4 className="mb-2 text-gray-200">Формат игры</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedGame.description}
                </p>
              </div>

              {/* Register Button */}
              <button
                className={`w-full transition-all rounded-xl py-3.5 shadow-lg flex items-center justify-center gap-2 ${
                  isRegistered
                    ? 'bg-gray-600 hover:bg-gray-700 shadow-gray-500/20'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/20'
                }`}
                onClick={handleToggleRegistration}
              >
                {isRegistered && <XIcon className="w-5 h-5" />}
                {isRegistered ? 'Отменить запись' : 'Зарегистрироваться'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Players List Dialog */}
      <Dialog open={isPlayersDialogOpen} onOpenChange={setIsPlayersDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-h-[80vh] overflow-hidden flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Зарегистрированные игроки
            </DialogTitle>
            {selectedGameForPlayers && (
              <p className="text-sm text-gray-400 mt-1">{selectedGameForPlayers.name}</p>
            )}
          </DialogHeader>
          <div className="mt-4 overflow-y-auto flex-1">
            {participantsLoading ? (
              <div className="text-center text-gray-400 py-8">Загрузка...</div>
            ) : participants.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Нет зарегистрированных игроков</div>
            ) : (
              <div className="space-y-2">
                {participants.map((player) => {
                  const playerIsFriend = isFriend(player.id);
                  
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-xl flex items-center justify-between ${
                        playerIsFriend
                          ? 'bg-gradient-to-br from-red-700/20 to-red-900/20 border border-red-700/30'
                          : 'bg-[#252525]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt={player.first_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-red-700 to-red-900 rounded-full flex items-center justify-center">
                            <span className="text-sm">{getInitials(player.first_name, player.last_name)}</span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{player.first_name} {player.last_name || ''}</span>
                            {playerIsFriend && (
                              <span className="text-xs text-red-500 bg-red-900/30 px-2 py-0.5 rounded-full">
                                Друг
                              </span>
                            )}
                          </div>
                          {player.username && (
                            <div className="text-xs text-gray-400">@{player.username}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
