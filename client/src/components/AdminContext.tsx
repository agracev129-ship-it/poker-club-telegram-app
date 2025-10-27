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
  const { user } = useUser();
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  
  // Проверяем, является ли пользователь администратором
  const isAdmin = user ? ADMIN_TELEGRAM_IDS.includes(user.telegram_id) : false;

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

