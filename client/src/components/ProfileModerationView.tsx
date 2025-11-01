import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProfileModeration } from './ProfileModerationContext';
import { toast } from 'sonner';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const UserCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <polyline points="16 11 18 13 22 9"/>
  </svg>
);

interface ProfileModerationViewProps {
  onClose: () => void;
}

export function ProfileModerationView({ onClose }: ProfileModerationViewProps) {
  const { getPendingRequests, approveRequest, rejectRequest, loading, refreshRequests } = useProfileModeration();
  const [pendingRequests, setPendingRequests] = useState(getPendingRequests());
  const [processing, setProcessing] = useState<number | null>(null);

  // Update pending requests when component mounts or when requests change
  useEffect(() => {
    setPendingRequests(getPendingRequests());
  }, [getPendingRequests]);

  // Refresh on mount
  useEffect(() => {
    refreshRequests();
  }, []);

  const handleApprove = async (requestId: number) => {
    setProcessing(requestId);
    try {
      await approveRequest(requestId);
      await refreshRequests(); // Обновляем список с сервера
      setPendingRequests(getPendingRequests()); // Обновляем локальный список
      toast.success('Заявка одобрена');
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Ошибка при одобрении заявки');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setProcessing(requestId);
    try {
      await rejectRequest(requestId);
      await refreshRequests(); // Обновляем список с сервера
      setPendingRequests(getPendingRequests()); // Обновляем локальный список
      toast.success('Заявка отклонена');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Ошибка при отклонении заявки');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[60] overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 py-4 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <UserCheckIcon className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl">Модерация профилей</h2>
          </div>
          {pendingRequests.length > 0 && (
            <span className="text-xs px-3 py-1.5 bg-purple-600/20 border border-purple-600/40 rounded-full text-purple-400">
              {pendingRequests.length}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-6 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Загрузка заявок...</div>
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800"
              >
                <div className="flex items-start gap-3 mb-4">
                  {/* Avatar Preview */}
                  <div className="shrink-0">
                    {request.requestedAvatar !== undefined ? (
                      <div className="flex items-center gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500 text-center">Текущий</div>
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center overflow-hidden border-2 border-gray-700">
                            {request.currentAvatar ? (
                              <img src={request.currentAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{request.currentName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-600 shrink-0 mt-6">→</div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500 text-center">Новый</div>
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center overflow-hidden border-2 border-purple-500/50">
                            {request.requestedAvatar ? (
                              <img src={request.requestedAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center">
                                <XIcon className="w-8 h-8 text-purple-300" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center overflow-hidden border-2 border-gray-700">
                        {request.currentAvatar ? (
                          <img src={request.currentAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{request.currentName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base mb-2 truncate">
                      {request.userName}
                    </div>
                    
                    {request.requestedName && (
                      <div className="bg-[#252525] rounded-lg p-3 mb-2">
                        <div className="text-xs text-gray-500 mb-1">Изменение имени:</div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-gray-400 truncate">{request.currentName}</span>
                          <span className="text-gray-600 shrink-0">→</span>
                          <span className="text-sm text-purple-400 truncate">{request.requestedName}</span>
                        </div>
                      </div>
                    )}
                    
                    {request.requestedAvatar !== undefined && (
                      <div className="bg-[#252525] rounded-lg p-3 mb-2">
                        <div className="text-xs text-gray-500 mb-2">Изменение аватарки:</div>
                        {request.requestedAvatar ? (
                          <div className="space-y-2">
                            <div className="w-full aspect-square max-w-[200px] rounded-xl overflow-hidden border-2 border-purple-500/30">
                              <img src={request.requestedAvatar} alt="Новая аватарка" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm text-purple-400">Новая аватарка</span>
                          </div>
                        ) : (
                          <div className="text-sm text-purple-400">Удалить аватарку</div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {new Date(request.timestamp).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processing === request.id}
                    className="flex-1 h-11 rounded-xl bg-green-600/20 flex items-center justify-center hover:bg-green-600/30 transition-colors border border-green-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-sm text-green-400">
                      {processing === request.id ? 'Обработка...' : 'Принять'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processing === request.id}
                    className="flex-1 h-11 rounded-xl bg-red-600/20 flex items-center justify-center hover:bg-red-600/30 transition-colors border border-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XIcon className="w-5 h-5 text-red-400 mr-2" />
                    <span className="text-sm text-red-400">
                      {processing === request.id ? 'Обработка...' : 'Отклонить'}
                    </span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-gray-800">
              <UserCheckIcon className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-500 text-center mb-2">Нет заявок на модерацию</p>
            <p className="text-xs text-gray-600 text-center">
              Здесь будут появляться заявки<br />на изменение профилей пользователей
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

