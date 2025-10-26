import { useTournaments } from '../hooks/useTournaments';
import { Trophy, Users, Clock, DollarSign } from 'lucide-react';
import { formatDate, formatTime, formatMoney } from '../lib/utils';

export function TournamentsTab() {
  const { tournaments, loading } = useTournaments();

  const activeTournament = tournaments.find(t => t.status === 'registration' || t.status === 'active');
  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming');

  return (
    <div className="min-h-screen bg-black pb-8">
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl mb-1">Турниры</h2>
        <p className="text-sm text-gray-400">Активные и предстоящие турниры</p>
      </div>

      {activeTournament && (
        <div className="px-4 mb-6">
          <h3 className="text-base mb-3 text-gray-300">Активные турниры</h3>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl mb-2" style={{ fontStyle: 'italic' }}>{activeTournament.name}</h3>
                  <div className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Идет регистрация</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Призовой фонд</div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-yellow-500" />
                    <span>{formatMoney(activeTournament.prize_pool || 0)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Участники</div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{activeTournament.registered_count} / {activeTournament.max_players}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Начало</div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatTime(activeTournament.time)}</span>
                  </div>
                </div>
              </div>
              <button className="w-full bg-white text-black rounded-xl py-3 hover:bg-gray-200 transition-colors">
                Зарегистрироваться
              </button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-30">
              <Trophy className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        <h3 className="text-base mb-3 text-gray-300">Предстоящие турниры</h3>
        {loading ? (
          <div className="text-center text-gray-400 py-8">Загрузка...</div>
        ) : upcomingTournaments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Нет предстоящих турниров</div>
        ) : (
          <div className="space-y-4">
            {upcomingTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg" style={{ fontStyle: 'italic' }}>{tournament.name}</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Призовой</div>
                    <div className="text-yellow-500">{formatMoney(tournament.prize_pool || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Игроки</div>
                    <div className="text-gray-300">{tournament.registered_count} / {tournament.max_players}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Дата</div>
                    <div className="text-gray-300">{formatDate(tournament.date)}</div>
                  </div>
                </div>
                <button className="w-full bg-white/10 hover:bg-white/20 transition-colors rounded-xl py-2.5 text-sm">
                  Подробнее
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

