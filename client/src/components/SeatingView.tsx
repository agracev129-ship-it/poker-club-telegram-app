import { useState, useEffect } from 'react';
import { gamesAPI } from '../lib/api';
import { useUser } from '../hooks/useUser';

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

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

interface SeatingViewProps {
  onClose: () => void;
}

export function SeatingView({ onClose }: SeatingViewProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [registeredGames, setRegisteredGames] = useState<any[]>([]);
  const [mySeating, setMySeating] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);

  useEffect(() => {
    loadSeatingData();
  }, [user]);

  const loadSeatingData = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      // Загружаем игры пользователя (только started/in_progress турниры)
      const myGames = await gamesAPI.getUserGames('started');
      
      if (myGames.length === 0) {
        setLoading(false);
        return;
      }

      // Берем первую игру
      const game = myGames[0];
      setCurrentGame(game);

      // Загружаем рассадку для этой игры из table_assignments
      const seating = await gamesAPI.getSeating(game.id);
      const mySeat = seating.find((s: any) => s.user_id === user.id);

      if (mySeat) {
        setMySeating({
          table_number: mySeat.table_number,
          seat_number: mySeat.seat_number,
        });
      }

      setRegisteredGames(myGames);
    } catch (error) {
      console.error('Error loading seating:', error);
    } finally {
      setLoading(false);
    }
  };

  const tableNumber = mySeating?.table_number || 0;
  const seatNumber = mySeating?.seat_number || 0;

  // Calculate positions for 11 seats around an oval table
  const seats = Array.from({ length: 11 }, (_, i) => {
    const angle = (i * 32.727) - 90; // Start from top, distribute evenly (360/11 = 32.727)
    const radians = (angle * Math.PI) / 180;
    
    // Oval shape: wider horizontally
    const radiusX = 140;
    const radiusY = 100;
    
    const x = 200 + radiusX * Math.cos(radians);
    const y = 200 + radiusY * Math.sin(radians);
    
    // First position is Dealer (D), positions 2-11 are seats 1-10
    const label = i === 0 ? 'D' : String(i);
    const isDealer = i === 0;
    
    return {
      id: i + 1,
      label,
      x,
      y,
      isPlayer: !isDealer && i === seatNumber, // Player seat matches seatNumber (1-10)
      isDealer,
    };
  });

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto pt-16">
      <div className="min-h-screen pb-8">
        {/* Header with Close Button */}
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl mb-1">Посадка</h2>
            <p className="text-sm text-gray-400">
              {mySeating ? 'Ваше место за столом' : 'Информация о посадке'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="px-4 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="text-gray-400">Загрузка...</div>
            </div>
          </div>
        ) : !currentGame || !mySeating ? (
          <div className="px-4 flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
              </div>
              <h3 className="text-xl mb-3">Посадка недоступна</h3>
              <p className="text-gray-400 leading-relaxed">
                Информация о посадке появится после подтверждения оплаты администратором и начала турнира.
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-24 space-y-6">
            {/* Game Info */}
            <div className="bg-gradient-to-br from-red-700/30 to-red-900/30 rounded-3xl p-5 border border-red-700/50">
              <h3 className="text-lg mb-3">{currentGame.name}</h3>
              <div className="flex items-center gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-red-400" />
                  <span>{new Date(currentGame.date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-red-400" />
                  <span>{currentGame.time}</span>
                </div>
              </div>
            </div>

            {/* Seating Info */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
              <div className="text-sm text-gray-400 mb-3">Ваша посадка</div>
              <div className="flex items-center justify-center gap-8">
                <div>
                  <div className="text-3xl mb-1 text-green-500">#{tableNumber}</div>
                  <div className="text-xs text-gray-400">Стол</div>
                </div>
                <div className="w-px h-12 bg-gray-700"></div>
                <div>
                  <div className="text-3xl mb-1 text-green-500">#{seatNumber}</div>
                  <div className="text-xs text-gray-400">Место</div>
                </div>
              </div>
            </div>

            {/* Poker Table Visualization */}
            <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-gray-800">
              <div className="text-sm text-gray-400 mb-4 text-center">Схема стола</div>
              
              <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Poker Table - Oval Shape */}
                  <ellipse
                    cx="200"
                    cy="200"
                    rx="140"
                    ry="100"
                    fill="black"
                    stroke="white"
                    strokeWidth="2"
                  />

                  {/* Seats */}
                  {seats.map((seat) => (
                    <g key={seat.id}>
                      {/* Seat Circle */}
                      <circle
                        cx={seat.x}
                        cy={seat.y}
                        r="20"
                        fill={seat.isDealer ? '#dc2626' : seat.isPlayer ? '#22c55e' : 'black'}
                        stroke={seat.isDealer ? '#dc2626' : seat.isPlayer ? '#22c55e' : 'white'}
                        strokeWidth="2"
                        opacity={seat.isDealer ? '0.9' : '1'}
                      />
                      {/* Seat Label */}
                      <text
                        x={seat.x}
                        y={seat.y + 5}
                        textAnchor="middle"
                        fill={seat.isDealer ? 'white' : seat.isPlayer ? 'black' : 'white'}
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {seat.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>Ваше место</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-4 border border-gray-700/30">
              <p className="text-xs text-gray-400 leading-relaxed text-center">
                Пожалуйста, займите указанное место за столом №{tableNumber} до начала турнира. 
                В случае опоздания более чем на 15 минут ваше место может быть передано другому игроку.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


