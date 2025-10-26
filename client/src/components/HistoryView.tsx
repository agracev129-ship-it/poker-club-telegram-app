import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { GameParticipantsView, Participant } from './GameParticipantsView';

// Helper function to format date
const formatDate = (date: Date): string => {
  const monthsFull = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  return `${date.getDate()} ${monthsFull[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateShort = (date: Date): string => {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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

// Mock data for game history
interface GameHistory {
  id: number;
  name: string;
  date: string;
  time: string;
  players: string;
  buyIn: string;
  prize: string;
  position?: number;
  participated: boolean;
}

// Function to generate mock participants for a game
const generateParticipants = (gameId: number, totalPlayers: number, userPosition?: number): Participant[] => {
  const names = [
    'Александр Иванов', 'Дмитрий Петров', 'Сергей Смирнов', 'Андрей Кузнецов',
    'Максим Попов', 'Игорь Васильев', 'Владимир Соколов', 'Павел Михайлов',
    'Николай Федоров', 'Артем Морозов', 'Виктор Волков', 'Денис Алексеев',
    'Роман Лебедев', 'Евгений Семенов', 'Олег Егоров', 'Илья Павлов',
    'Константин Козлов', 'Антон Степанов', 'Вадим Николаев', 'Юрий Орлов',
    'Михаил Андреев', 'Станислав Макаров', 'Борис Никитин', 'Григорий Захаров',
    'Леонид Зайцев', 'Валерий Соловьев', 'Геннадий Борисов', 'Тимур Яковлев',
    'Кирилл Григорьев', 'Глеб Романов'
  ];
  
  const avatars = ['🎯', '🎲', '🃏', '💎', '⭐', '🔥', '⚡', '🎪', '🎭', '🎨', '🎸', '🎺', '🎻', '🎹', '🥁', '🎤'];
  
  const prizes = ['50,000₽', '30,000₽', '20,000₽'];
  
  const participants: Participant[] = [];
  
  for (let i = 0; i < totalPlayers; i++) {
    const position = i + 1;
    const isUser = userPosition !== undefined && position === userPosition;
    
    participants.push({
      id: i + 1,
      name: isUser ? 'Вы (Игрок)' : names[i % names.length],
      position,
      avatar: avatars[i % avatars.length],
      prize: position <= 3 ? prizes[position - 1] : undefined,
    });
  }
  
  return participants;
};

const gameHistory: GameHistory[] = [
  {
    id: 1,
    name: 'Турнир Холдем',
    date: '26 окт 2024',
    time: '19:00',
    players: '24/30',
    buyIn: '5,000₽',
    prize: '120,000₽',
    position: 3,
    participated: true,
  },
  {
    id: 2,
    name: 'Омаха PLO',
    date: '25 окт 2024',
    time: '20:00',
    players: '18/20',
    buyIn: '3,000₽',
    prize: '54,000₽',
    participated: false,
  },
  {
    id: 3,
    name: 'Турнир Холдем',
    date: '24 окт 2024',
    time: '19:00',
    players: '30/30',
    buyIn: '5,000₽',
    prize: '150,000₽',
    position: 1,
    participated: true,
  },
  {
    id: 4,
    name: 'Быстрый турнир',
    date: '23 окт 2024',
    time: '18:00',
    players: '16/20',
    buyIn: '2,000₽',
    prize: '32,000₽',
    participated: false,
  },
  {
    id: 5,
    name: 'Турнир Холдем',
    date: '22 окт 2024',
    time: '19:00',
    players: '28/30',
    buyIn: '5,000₽',
    prize: '140,000₽',
    position: 7,
    participated: true,
  },
  {
    id: 6,
    name: 'Омаха PLO',
    date: '21 окт 2024',
    time: '20:00',
    players: '20/20',
    buyIn: '3,000₽',
    prize: '60,000₽',
    participated: false,
  },
  {
    id: 7,
    name: 'Турнир Холдем',
    date: '20 окт 2024',
    time: '19:00',
    players: '25/30',
    buyIn: '5,000₽',
    prize: '125,000₽',
    position: 5,
    participated: true,
  },
  {
    id: 8,
    name: 'Быстрый турнир',
    date: '19 окт 2024',
    time: '18:00',
    players: '18/20',
    buyIn: '2,000₽',
    prize: '36,000₽',
    participated: false,
  },
];

type TabType = 'all' | 'my';

interface HistoryViewProps {
  onClose: () => void;
}

export function HistoryView({ onClose }: HistoryViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const tabs: TabType[] = ['all', 'my'];
  const activeIndex = tabs.indexOf(activeTab);

  // Filter games based on active tab and selected date
  const filteredGames = gameHistory.filter(game => {
    const tabMatch = activeTab === 'all' || (activeTab === 'my' && game.participated);
    
    if (!selectedDate) return tabMatch;
    
    // Simple date matching (in real app would use proper date parsing)
    const gameDate = game.date.toLowerCase();
    const selectedDateStr = formatDateShort(selectedDate).toLowerCase();
    
    return tabMatch && gameDate === selectedDateStr;
  });

  // Handle game click to show participants
  const handleGameClick = (game: GameHistory) => {
    setSelectedGame(game);
    setShowParticipants(true);
  };

  // If showing participants, render GameParticipantsView
  if (showParticipants && selectedGame) {
    const totalPlayers = parseInt(selectedGame.players.split('/')[0]);
    const participants = generateParticipants(
      selectedGame.id,
      totalPlayers,
      selectedGame.position
    );

    return (
      <GameParticipantsView
        onClose={() => setShowParticipants(false)}
        gameName={selectedGame.name}
        gameDate={`${selectedGame.date} в ${selectedGame.time}`}
        participants={participants}
      />
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
            filteredGames.map((game) => (
              <div
                key={game.id}
                className={`rounded-3xl p-5 relative overflow-hidden cursor-pointer transition-all ${
                  game.participated
                    ? 'bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-900/30 hover:from-red-900/40 hover:to-red-950/40'
                    : 'bg-[#1a1a1a] border border-gray-800 hover:bg-[#252525]'
                }`}
                onClick={() => handleGameClick(game)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg">{game.name}</h3>
                      {game.participated && game.position && (
                        <div className="flex items-center gap-1 bg-red-700/30 px-2 py-1 rounded-full">
                          <MedalIcon className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-xs text-red-400">{game.position} место</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{game.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        <span>{game.time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-800">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Игроки</div>
                    <div className="flex items-center gap-1.5">
                      <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-300">{game.players}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Бай-ин</div>
                    <div className="text-sm text-gray-300">{game.buyIn}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Призовой</div>
                    <div className="text-sm text-gray-300">{game.prize}</div>
                  </div>
                </div>

                {game.participated && (
                  <div className="mt-3 pt-3 border-t border-red-900/30">
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span>Вы участвовали в этой игре</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

