import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  submitProfileChangeRequest: (
    userId: number,
    userName: string,
    currentName: string,
    currentAvatar: string | undefined,
    requestedName?: string,
    requestedAvatar?: string
  ) => void;
  approveRequest: (requestId: number) => ProfileChangeRequest | null;
  rejectRequest: (requestId: number) => void;
  getPendingRequests: () => ProfileChangeRequest[];
  isUserNameTaken: (name: string, currentUserId: number) => boolean;
}

const ProfileModerationContext = createContext<ProfileModerationContextType | undefined>(undefined);

// List of existing users in the system
const EXISTING_USERS = [
  { id: 101, name: 'Алексей' },
  { id: 102, name: 'Мария' },
  { id: 103, name: 'Дмитрий' },
  { id: 104, name: 'Екатерина' },
  { id: 105, name: 'Игорь' },
  { id: 106, name: 'Анна' },
  { id: 107, name: 'Сергей' },
  { id: 108, name: 'Ольга' },
  { id: 109, name: 'Владимир' },
  { id: 110, name: 'Татьяна' },
  { id: 111, name: 'Николай' },
  { id: 112, name: 'Елена' },
];

// Demo data for testing
const DEMO_REQUESTS: ProfileChangeRequest[] = [
  {
    id: 1730000001,
    userId: 101,
    userName: 'Алексей',
    currentName: 'Алексей',
    currentAvatar: undefined,
    requestedName: 'Алекс Pro',
    requestedAvatar: undefined,
    timestamp: Date.now() - 3600000, // 1 hour ago
    status: 'pending',
  },
  {
    id: 1730000002,
    userId: 102,
    userName: 'Мария',
    currentName: 'Мария',
    currentAvatar: undefined,
    requestedName: undefined,
    requestedAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23e91e63"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3EM%3C/text%3E%3C/svg%3E',
    timestamp: Date.now() - 7200000, // 2 hours ago
    status: 'pending',
  },
  {
    id: 1730000003,
    userId: 103,
    userName: 'Дмитрий',
    currentName: 'Дмитрий',
    currentAvatar: undefined,
    requestedName: 'Димон228',
    requestedAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%234caf50"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3ED%3C/text%3E%3C/svg%3E',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    status: 'pending',
  },
  {
    id: 1730000004,
    userId: 104,
    userName: 'Екатерина',
    currentName: 'Екатерина',
    currentAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ff9800"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3EЕ%3C/text%3E%3C/svg%3E',
    requestedName: undefined,
    requestedAvatar: '',
    timestamp: Date.now() - 5400000, // 1.5 hours ago
    status: 'pending',
  },
  {
    id: 1730000005,
    userId: 105,
    userName: 'Игорь',
    currentName: 'Игорь',
    currentAvatar: undefined,
    requestedName: 'Игорь 🎮',
    requestedAvatar: undefined,
    timestamp: Date.now() - 900000, // 15 minutes ago
    status: 'pending',
  },
  {
    id: 1730000006,
    userId: 106,
    userName: 'Анна',
    currentName: 'Анна',
    currentAvatar: undefined,
    requestedName: 'АннаПокерКвин',
    requestedAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239c27b0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3EA%3C/text%3E%3C/svg%3E',
    timestamp: Date.now() - 10800000, // 3 hours ago
    status: 'pending',
  },
  {
    id: 1730000007,
    userId: 107,
    userName: 'Сергей',
    currentName: 'Сергей',
    currentAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%233f51b5"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3EС%3C/text%3E%3C/svg%3E',
    requestedName: 'SerG_Pro',
    requestedAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23f44336"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3ES%3C/text%3E%3C/svg%3E',
    timestamp: Date.now() - 600000, // 10 minutes ago
    status: 'pending',
  },
  {
    id: 1730000008,
    userId: 108,
    userName: 'Ольга',
    currentName: 'Ольга',
    currentAvatar: undefined,
    requestedName: 'Olga_Winner2024',
    requestedAvatar: undefined,
    timestamp: Date.now() - 14400000, // 4 hours ago
    status: 'pending',
  },
];

export function ProfileModerationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>(() => {
    const saved = localStorage.getItem('profileModerationRequests');
    let savedRequests: ProfileChangeRequest[] = [];
    
    if (saved) {
      try {
        savedRequests = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved requests:', e);
      }
    }
    
    // If no pending requests, initialize with demo data
    const hasPendingRequests = savedRequests.some(req => req.status === 'pending');
    if (!hasPendingRequests) {
      localStorage.setItem('profileModerationRequests', JSON.stringify(DEMO_REQUESTS));
      return DEMO_REQUESTS;
    }
    
    return savedRequests;
  });

  useEffect(() => {
    localStorage.setItem('profileModerationRequests', JSON.stringify(requests));
  }, [requests]);

  const submitProfileChangeRequest = (
    userId: number,
    userName: string,
    currentName: string,
    currentAvatar: string | undefined,
    requestedName?: string,
    requestedAvatar?: string
  ) => {
    const newRequest: ProfileChangeRequest = {
      id: Date.now(),
      userId,
      userName,
      currentName,
      currentAvatar,
      requestedName,
      requestedAvatar,
      timestamp: Date.now(),
      status: 'pending',
    };

    setRequests(prev => [...prev, newRequest]);
  };

  const approveRequest = (requestId: number): ProfileChangeRequest | null => {
    let approvedRequest: ProfileChangeRequest | null = null;
    
    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          approvedRequest = { ...req, status: 'approved' };
          return approvedRequest;
        }
        return req;
      })
    );

    return approvedRequest;
  };

  const rejectRequest = (requestId: number) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: 'rejected' } : req
      )
    );
  };

  const getPendingRequests = () => {
    return requests.filter(req => req.status === 'pending');
  };

  const isUserNameTaken = (name: string, currentUserId: number): boolean => {
    const trimmedName = name.trim().toLowerCase();
    
    // Check against existing users (excluding current user)
    const takenByExistingUser = EXISTING_USERS.some(
      user => user.id !== currentUserId && user.name.toLowerCase() === trimmedName
    );
    
    if (takenByExistingUser) {
      return true;
    }
    
    // Check against pending or approved requests from other users
    const takenByRequest = requests.some(
      req => 
        req.userId !== currentUserId && 
        req.requestedName && 
        req.requestedName.toLowerCase() === trimmedName &&
        (req.status === 'pending' || req.status === 'approved')
    );
    
    return takenByRequest;
  };

  return (
    <ProfileModerationContext.Provider
      value={{
        requests,
        submitProfileChangeRequest,
        approveRequest,
        rejectRequest,
        getPendingRequests,
        isUserNameTaken,
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

