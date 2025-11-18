import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useUser } from '../hooks/useUser';

interface AdminContextType {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (value: boolean) => void;
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_TELEGRAM_IDS = [609464085]; // Список telegram_id администраторов

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, loading, error } = useUser();
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  
  // Проверяем, является ли пользователь администратором
  // Проверяем и как число, и как строку для совместимости
  const isAdmin = user ? ADMIN_TELEGRAM_IDS.includes(Number(user.telegram_id)) || ADMIN_TELEGRAM_IDS.includes(user.telegram_id as any) : false;
  
  // Логируем состояние загрузки
  useEffect(() => {
    if (loading || error) {
      console.log('⏳ Admin check skipped:', { loading, error });
    }
  }, [loading, error]);

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('🔍 Admin Check:', {
        telegram_id: user.telegram_id,
        type: typeof user.telegram_id,
        isAdmin,
        ADMIN_IDS: ADMIN_TELEGRAM_IDS
      });
    }
  }, [user, isAdmin]);

  // Load admin mode from localStorage только если пользователь администратор
  useEffect(() => {
    if (isAdmin) {
      const saved = localStorage.getItem('isAdminMode');
      if (saved === 'true') {
        setIsAdminMode(true);
      }
    } else {
      // Если не админ, сбрасываем режим
      setIsAdminMode(false);
      localStorage.removeItem('isAdminMode');
    }
  }, [isAdmin]);

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('isAdminMode', String(isAdminMode));
    }
  }, [isAdminMode, isAdmin]);

  const toggleAdminMode = () => {
    if (isAdmin) {
      setIsAdminMode(prev => !prev);
    }
  };

  const setAdminModeValue = (value: boolean) => {
    if (isAdmin) {
      setIsAdminMode(value);
    }
  };

  return (
    <AdminContext.Provider value={{ 
      isAdminMode: isAdmin ? isAdminMode : false, 
      toggleAdminMode, 
      setAdminMode: setAdminModeValue,
      isAdmin
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}

