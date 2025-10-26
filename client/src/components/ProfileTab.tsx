import { useUser } from '../hooks/useUser';
import { Trophy, Target, Star, Zap, TrendingUp, Award, MoreVertical, ChevronRight } from 'lucide-react';
import { getInitials, formatRelativeTime, getAchievementColor } from '../lib/utils';

export function ProfileTab() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-black pb-8">
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
          <button className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <MoreVertical className="w-5 h-5 text-white" />
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
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-xl mb-0.5">{user?.games_won || 0}</div>
              <div className="text-xs text-gray-400">Побед</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-xl mb-0.5">{user?.games_played || 0}</div>
              <div className="text-xs text-gray-400">Игр</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-500" />
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
                <div className={`w-10 h-10 mb-3 rounded-full ${getAchievementColor(achievement.color)} flex items-center justify-center`}>
                  {achievement.icon === 'trophy' && <Trophy className="w-5 h-5" />}
                  {achievement.icon === 'zap' && <Zap className="w-5 h-5" />}
                  {achievement.icon === 'star' && <Star className="w-5 h-5" />}
                  {achievement.icon === 'trending-up' && <TrendingUp className="w-5 h-5" />}
                </div>
                <h3 className="text-sm mb-1">{achievement.name}</h3>
                <p className="text-xs text-gray-500">{achievement.description}</p>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center text-gray-500 py-4">
              Достижений пока нет
            </div>
          )}
        </div>
      </div>

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
                  {activity.activity_type === 'game_won' && <Trophy className="w-5 h-5 text-green-500" />}
                  {activity.activity_type === 'achievement_earned' && <Award className="w-5 h-5 text-purple-500" />}
                  {activity.activity_type === 'game_participated' && <Target className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm mb-0.5">{activity.description}</div>
                  <div className="text-xs text-gray-500 truncate">Активность</div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">{formatRelativeTime(activity.created_at)}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              Активностей пока нет
            </div>
          )}
        </div>
      </div>

      {/* Settings Card */}
      <div className="px-4">
        <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl p-4 border border-red-900/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center">
              <MoreVertical className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm">Настройки профиля</div>
              <div className="text-xs text-gray-400">Данные и приватность</div>
            </div>
          </div>
          <button className="text-sm text-red-600 flex items-center gap-1">
            Открыть
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

