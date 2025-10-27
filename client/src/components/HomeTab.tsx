import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { games as localGames, Game as LocalGame } from './gamesData';
import { useGameRegistration } from './GameRegistrationContext';
import { useUser } from '../hooks/useUser';
import { useGames } from '../hooks/useGames';
import { Game, gamesAPI } from '../lib/api';
import { getInitials, formatDate, formatTime } from '../lib/utils';
import { SeatingView } from './SeatingView';
import { PlayersView } from './PlayersView';
import { HistoryView } from './HistoryView';
import { AboutClubView } from './AboutClubView';

// Icon components as inline SVGs (from new design)
const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const MoreVerticalIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="5" r="1"/>
    <circle cx="12" cy="19" r="1"/>
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

const StarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const LayoutIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2"/>
    <path d="M3 9h18"/>
    <path d="M9 21V9"/>
  </svg>
);

interface HomeTabProps {
  onOpenSeating: () => void;
  onCloseSeating: () => void;
  onOpenPlayers: () => void;
  onClosePlayers: () => void;
  onOpenHistory: () => void;
  onCloseHistory: () => void;
  onOpenAboutClub: () => void;
  onCloseAboutClub: () => void;
  isSeatingOpen: boolean;
  isPlayersOpen: boolean;
  isHistoryOpen: boolean;
  isAboutClubOpen: boolean;
}

export function HomeTab({ 
  onOpenSeating, 
  onCloseSeating, 
  onOpenPlayers, 
  onClosePlayers,
  onOpenHistory,
  onCloseHistory,
  onOpenAboutClub,
  onCloseAboutClub,
  isSeatingOpen,
  isPlayersOpen,
  isHistoryOpen,
  isAboutClubOpen
}: HomeTabProps) {
  const { user, loading: userLoading } = useUser();
  const { games: apiGames, loading: gamesLoading, refreshGames } = useGames({ status: 'upcoming' });
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activityPeriod, setActivityPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [registeredGameIds, setRegisteredGameIds] = useState<Set<number>>(new Set());
  const { toggleRegistration: localToggle, isRegistered: checkIsRegistered, registeredGames } = useGameRegistration();

  // Загрузка зарегистрированных игр через API
  useEffect(() => {
    const loadRegistrations = async () => {
      if (apiGames.length === 0) return;
      
      const registeredIds = new Set<number>();
      for (const game of apiGames) {
        try {
          const { isRegistered } = await gamesAPI.checkRegistration(game.id);
          if (isRegistered) {
            registeredIds.add(game.id);
          }
        } catch (error) {
          console.error(`Error checking registration for game ${game.id}:`, error);
        }
      }
      setRegisteredGameIds(registeredIds);
    };
    
    loadRegistrations();
  }, [apiGames]);

  useEffect(() => {
    // Calculate time until next game (example: 23.10 19:00)
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextGame = new Date();
      nextGame.setHours(19, 0, 0, 0);
      
      // If time has passed today, set to tomorrow
      if (now.getHours() >= 19) {
        nextGame.setDate(nextGame.getDate() + 1);
      }
      
      const diff = nextGame.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ hours, minutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    setIsDialogOpen(true);
  };

  const handleToggleRegistration = async () => {
    if (!selectedGame) return;
    
    try {
      // Toggle через API
      const { isRegistered } = await gamesAPI.checkRegistration(selectedGame.id);
      if (isRegistered) {
        await gamesAPI.unregister(selectedGame.id);
        setRegisteredGameIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedGame.id);
          return newSet;
        });
      } else {
        await gamesAPI.register(selectedGame.id);
        setRegisteredGameIds(prev => new Set([...prev, selectedGame.id]));
      }
      
      // Обновляем локальный контекст
      localToggle(selectedGame.id);
      
      // Обновляем список игр
      await refreshGames();
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при регистрации');
    }
  };

  const isRegistered = selectedGame ? registeredGameIds.has(selectedGame.id) : false;

  // Get first two games
  const firstGame = apiGames[0];
  const secondGame = apiGames[1];
  
  // Get all registered games
  const allRegisteredGames = apiGames.filter(game => registeredGameIds.has(game.id));
  
  // Check if seating is available
  const isSeatingAvailable = registeredGameIds.size > 0;
  
  const handleSeatingClick = () => {
    onOpenSeating();
  };

  const handlePlayersClick = () => {
    onOpenPlayers();
  };

  const handleHistoryClick = () => {
    onOpenHistory();
  };

  const handleAboutClubClick = () => {
    onOpenAboutClub();
  };

  // Activity stats based on period - using real user data
  const activityStats = {
    month: { gamesPlayed: user?.games_played || 0, wins: user?.games_won || 0 },
    year: { gamesPlayed: user?.games_played || 0, wins: user?.games_won || 0 },
    all: { gamesPlayed: user?.games_played || 0, wins: user?.games_won || 0 },
  };

  const currentStats = activityStats[activityPeriod];
  const activityPeriods: Array<'month' | 'year' | 'all'> = ['month', 'year', 'all'];
  const activeIndex = activityPeriods.indexOf(activityPeriod);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Compact Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-red-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-2 border-red-700">
                <span className="text-xl">{getInitials(user?.first_name || 'И', user?.last_name)}</span>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400">Привет,</div>
              <div className="text-lg">{user?.first_name || 'Игрок'}</div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <MoreVerticalIcon className="w-5 h-5 text-white" />
          </button>
        </div>
        <h2 className="text-2xl mb-1">Готовы к игре?</h2>
        <p className="text-sm text-gray-400">До следующей игры {timeLeft.hours}ч {timeLeft.minutes}м</p>
      </div>

      {/* Main Content Grid */}
      <div className="px-4 space-y-3">
        {/* Registration Notice Cards - Show if user is registered */}
        {allRegisteredGames.map((game) => (
          <div
            key={game.id}
            className="bg-gradient-to-br from-red-700/30 to-red-900/30 rounded-3xl p-5 border border-red-700/50 backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-600/10" />
            <div className="relative z-10 space-y-3">
              <div>
                <h3 className="text-lg mb-1">Вы записаны на игру <span className="text-red-400">{game.name}</span></h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{'location' in game ? game.location : 'Адрес клуба'}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">{formatDate(game.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">{formatTime(game.time)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-red-700/30">
                <p className="text-xs text-gray-400 leading-relaxed">
                  За 15 минут до начала турнира у вас появится возможность узнать номер стола и место за столом во вкладке "посадка".
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Tournament Cards Row */}
        {!gamesLoading && apiGames.length >= 2 && (
          <div className="grid grid-cols-2 gap-3">
            {/* Main Tournament Card */}
            <button 
              onClick={() => handleGameClick(firstGame)}
              className="bg-gradient-to-br from-red-700 to-red-900 rounded-3xl p-4 relative overflow-hidden text-left hover:from-red-600 hover:to-red-800 transition-all"
            >
              <div className="relative z-10">
                {/* Date Badge */}
                <div className="inline-block bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
                  <div className="text-xs text-white/90">{formatDate(firstGame.date)}</div>
                </div>
                
                <div className="mt-3">
                  <div className="mb-1.5">{firstGame.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="text-2xl">{formatTime(firstGame.time)}</div>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                  <ChevronDownIcon className="w-4 h-4 rotate-[-90deg]" />
                </div>
              </div>
            </button>

            {/* Second Tournament */}
            <button 
              onClick={() => handleGameClick(secondGame)}
              className="bg-[#2d2d2d] rounded-3xl p-4 relative overflow-hidden text-left hover:bg-[#353535] transition-all"
            >
              <div className="relative z-10">
                {/* Date Badge */}
                <div className="inline-block bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
                  <div className="text-xs text-white/90">{formatDate(secondGame.date)}</div>
                </div>
                
                <div className="mt-3">
                  <div className="text-gray-300 mb-1.5">{secondGame.name.split(' ')[0]}</div>
                  <div className="text-2xl">{formatTime(secondGame.time)}</div>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center">
                  <ChevronDownIcon className="w-4 h-4 rotate-[-90deg]" />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-3xl p-5 relative overflow-hidden border border-red-900/30">
          <div className="relative z-10">
            {/* Header with Period Switcher */}
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm text-[rgb(255,255,255)] font-normal text-[14px] font-bold">Ваша активность</div>
              
              {/* Period Switcher */}
              <div className="bg-[#0d0d0d]/80 rounded-full mt-[-4px] min-w-[175px] p-[4px] mr-[0px] mb-[0px] ml-[0px]">
                <div className="relative flex items-center">
                  {/* Animated indicator */}
                  <motion.div
                    className="absolute bg-gradient-to-br from-red-700 to-red-900 rounded-full"
                    initial={false}
                    animate={{
                      left: activeIndex === 0 ? '4px' : activeIndex === 1 ? '33.333%' : 'calc(66.666% - 8px)',
                      width: activeIndex === 2 ? 'calc(33.333% + 10px)' : 'calc(33.333% - 6px)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                    style={{
                      height: 'calc(100% - 8px)',
                      top: '4px',
                    }}
                  />

                  <button
                    onClick={() => setActivityPeriod('month')}
                    className="relative py-1.5 z-10 transition-all flex items-center justify-center"
                    style={{ width: '33.333%' }}
                  >
                    <span className={`text-[10px] transition-colors ${activityPeriod === 'month' ? 'text-white' : 'text-gray-400'}`}>
                      Месяц
                    </span>
                  </button>

                  <button
                    onClick={() => setActivityPeriod('year')}
                    className="relative py-1.5 z-10 transition-all flex items-center justify-center"
                    style={{ width: '33.333%' }}
                  >
                    <span className={`text-[10px] transition-colors ${activityPeriod === 'year' ? 'text-white' : 'text-gray-400'}`} style={{ marginLeft: '-2px' }}>
                      Год
                    </span>
                  </button>

                  <button
                    onClick={() => setActivityPeriod('all')}
                    className="relative py-1.5 z-10 transition-all flex items-center justify-center"
                    style={{ width: '33.333%' }}
                  >
                    <span className={`text-[10px] whitespace-nowrap transition-colors ${activityPeriod === 'all' ? 'text-white' : 'text-gray-400'}`}>
                      Всё время
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl mb-1">{currentStats.gamesPlayed}</div>
                <div className="text-xs text-gray-400">Игр сыграно</div>
              </div>
              <div>
                <div className="text-3xl mb-1">{currentStats.wins}</div>
                <div className="text-xs text-gray-400">Количество побед</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={handleSeatingClick}
            className="bg-[#1a1a1a] rounded-2xl p-4 aspect-square flex flex-col items-center justify-center hover:bg-[#252525] transition-all"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              isSeatingAvailable ? 'bg-red-700' : 'bg-red-700/20'
            }`}>
              <LayoutIcon className={`w-5 h-5 ${isSeatingAvailable ? 'text-white' : 'text-red-600'}`} />
            </div>
            <div className="text-xs text-center text-gray-300">Посадка</div>
          </button>
          
          <button 
            onClick={handlePlayersClick}
            className="bg-[#1a1a1a] rounded-2xl p-4 aspect-square flex flex-col items-center justify-center hover:bg-[#252525] transition-all"
          >
            <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center mb-2">
              <UsersIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-xs text-center text-gray-300">Игроки</div>
          </button>

          <button 
            onClick={handleHistoryClick}
            className="bg-[#1a1a1a] rounded-2xl p-4 aspect-square flex flex-col items-center justify-center hover:bg-[#252525] transition-all"
          >
            <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center mb-2">
              <ClockIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-xs text-center text-gray-300">История</div>
          </button>
        </div>

        {/* Club Info Card */}
        <button 
          onClick={handleAboutClubClick}
          className="bg-[#1a1a1a] rounded-3xl p-5 relative overflow-hidden w-full text-left hover:bg-[#252525] transition-all"
        >
          <div className="relative z-10">
            <h3 className="text-lg mb-2">О клубе</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Премиальный покер-клуб для настоящих ценителей игры
            </p>
            <div className="mt-3 text-sm text-red-600 flex items-center gap-1">
              Подробнее
              <ChevronDownIcon className="w-4 h-4 rotate-[-90deg]" />
            </div>
          </div>
        </button>
      </div>

      {/* Dialog for Game Details */}
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

      {/* Seating View */}
      {isSeatingOpen && <SeatingView onClose={onCloseSeating} />}
      {/* Players View */}
      {isPlayersOpen && <PlayersView onClose={onClosePlayers} />}
      {/* History View */}
      {isHistoryOpen && <HistoryView onClose={onCloseHistory} />}
      {/* About Club View */}
      {isAboutClubOpen && <AboutClubView onClose={onCloseAboutClub} />}
    </div>
  );
}
