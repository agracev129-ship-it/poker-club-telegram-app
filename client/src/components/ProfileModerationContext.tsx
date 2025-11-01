import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { profileRequestsAPI, ProfileChangeRequest as APIProfileRequest } from '../lib/api';

export interface ProfileChangeRequest {
  id: number;
  userId: number;
  userName: string;
  currentName: string;
  currentAvatar?: string;
  requestedName?: string;
  requestedAvatar?: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface ProfileModerationContextType {
  requests: ProfileChangeRequest[];
  loading: boolean;
  refreshRequests: () => Promise<void>;
  approveRequest: (requestId: number) => Promise<void>;
  rejectRequest: (requestId: number) => Promise<void>;
  getPendingRequests: () => ProfileChangeRequest[];
}

const ProfileModerationContext = createContext<ProfileModerationContextType | undefined>(undefined);

// Функция для преобразования API response в локальный формат
function convertAPIToLocal(apiRequest: APIProfileRequest): ProfileChangeRequest {
  return {
    id: apiRequest.id,
    userId: apiRequest.user_id,
    userName: apiRequest.user_name || '',
    currentName: apiRequest.current_name,
    currentAvatar: apiRequest.current_avatar_url,
    requestedName: apiRequest.requested_name,
    requestedAvatar: apiRequest.requested_avatar_url,
    timestamp: new Date(apiRequest.created_at).getTime(),
    status: apiRequest.status,
  };
}

export function ProfileModerationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRequests = useCallback(async () => {
    try {
      setLoading(true);
      const apiRequests = await profileRequestsAPI.getAll();
      const converted = apiRequests.map(convertAPIToLocal);
      setRequests(converted);
    } catch (error) {
      console.error('Error loading profile requests:', error);
      // В случае ошибки оставляем текущий список
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  const approveRequest = async (requestId: number): Promise<void> => {
    try {
      await profileRequestsAPI.approve(requestId);
      // Обновляем локальный список
      await refreshRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  };

  const rejectRequest = async (requestId: number): Promise<void> => {
    try {
      await profileRequestsAPI.reject(requestId);
      // Обновляем локальный список
      await refreshRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  };

  const getPendingRequests = () => {
    return requests.filter(req => req.status === 'pending');
  };

  return (
    <ProfileModerationContext.Provider
      value={{
        requests,
        loading,
        refreshRequests,
        approveRequest,
        rejectRequest,
        getPendingRequests,
      }}
    >
      {children}
    </ProfileModerationContext.Provider>
  );
}

export function useProfileModeration() {
  const context = useContext(ProfileModerationContext);
  if (!context) {
    throw new Error('useProfileModeration must be used within ProfileModerationProvider');
  }
  return context;
}

