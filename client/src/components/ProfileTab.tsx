import { useState } from 'react';
import { useUser } from '../hooks/useUser';
import { getInitials, formatRelativeTime } from '../lib/utils';
import { SettingsView } from './SettingsView';
import { useAdmin } from './AdminContext';

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

export function ProfileTab() {
  const { user } = useUser();
  const { isAdmin, setAdminMode } = useAdmin();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleActivateAdminMode = () => {
    setAdminMode(true);
  };

  return (
    <>
      <div className="min-h-screen bg-black pb-24">
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
            <p className="text-sm text-gray-400">Игрок • #{user?.current_rank || '—'} в рейтинге</p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-colors"
          >
            <SettingsIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4">
          <div className="text-sm text-gray-400 mb-3">Статистика</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-xl mb-0.5">{user?.games_won || 0}</div>
              <div className="text-xs text-gray-400">Побед</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-500/20 flex items-center justify-center">
                <TargetIcon className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-xl mb-0.5">{user?.games_played || 0}</div>
              <div className="text-xs text-gray-400">Игр</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                <StarIcon className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-xl mb-0.5">{user?.total_points || 0}</div>
              <div className="text-xs text-gray-400">Очков</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="px-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Достижения</div>
        <div className="grid grid-cols-2 gap-3">
          {user?.achievements && user.achievements.length > 0 ? (
            user.achievements.slice(0, 4).map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-[#1a1a1a] rounded-2xl p-4 border ${getAchievementColor(achievement.color)}`}
              >
                <div className={`w-10 h-10 mb-3 rounded-full ${getAchievementBgColor(achievement.color)} flex items-center justify-center`}>
                  {achievement.icon === 'trophy' && <TrophyIcon className={`w-5 h-5 ${getAchievementIconColor(achievement.color)}`} />}
                  {achievement.icon === 'zap' && <ZapIcon className={`w-5 h-5 ${getAchievementIconColor(achievement.color)}`} />}
                  {achievement.icon === 'star' && <StarIcon className={`w-5 h-5 ${getAchievementIconColor(achievement.color)}`} />}
                  {achievement.icon === 'trending-up' && <TrendingUpIcon className={`w-5 h-5 ${getAchievementIconColor(achievement.color)}`} />}
                </div>
                <h3 className="text-sm mb-1">{achievement.name}</h3>
                <p className="text-xs text-gray-500">{achievement.description}</p>
              </div>
            ))
          ) : (
            <>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-yellow-500/30">
                <div className="w-10 h-10 mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-yellow-500" />
                </div>
                <h3 className="text-sm mb-1">Первая победа</h3>
                <p className="text-xs text-gray-500">Выиграй турнир</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-blue-500/30">
                <div className="w-10 h-10 mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ZapIcon className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-sm mb-1">Активист</h3>
                <p className="text-xs text-gray-500">Сыграй 10 игр</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-purple-500/30">
                <div className="w-10 h-10 mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <StarIcon className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-sm mb-1">Легенда</h3>
                <p className="text-xs text-gray-500">Попади в топ-3</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-green-500/30">
                <div className="w-10 h-10 mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUpIcon className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-sm mb-1">Рост</h3>
                <p className="text-xs text-gray-500">+5 позиций</p>
              </div>
            </>
          )}
        </div>
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
