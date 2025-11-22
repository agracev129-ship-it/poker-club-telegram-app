import { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { getInitials, formatRelativeTime } from '../lib/utils';
import { getIOSPaddingTop } from '../lib/platform';
import { SettingsView } from './SettingsView';
import { useAdmin } from './AdminContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { usersAPI, User, gamesAPI } from '../lib/api';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

// Icon components as inline SVGs
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const MoreVerticalIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="5" r="1"/>
    <circle cx="12" cy="19" r="1"/>
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
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

const TargetIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const ZapIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);

const AwardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const getAchievementColor = (color?: string) => {
  switch (color) {
    case 'yellow':
      return 'border-yellow-500/30';
    case 'blue':
      return 'border-blue-500/30';
    case 'purple':
      return 'border-purple-500/30';
    case 'green':
      return 'border-green-500/30';
    default:
      return 'border-yellow-500/30';
  }
};

const getAchievementBgColor = (color?: string) => {
  switch (color) {
    case 'yellow':
      return 'bg-yellow-500/20';
    case 'blue':
      return 'bg-blue-500/20';
    case 'purple':
      return 'bg-purple-500/20';
    case 'green':
      return 'bg-green-500/20';
    default:
      return 'bg-yellow-500/20';
  }
};

const getAchievementIconColor = (color?: string) => {
  switch (color) {
    case 'yellow':
      return 'text-yellow-500';
    case 'blue':
      return 'text-blue-500';
    case 'purple':
      return 'text-purple-500';
    case 'green':
      return 'text-green-500';
    default:
      return 'text-yellow-500';
  }
};

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
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

const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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

const SpadeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 9c-1.5 1.5-3 3.2-3 5.5A5.5 5.5 0 0 0 7.5 20c1.8 0 3-.5 4.5-2 1.5 1.5 2.7 2 4.5 2a5.5 5.5 0 0 0 5.5-5.5c0-2.3-1.5-4-3-5.5l-6-6.5-6 6.5Z"/>
    <path d="M12 18v4"/>
  </svg>
);

export function ProfileTab() {
  const { user } = useUser();
  const { isAdmin, setAdminMode } = useAdmin();
  const { leaderboard } = useLeaderboard(100);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [isUnlockedOpen, setIsUnlockedOpen] = useState(true);
  const [isLockedOpen, setIsLockedOpen] = useState(false);
  const [lastGamePlace, setLastGamePlace] = useState<number | null>(null);

  // Вычисляем позицию пользователя из рейтинга
  useEffect(() => {
    if (user && leaderboard.length > 0) {
      const rank = leaderboard.findIndex(p => p.id === user.id) + 1;
      setUserRank(rank > 0 ? rank : (user.current_rank || null));
    } else if (user?.current_rank) {
      setUserRank(user.current_rank);
    }
  }, [user, leaderboard]);

  // Загружаем список друзей
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsList = await usersAPI.getFriends();
        setFriends(friendsList);
      } catch (error) {
        console.error('Error loading friends:', error);
        setFriends([]);
      }
    };
    loadFriends();
  }, []);

  // Загружаем место в последней игре
  useEffect(() => {
    const loadLastGamePlace = async () => {
      if (!user?.id) return;
      
      try {
        console.log('Loading last game place for user:', user.id);
        const lastGame = await gamesAPI.getLastFinishedGame(user.id);
        console.log('Last game result:', lastGame);
        
        // ВАЖНО: Берем место из finish_place в table_assignments, а не из рейтинга
        // finish_place = 1 означает первое место, 2 = второе место и т.д.
        if (lastGame && lastGame.finish_place !== null && lastGame.finish_place !== undefined) {
          console.log('Last game data:', {
            gameId: lastGame.id,
            gameName: lastGame.name,
            finishPlace: lastGame.finish_place,
            isEliminated: lastGame.is_eliminated,
            pointsEarned: lastGame.points_earned
          });
          console.log('Setting last game place:', lastGame.finish_place);
          setLastGamePlace(lastGame.finish_place);
        } else {
          console.log('No finish_place found, setting to null');
          setLastGamePlace(null);
        }
      } catch (error) {
        console.error('Error loading last game place:', error);
        setLastGamePlace(null);
      }
    };
    loadLastGamePlace();
  }, [user?.id]);

  const handleActivateAdminMode = () => {
    setAdminMode(true);
  };

  return (
    <>
      <div className={`min-h-screen bg-black pb-24 ${getIOSPaddingTop()}`}>
        {/* Profile Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-6">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-red-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-2 border-red-700">
              <span className="text-2xl">{getInitials(user?.first_name || 'U', user?.last_name)}</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl mb-1">{user?.first_name || 'Игрок'} {user?.last_name || ''}</h1>
            <p className="text-sm text-gray-400">Игрок • #{userRank || '—'} в рейтинге</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-colors"
            >
              <SettingsIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4">
          <div className="text-sm text-gray-400 mb-3">Статистика</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-xl mb-0.5">{user?.games_won || 0}</div>
              <div className="text-xs text-gray-400">Побед</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-700/20 flex items-center justify-center">
                <TargetIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-xl mb-0.5">{user?.games_played || 0}</div>
              <div className="text-xs text-gray-400">Игр</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
                <MedalIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-xl mb-0.5">{lastGamePlace || '—'}</div>
              <div className="text-xs text-gray-400">Место в последней игре</div>
            </div>
          </div>
        </div>
      </div>

      {/* Friends Section */}
      {friends.length > 0 && (
        <div className="mb-4">
          <div className="px-4 flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Друзья</div>
            <div className="text-xs text-gray-500">{friends.length}</div>
          </div>
          <div className="px-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl py-4 overflow-hidden">
              <div className="flex items-center gap-3 overflow-x-auto pb-1 -mb-1 scrollbar-hide px-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex flex-col items-center gap-2 min-w-[60px] flex-shrink-0">
                    {friend.photo_url ? (
                      <img
                        src={friend.photo_url}
                        alt={friend.first_name}
                        className="w-12 h-12 rounded-full object-cover border border-red-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-lg border border-red-800">
                        {getInitials(friend.first_name, friend.last_name)}
                      </div>
                    )}
                    <div className="text-xs text-gray-300 text-center truncate w-full">
                      {friend.first_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      <div className="px-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Достижения</div>
        
        {/* Unlocked Achievements */}
        <Collapsible open={isUnlockedOpen} onOpenChange={setIsUnlockedOpen} className="mb-2">
          <CollapsibleTrigger className="w-full">
            <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-4 border border-red-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-700/20 flex items-center justify-center">
                  <AwardIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm">Открытые достижения</div>
                  <div className="text-xs text-gray-400">{user?.achievements?.length || 3} из 6</div>
                </div>
              </div>
              <ChevronDownIcon className={`w-5 h-5 text-red-600 transition-transform ${isUnlockedOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {user?.achievements && user.achievements.length > 0 ? (
                user.achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-gradient-to-br from-red-900/20 to-red-950/20 rounded-xl p-3 border border-red-900/20 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAchievementBgColor(achievement.color)} flex items-center justify-center shrink-0`}>
                      {achievement.icon === 'trophy' && <TrophyIcon className={`w-5 h-5 ${getAchievementIconColor(achievement.color)}`} />}
                      {achievement.icon === 'zap' && <ZapIcon className={`w-5 h-5 ${getAchievementIconColor(achievement.color)}`} />}
                      {achievement.icon === 'star' && <StarIcon className={`w-5 h-5 ${getAchievementIconColor(achievement.color)}`} />}
                      {achievement.icon === 'trending-up' && <TrendingUpIcon className={`w-5 h-5 ${getAchievementIconColor(achievement.color)}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">{achievement.name}</div>
                      <div className="text-xs text-gray-500">{achievement.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 rounded-xl p-3 border border-red-900/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-700/20 flex items-center justify-center shrink-0">
                      <SpadeIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">Первые шаги</div>
                      <div className="text-xs text-gray-500">Сыграл первую игру</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 rounded-xl p-3 border border-red-900/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-700/20 flex items-center justify-center shrink-0">
                      <ZapIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">Активист</div>
                      <div className="text-xs text-gray-500">Сыграл 10 игр</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 rounded-xl p-3 border border-red-900/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-700/20 flex items-center justify-center shrink-0">
                      <TrophyIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">Первая победа</div>
                      <div className="text-xs text-gray-500">Победил в турнире</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Locked Achievements */}
        <Collapsible open={isLockedOpen} onOpenChange={setIsLockedOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700/20 flex items-center justify-center">
                  <LockIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-400">Закрытые достижения</div>
                  <div className="text-xs text-gray-600">3 достижений</div>
                </div>
              </div>
              <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isLockedOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              <div className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800 flex items-center gap-3 opacity-60">
                <div className="w-10 h-10 rounded-full bg-gray-700/20 flex items-center justify-center shrink-0">
                  <MedalIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Чемпион</div>
                  <div className="text-xs text-gray-600">Победи в 5 турнирах</div>
                </div>
                <LockIcon className="w-4 h-4 text-gray-600 shrink-0" />
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800 flex items-center gap-3 opacity-60">
                <div className="w-10 h-10 rounded-full bg-gray-700/20 flex items-center justify-center shrink-0">
                  <StarIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Легенда сезона</div>
                  <div className="text-xs text-gray-600">Попади в топ-3 сезона</div>
                </div>
                <LockIcon className="w-4 h-4 text-gray-600 shrink-0" />
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800 flex items-center gap-3 opacity-60">
                <div className="w-10 h-10 rounded-full bg-gray-700/20 flex items-center justify-center shrink-0">
                  <TargetIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Ветеран</div>
                  <div className="text-xs text-gray-600">Сыграй 100 игр</div>
                </div>
                <LockIcon className="w-4 h-4 text-gray-600 shrink-0" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Admin Mode Activation (only for admins) */}
      {isAdmin && (
        <div className="px-4 mb-4">
          <button
            onClick={handleActivateAdminMode}
            className="w-full bg-gradient-to-br from-red-700/40 to-red-900/40 rounded-2xl p-4 border border-red-700/50 hover:from-red-700/50 hover:to-red-900/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-700/30 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm">Режим администратора</div>
                  <div className="text-xs text-gray-400">Управление турнирами и пользователями</div>
                </div>
              </div>
              <ChevronDownIcon className="w-5 h-5 rotate-[-90deg]" />
            </div>
          </button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="px-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Последняя активность</div>
        <div className="space-y-2">
          {user?.activities && user.activities.length > 0 ? (
            user.activities.slice(0, 3).map((activity) => (
              <div
                key={activity.id}
                className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3 border border-gray-800"
              >
                <div className={`w-10 h-10 rounded-full ${
                  activity.activity_type === 'game_won' ? 'bg-green-500/20' : 
                  activity.activity_type === 'achievement_earned' ? 'bg-purple-500/20' : 
                  'bg-red-500/20'
                } flex items-center justify-center shrink-0`}>
                  {activity.activity_type === 'game_won' && <TrophyIcon className="w-5 h-5 text-green-500" />}
                  {activity.activity_type === 'achievement_earned' && <AwardIcon className="w-5 h-5 text-purple-500" />}
                  {activity.activity_type === 'game_participated' && <TargetIcon className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm mb-0.5">{activity.description}</div>
                  <div className="text-xs text-gray-500 truncate">Активность</div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">{formatRelativeTime(activity.created_at)}</div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3 border border-gray-800">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <TrophyIcon className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm mb-0.5">Победа в турнире</div>
                  <div className="text-xs text-gray-500 truncate">DEEP CLASSIC TOURNAMENT</div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">2д</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3 border border-gray-800">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <TargetIcon className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm mb-0.5">Участие в игре</div>
                  <div className="text-xs text-gray-500 truncate">TEXAS HOLDEM CLASSIC</div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">5д</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3 border border-gray-800">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <AwardIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm mb-0.5">Новое достижение</div>
                  <div className="text-xs text-gray-500 truncate">Активист</div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">1н</div>
              </div>
            </>
          )}
        </div>
      </div>

      </div>

      {/* Settings View Modal */}
      {isSettingsOpen && (
        <SettingsView onClose={() => setIsSettingsOpen(false)} />
      )}

    </>
  );
}
