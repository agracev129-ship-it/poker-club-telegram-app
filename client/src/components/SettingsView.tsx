import { useState, useRef, useEffect } from 'react';
import { Switch } from './ui/switch';
import { useUser } from '../hooks/useUser';
import { getInitials } from '../lib/utils';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const CameraIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

interface SettingsViewProps {
  onClose: () => void;
}

export function SettingsView({ onClose }: SettingsViewProps) {
  const { user, loading } = useUser();
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Notification settings (stored locally for now)
  const [upcomingGames, setUpcomingGames] = useState(false);
  const [friendRegistration, setFriendRegistration] = useState(false);
  const [friendRequests, setFriendRequests] = useState(false);
  
  // Other settings
  const [allowFriendRequests, setAllowFriendRequests] = useState(false);
  const [notifyFriendsOnRegistration, setNotifyFriendsOnRegistration] = useState(true);

  useEffect(() => {
    if (user) {
      setUserName(user.first_name || 'Игрок');
    }
    
    // Load settings from localStorage
    const settings = localStorage.getItem('appSettings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setUpcomingGames(parsed.upcomingGames || false);
        setFriendRegistration(parsed.friendRegistration || false);
        setFriendRequests(parsed.friendRequests || false);
        setAllowFriendRequests(parsed.allowFriendRequests || false);
        setNotifyFriendsOnRegistration(parsed.notifyFriendsOnRegistration !== false);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, [user]);

  const saveSettings = () => {
    const settings = {
      upcomingGames,
      friendRegistration,
      friendRequests,
      allowFriendRequests,
      notifyFriendsOnRegistration,
    };
    localStorage.setItem('appSettings', JSON.stringify(settings));
  };

  useEffect(() => {
    saveSettings();
  }, [upcomingGames, friendRegistration, friendRequests, allowFriendRequests, notifyFriendsOnRegistration]);

  const handleNameSave = () => {
    setIsEditingName(false);
    // TODO: Save name to backend API when implemented
    console.log('Saving name:', userName);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Upload image to backend when implemented
      console.log('Selected file:', file.name);
      alert('Загрузка аватарки будет реализована в будущей версии');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <p className="text-white">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Header - sticky на самом верху */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 py-4 z-10 pt-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-xl">Настройки</h2>
        </div>
      </div>

      <div className="px-4 py-6 pb-24 space-y-6">
        {/* Profile Section */}
        <div className="bg-[#1a1a1a] rounded-3xl p-6">
          <h3 className="text-lg mb-4">Профиль</h3>
          
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-red-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-2xl border-2 border-red-700">
                  {getInitials(user?.first_name || 'И', user?.last_name)}
                </div>
              )}
              <button 
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 w-8 h-8 bg-red-700 rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
              >
                <CameraIcon className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">Аватарка профиля</div>
              <div className="text-sm text-gray-300">Нажмите на камеру чтобы изменить</div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Имя профиля</label>
            {isEditingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-700"
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  className="w-full py-3 bg-red-700 hover:bg-red-600 rounded-xl transition-all"
                >
                  Сохранить
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3">
                <span className="text-white">{userName}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Изменить
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-[#1a1a1a] rounded-3xl p-6">
          <h3 className="text-lg mb-4">Уведомления</h3>
          
          <div className="space-y-4">
            {/* Upcoming Games */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white mb-0.5">Ближайшие игры</div>
                <div className="text-xs text-gray-400">Получать уведомления о предстоящих турнирах</div>
              </div>
              <Switch
                checked={upcomingGames}
                onCheckedChange={setUpcomingGames}
              />
            </div>

            <div className="h-px bg-gray-800" />

            {/* Friend Registration */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white mb-0.5">Регистрация друзей на турнир</div>
                <div className="text-xs text-gray-400">Уведомлять когда друзья регистрируются</div>
              </div>
              <Switch
                checked={friendRegistration}
                onCheckedChange={setFriendRegistration}
              />
            </div>

            <div className="h-px bg-gray-800" />

            {/* Friend Requests */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white mb-0.5">Входящие запросы в друзья</div>
                <div className="text-xs text-gray-400">Получать уведомления о новых запросах</div>
              </div>
              <Switch
                checked={friendRequests}
                onCheckedChange={setFriendRequests}
              />
            </div>
          </div>
        </div>

        {/* Other Settings Section */}
        <div className="bg-[#1a1a1a] rounded-3xl p-6">
          <h3 className="text-lg mb-4">Прочее</h3>
          
          <div className="space-y-4">
            {/* Allow Friend Requests */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white mb-0.5">Возможность отправить мне запросы в друзья</div>
                <div className="text-xs text-gray-400">Другие игроки смогут добавлять вас в друзья</div>
              </div>
              <Switch
                checked={allowFriendRequests}
                onCheckedChange={setAllowFriendRequests}
              />
            </div>

            <div className="h-px bg-gray-800" />

            {/* Notify Friends */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white mb-0.5">Уведомлять моих друзей, если я зарегистрировался на игру</div>
                <div className="text-xs text-gray-400">Друзья будут видеть когда вы регистрируетесь</div>
              </div>
              <Switch
                checked={notifyFriendsOnRegistration}
                onCheckedChange={setNotifyFriendsOnRegistration}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

