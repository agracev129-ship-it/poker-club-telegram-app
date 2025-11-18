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
  const { toggleRegistration: localToggle, isRegistered: checkIsRegistered, registeredGames} = useGameRegistration();

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

  // Функция для получения текущего московского времени (в миллисекундах UTC)
  const getMoscowTime = (): number => {
    const now = new Date();
    // Получаем UTC время в миллисекундах
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // Москва = UTC+3, добавляем 3 часа
    return utc + (3 * 3600000);
  };

  // Функция для парсинга даты и времени игры в московское время (в миллисекундах UTC)
  // Предполагаем, что date и time хранятся в московском времени
  const parseGameDateTime = (dateStr: string, timeStr: string): number => {
    // Парсим дату в формате YYYY-MM-DD или DD.MM.YYYY
    let year: number, month: number, day: number;
    
    if (dateStr.includes('-')) {
      // Формат YYYY-MM-DD
      const parts = dateStr.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // месяцы в JS начинаются с 0
      day = parseInt(parts[2], 10);
    } else if (dateStr.includes('.')) {
      // Формат DD.MM.YYYY
      const parts = dateStr.split('.');
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    } else {
      // Пытаемся распарсить как есть
      const d = new Date(dateStr);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }
    
    // Парсим время в формате HH:MM
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    
    // Создаем дату в московском времени
    // Используем Date.UTC для создания UTC времени, вычитая 3 часа (так как московское время = UTC+3)
    const utcTime = Date.UTC(year, month, day, hours - 3, minutes, 0, 0);
    
    return utcTime;
  };

  useEffect(() => {
    // Calculate time until next game using Moscow time
    const calculateTimeLeft = () => {
      if (!firstGame || !firstGame.date || !firstGame.time) {
        setTimeLeft({ hours: 0, minutes: 0 });
        return;
      }

      try {
        const moscowNow = getMoscowTime(); // московское время в миллисекундах UTC
        const gameDateTime = parseGameDateTime(firstGame.date, firstGame.time); // время игры в миллисекундах UTC
        
        const diff = gameDateTime - moscowNow;
        
        if (diff < 0) {
          // Игра уже прошла или началась
          setTimeLeft({ hours: 0, minutes: 0 });
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft({ hours, minutes });
      } catch (error) {
        console.error('Error calculating time left:', error);
        setTimeLeft({ hours: 0, minutes: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [firstGame]);

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
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
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
          <div className="flex items-center gap-2">
            {firstGame && firstGame.tournament_status === 'started' ? (
              <>
                <div className="text-xs text-gray-400">Статус:</div>
                <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-2xl px-3 py-2 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-green-200" />
                  <div className="text-sm">
                    <span className="text-white">В процессе</span>
                  </div>
                </div>
              </>
            ) : firstGame ? (
              <>
                <div className="text-xs text-gray-400">До игры:</div>
                <div className="bg-[#1a1a1a] rounded-2xl px-3 py-2 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-red-500" />
                  <div className="text-sm">
                    <span className="text-white">{timeLeft.hours}ч {timeLeft.minutes}м</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
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
        <div className="grid grid-cols-2 gap-3">
          {/* Main Tournament Card */}
          {firstGame ? (
            <button 
              onClick={() => handleGameClick(firstGame)}
              className={`rounded-3xl p-4 relative overflow-hidden text-left transition-all ${
                firstGame.tournament_status === 'started'
                  ? 'bg-gradient-to-br from-green-700 to-green-900 hover:from-green-600 hover:to-green-800'
                  : 'bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800'
              }`}
            >
              <div className="relative z-10">
                {/* Date Badge / Status Badge */}
                <div className="inline-block bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
                  <div className="text-xs text-white/90">
                    {firstGame.tournament_status === 'started' ? 'В процессе' : formatDate(firstGame.date)}
                  </div>
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
          ) : (
            <div className="rounded-3xl p-4 relative overflow-hidden bg-[#1a1a1a] border border-gray-800 flex items-center justify-center min-h-[140px]">
              <div className="text-center px-2">
                <CalendarIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <div className="text-xs text-gray-500">Турниров нет</div>
              </div>
            </div>
          )}

          {/* Second Tournament */}
          {secondGame ? (
            <button 
              onClick={() => handleGameClick(secondGame)}
              className={`rounded-3xl p-4 relative overflow-hidden text-left transition-all ${
                secondGame.tournament_status === 'started'
                  ? 'bg-gradient-to-br from-green-800/60 to-green-900/60 hover:bg-gradient-to-br hover:from-green-800/70 hover:to-green-900/70'
                  : 'bg-[#2d2d2d] hover:bg-[#353535]'
              }`}
            >
              <div className="relative z-10">
                {/* Date Badge / Status Badge */}
                <div className={`inline-block backdrop-blur-sm px-3 py-1.5 rounded-full mb-3 ${
                  secondGame.tournament_status === 'started' ? 'bg-white/15' : 'bg-white/5'
                }`}>
                  <div className="text-xs text-white/90">
                    {secondGame.tournament_status === 'started' ? 'В процессе' : formatDate(secondGame.date)}
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="text-gray-300 mb-1.5">{secondGame.name.split(' ')[0]}</div>
                  <div className="text-2xl">{formatTime(secondGame.time)}</div>
                </div>
                <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ${
                  secondGame.tournament_status === 'started' ? 'bg-black/20' : 'bg-white/5'
                }`}>
                  <ChevronDownIcon className="w-4 h-4 rotate-[-90deg]" />
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-3xl p-4 relative overflow-hidden bg-[#1a1a1a] border border-gray-800 flex items-center justify-center min-h-[140px]">
              <div className="text-center px-2">
                <CalendarIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <div className="text-xs text-gray-500">Турниров нет</div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-3xl p-5 relative overflow-hidden border border-red-900/30">
          <div className="relative z-10">
            {/* Header with Period Switcher */}
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm text-[rgb(255,255,255)] font-normal text-[15px] font-bold">Ваша активность</div>
              
              {/* Period Switcher */}
              <div className="bg-[rgba(13,13,13,0.8)] rounded-full mt-[-4px]" style={{ width: '193px', height: '35px' }}>
                <div className="relative flex items-center h-[27px] mt-[3.99px] mx-[3.99px]">
                  {/* Animated indicator */}
                  <motion.div
                    className="absolute bg-gradient-to-br from-red-700 to-red-900 rounded-full"
                    initial={false}
                    animate={{
                      left: activeIndex === 0 ? '3px' : activeIndex === 1 ? '58.006px' : '117.012px',
                      width: '57.33px',
                    }}
                    transition={{
                      type: 'tween',
                      duration: 0.3,
                      ease: 'easeInOut',
                    }}
                    style={{
                      height: '18.991px',
                      top: '3.99px',
                    }}
                  />

                  <button
                    onClick={() => setActivityPeriod('month')}
                    className="relative z-10 transition-all flex items-center justify-center h-[27px]"
                    style={{ width: '58.006px' }}
                  >
                    <span className={`text-[10px] transition-colors ${activityPeriod === 'month' ? 'text-white' : 'text-[#99a1af]'}`}>
                      Месяц
                    </span>
                  </button>

                  <button
                    onClick={() => setActivityPeriod('year')}
                    className="relative z-10 transition-all flex items-center justify-center h-[27px]"
                    style={{ width: '58.006px' }}
                  >
                    <span className={`text-[10px] transition-colors ${activityPeriod === 'year' ? 'text-white' : 'text-[#99a1af]'}`}>
                      Год
                    </span>
                  </button>

                  <button
                    onClick={() => setActivityPeriod('all')}
                    className="relative z-10 transition-all flex items-center justify-center h-[27px]"
                    style={{ width: '58.006px' }}
                  >
                    <span className={`text-[10px] whitespace-nowrap transition-colors ${activityPeriod === 'all' ? 'text-white' : 'text-[#99a1af]'}`}>
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

        {/* Club Info Card with Cards Background */}
        <button 
          onClick={handleAboutClubClick}
          className="rounded-3xl p-5 relative overflow-hidden w-full text-left transition-all"
        >
          {/* Background Image with Poker Cards and Chips */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1560526396-82d093122bda?w=1200&auto=format&fit=crop&q=90')`,
            }}
          ></div>
          {/* Dark overlay for readability with red tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-red-950/70 to-black/85 hover:from-black/75 hover:via-red-950/65 hover:to-black/80 transition-all"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg mb-2 text-white font-medium">О клубе</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Премиальный покер-клуб для настоящих ценителей игры
            </p>
            <div className="mt-3 text-sm text-red-500 flex items-center gap-1 font-medium">
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
