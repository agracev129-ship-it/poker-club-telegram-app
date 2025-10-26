import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HomeTab } from './components/HomeTab';
import { GamesTab } from './components/GamesTab';
import { TournamentsTab } from './components/TournamentsTab';
import { RatingTab } from './components/RatingTab';
import { ProfileTab } from './components/ProfileTab';
import { Home, Gamepad2, Trophy, TrendingUp, User } from 'lucide-react';
import { initTelegramApp } from './lib/telegram';

type TabType = 'home' | 'games' | 'tournaments' | 'rating' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  useEffect(() => {
    initTelegramApp();
  }, []);

  const tabs: TabType[] = ['home', 'games', 'tournaments', 'rating', 'profile'];
  const activeIndex = tabs.indexOf(activeTab);

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Content */}
      <div className="h-full">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'games' && <GamesTab />}
        {activeTab === 'tournaments' && <TournamentsTab />}
        {activeTab === 'rating' && <RatingTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 px-2 py-3 z-50">
        <div className="relative flex items-center justify-around max-w-md mx-auto">
          {/* Animated indicator */}
          <motion.div
            className="absolute bg-red-700/20 rounded-2xl"
            initial={false}
            animate={{
              left: `${activeIndex * 20}%`,
              width: '20%',
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            style={{
              height: '100%',
              top: 0,
            }}
          />

          <button
            onClick={() => setActiveTab('home')}
            className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
          >
            <Home
              className={`w-6 h-6 transition-all ${
                activeTab === 'home' ? 'text-white scale-110' : 'text-gray-500'
              }`}
            />
            <span
              className={`text-xs ${
                activeTab === 'home' ? 'text-white' : 'text-gray-500'
              }`}
            >
              Главная
            </span>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
          >
            <Gamepad2
              className={`w-6 h-6 transition-all ${
                activeTab === 'games' ? 'text-white scale-110' : 'text-gray-500'
              }`}
            />
            <span
              className={`text-xs ${
                activeTab === 'games' ? 'text-white' : 'text-gray-500'
              }`}
            >
              Игры
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tournaments')}
            className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
          >
            <Trophy
              className={`w-6 h-6 transition-all ${
                activeTab === 'tournaments' ? 'text-white scale-110' : 'text-gray-500'
              }`}
            />
            <span
              className={`text-xs ${
                activeTab === 'tournaments' ? 'text-white' : 'text-gray-500'
              }`}
            >
              Турниры
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rating')}
            className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
          >
            <TrendingUp
              className={`w-6 h-6 transition-all ${
                activeTab === 'rating' ? 'text-white scale-110' : 'text-gray-500'
              }`}
            />
            <span
              className={`text-xs ${
                activeTab === 'rating' ? 'text-white' : 'text-gray-500'
              }`}
            >
              Рейтинг
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
          >
            <User
              className={`w-6 h-6 transition-all ${
                activeTab === 'profile' ? 'text-white scale-110' : 'text-gray-500'
              }`}
            />
            <span
              className={`text-xs ${
                activeTab === 'profile' ? 'text-white' : 'text-gray-500'
              }`}
            >
              Профиль
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

