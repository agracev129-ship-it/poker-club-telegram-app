import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HomeTab } from './components/HomeTab';
import { GamesTab } from './components/GamesTab';
import { RatingTab } from './components/RatingTab';
import { ProfileTab } from './components/ProfileTab';
import { GameRegistrationProvider } from './components/GameRegistrationContext';
import { TermsAndConditions } from './components/TermsAndConditions';
import { initTelegramApp } from './lib/telegram';

type TabType = 'home' | 'tournaments' | 'rating' | 'profile';

// Icon components as inline SVGs
const HomeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
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

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [openModals, setOpenModals] = useState({
    seating: false,
    players: false,
    history: false,
    aboutClub: false,
  });
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [isCheckingTerms, setIsCheckingTerms] = useState<boolean>(true);
  const [homeRefreshKey, setHomeRefreshKey] = useState<number>(0);

  useEffect(() => {
    initTelegramApp();
    
    // Check if user has accepted terms
    const accepted = localStorage.getItem('termsAccepted');
    setHasAcceptedTerms(accepted === 'true');
    setIsCheckingTerms(false);
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('termsAccepted', 'true');
    setHasAcceptedTerms(true);
  };

  // Show loading while checking
  if (isCheckingTerms) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  // Show terms if not accepted
  if (!hasAcceptedTerms) {
    return <TermsAndConditions onAccept={handleAcceptTerms} />;
  }

  const tabs: TabType[] = ['home', 'tournaments', 'rating', 'profile'];
  const activeIndex = tabs.indexOf(activeTab);

  const handleTabChange = (tab: TabType) => {
    // If clicking on home tab, close all modals and refresh
    if (tab === 'home') {
      setOpenModals({ seating: false, players: false, history: false, aboutClub: false });
      setHomeRefreshKey(prev => prev + 1); // Force refresh HomeTab
    }
    setActiveTab(tab);
  };

  return (
    <GameRegistrationProvider>
      <div className="min-h-screen bg-black text-white pb-32">
        {/* Content */}
        <div className="h-full">
          {activeTab === 'home' && (
            <HomeTab 
              key={homeRefreshKey} // Пересоздаем при возврате на вкладку
              onOpenSeating={() => setOpenModals(prev => ({ ...prev, seating: true }))}
              onCloseSeating={() => setOpenModals(prev => ({ ...prev, seating: false }))}
              onOpenPlayers={() => setOpenModals(prev => ({ ...prev, players: true }))}
              onClosePlayers={() => setOpenModals(prev => ({ ...prev, players: false }))}
              onOpenHistory={() => setOpenModals(prev => ({ ...prev, history: true }))}
              onCloseHistory={() => setOpenModals(prev => ({ ...prev, history: false }))}
              onOpenAboutClub={() => setOpenModals(prev => ({ ...prev, aboutClub: true }))}
              onCloseAboutClub={() => setOpenModals(prev => ({ ...prev, aboutClub: false }))}
              isSeatingOpen={openModals.seating}
              isPlayersOpen={openModals.players}
              isHistoryOpen={openModals.history}
              isAboutClubOpen={openModals.aboutClub}
            />
          )}
          {activeTab === 'tournaments' && <GamesTab />}
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
                left: `${activeIndex * 25}%`,
                width: '25%',
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
              onClick={() => handleTabChange('home')}
              className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
            >
              <HomeIcon
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
              onClick={() => handleTabChange('tournaments')}
              className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
            >
              <TrophyIcon
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
              onClick={() => handleTabChange('rating')}
              className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
            >
              <TrendingUpIcon
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
              onClick={() => handleTabChange('profile')}
              className="relative flex flex-col items-center gap-1 px-4 py-2 z-10 transition-all flex-1"
            >
              <UserIcon
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
    </GameRegistrationProvider>
  );
}

