import { motion } from 'motion/react';

// Icon components
const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
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

// Participant interface
export interface Participant {
  id: number;
  name: string;
  position: number;
  avatar: string;
  prize?: string;
}

interface GameParticipantsViewProps {
  onClose: () => void;
  gameName: string;
  gameDate: string;
  participants: Participant[];
}

export function GameParticipantsView({ onClose, gameName, gameDate, participants }: GameParticipantsViewProps) {
  // Sort participants by position
  const sortedParticipants = [...participants].sort((a, b) => a.position - b.position);

  // Get medal color based on position
  const getMedalColor = (position: number) => {
    if (position === 1) return 'text-yellow-400';
    if (position === 2) return 'text-gray-300';
    if (position === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  const getPositionBg = (position: number) => {
    if (position === 1) return 'bg-gradient-to-br from-yellow-600/30 to-yellow-800/30 border-yellow-600/40';
    if (position === 2) return 'bg-gradient-to-br from-gray-600/30 to-gray-800/30 border-gray-600/40';
    if (position === 3) return 'bg-gradient-to-br from-orange-600/30 to-orange-800/30 border-orange-600/40';
    return 'bg-[#1a1a1a] border-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col pt-16">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl mb-1">{gameName}</h2>
            <p className="text-sm text-gray-400">{gameDate}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-colors flex-shrink-0 ml-3"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-4 border border-red-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-700/30 rounded-full flex items-center justify-center">
              <TrophyIcon className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400">Всего участников</div>
              <div className="text-xl">{participants.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="space-y-3">
          {sortedParticipants.map((participant) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl p-4 border relative overflow-hidden ${getPositionBg(participant.position)}`}
            >
              <div className="flex items-center gap-4">
                {/* Position */}
                <div className="flex-shrink-0">
                  {participant.position <= 3 ? (
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                        <MedalIcon className={`w-6 h-6 ${getMedalColor(participant.position)}`} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center text-xs">
                        {participant.position}
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-700/30 flex items-center justify-center">
                      <span className="text-lg text-gray-400">{participant.position}</span>
                    </div>
                  )}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-lg flex-shrink-0">
                    {participant.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{participant.name}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}


