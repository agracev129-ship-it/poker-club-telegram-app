import { useState } from 'react';
import { motion } from 'motion/react';
import { profileRequestsAPI } from '../lib/api';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ImageIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

interface ProfileEditViewProps {
  onClose: () => void;
}

export function ProfileEditView({ onClose }: ProfileEditViewProps) {
  const { user } = useUser();
  const [requestedName, setRequestedName] = useState('');
  const [requestedAvatarUrl, setRequestedAvatarUrl] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Используем name если есть, иначе формируем из first_name и last_name
  const currentName = user?.name || (user?.first_name + (user?.last_name ? ` ${user.last_name}` : '')) || '';
  const currentAvatarUrl = user?.photo_url || '';

  const handleSubmit = async () => {
    console.log('=== Profile Edit Submit Started ===');
    console.log('User:', user);
    console.log('Current name:', currentName);
    console.log('Requested name:', requestedName);
    console.log('Current avatar:', currentAvatarUrl);
    console.log('Requested avatar:', requestedAvatarUrl);
    console.log('Remove avatar:', removeAvatar);

    // Проверка что есть хотя бы одно изменение
    if (!requestedName && !requestedAvatarUrl && !removeAvatar) {
      console.error('No changes provided');
      toast.error('Укажите хотя бы одно изменение');
      return;
    }

    // Проверка что имя отличается от текущего
    if (requestedName && requestedName === currentName) {
      console.error('Name is the same as current');
      toast.error('Новое имя совпадает с текущим');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        currentName,
        currentAvatarUrl,
        requestedName: requestedName || undefined,
        requestedAvatarUrl: removeAvatar ? '' : (requestedAvatarUrl || undefined),
      };
      
      console.log('Sending request data:', requestData);
      
      const response = await profileRequestsAPI.create(requestData);
      
      console.log('Request created successfully:', response);
      toast.success('Запрос на изменение профиля отправлен');
      toast.info('Ожидайте одобрения администратора');
      onClose();
    } catch (error: any) {
      console.error('Error submitting profile request:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast.error(error.message || 'Ошибка при отправке запроса');
    } finally {
      setIsSubmitting(false);
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
            <UserIcon className="w-6 h-6 text-red-500" />
            <h2 className="text-xl">Изменить профиль</h2>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 pb-24 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 mb-1">Модерация изменений</p>
              <p className="text-xs text-blue-400/80">
                Все изменения профиля проходят модерацию администратором. 
                Вы получите уведомление после проверки.
              </p>
            </div>
          </div>
        </div>

        {/* Current Profile */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
          <h3 className="text-sm text-gray-400 mb-3">Текущий профиль</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center overflow-hidden border-2 border-gray-700">
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{currentName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="text-base mb-0.5">{currentName}</div>
              <div className="text-xs text-gray-500">@{user?.username || 'user'}</div>
            </div>
          </div>
        </div>

        {/* Change Name */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm text-gray-400 mb-2 block">
              Новое имя
            </Label>
            <Input
              id="name"
              value={requestedName}
              onChange={(e) => setRequestedName(e.target.value)}
              placeholder={currentName}
              className="bg-[#252525] border-gray-700 text-white"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              Оставьте пустым, если не хотите менять имя
            </p>
          </div>
        </div>

        {/* Change Avatar */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 space-y-4">
          <div>
            <Label htmlFor="avatar" className="text-sm text-gray-400 mb-2 block">
              Новая аватарка (URL)
            </Label>
            <Input
              id="avatar"
              value={requestedAvatarUrl}
              onChange={(e) => {
                setRequestedAvatarUrl(e.target.value);
                setRemoveAvatar(false);
              }}
              placeholder="https://example.com/avatar.jpg"
              className="bg-[#252525] border-gray-700 text-white"
              disabled={removeAvatar}
            />
            <p className="text-xs text-gray-500 mt-1">
              Введите URL изображения или удалите аватарку
            </p>
          </div>

          {currentAvatarUrl && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="removeAvatar"
                checked={removeAvatar}
                onChange={(e) => {
                  setRemoveAvatar(e.target.checked);
                  if (e.target.checked) {
                    setRequestedAvatarUrl('');
                  }
                }}
                className="w-4 h-4 rounded border-gray-700 bg-[#252525]"
              />
              <label htmlFor="removeAvatar" className="text-sm text-gray-400 cursor-pointer">
                Удалить текущую аватарку
              </label>
            </div>
          )}

          {requestedAvatarUrl && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Предпросмотр:</p>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center overflow-hidden border-2 border-purple-500/50">
                <img 
                  src={requestedAvatarUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    toast.error('Не удалось загрузить изображение');
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!requestedName && !requestedAvatarUrl && !removeAvatar)}
          className="w-full bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 border-0 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            'Отправка...'
          ) : (
            <>
              <ImageIcon className="w-5 h-5 mr-2" />
              Отправить на модерацию
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          После отправки запроса вы не сможете изменить его. 
          Дождитесь решения администратора.
        </p>
      </div>
    </div>
  );
}

