import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BookingData } from '../components/booking/BookingForm';

export interface User {
  id: string;
  name: string;
  phone: string;
  passwordHash: string; // Mocked
  completedRides: number;
  balance?: number;
}

export interface BookingRecord extends BookingData {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  bookings: BookingRecord[];
  login: (phone: string, passwordHash: string) => boolean;
  register: (name: string, phone: string, passwordHash: string) => User | null;
  logout: () => void;
  addBooking: (booking: BookingData) => BookingRecord;
  cancelBooking: (id: string) => void;
  updateBalance: (amount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  // Load from local storage
  useEffect(() => {
    const activeUserId = localStorage.getItem('comfort_active_user_id');
    if (activeUserId) {
      const usersStr = localStorage.getItem('comfort_users');
      if (usersStr) {
        const users = JSON.parse(usersStr) as User[];
        const found = users.find(u => u.id === activeUserId);
        if (found) {
          setUser(found);
          loadBookings(found.id);
        }
      }
    }
  }, []);

  const loadBookings = (userId: string) => {
    const allBookingsStr = localStorage.getItem('comfort_bookings');
    if (allBookingsStr) {
      const allBookings = JSON.parse(allBookingsStr) as (BookingRecord & { userId: string })[];
      setBookings(allBookings.filter(b => b.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };

  const saveBookings = (userId: string, newBookings: BookingRecord[]) => {
    const allBookingsStr = localStorage.getItem('comfort_bookings');
    let allBookings: (BookingRecord & { userId: string })[] = [];
    if (allBookingsStr) allBookings = JSON.parse(allBookingsStr);
    
    // Remove old for this user and insert new
    allBookings = allBookings.filter(b => b.userId !== userId);
    allBookings.push(...newBookings.map(b => ({ ...b, userId })));
    
    localStorage.setItem('comfort_bookings', JSON.stringify(allBookings));
  };

  const login = (phone: string, passwordHash: string) => {
    const usersStr = localStorage.getItem('comfort_users');
    if (!usersStr) return false;
    const users = JSON.parse(usersStr) as User[];
    // Keep +380 formatting in mind, strip to digits for comparison
    const rawPhone = phone.replace(/\D/g, '');
    const found = users.find(u => u.phone.replace(/\D/g, '') === rawPhone && u.passwordHash === passwordHash);
    
    if (found) {
      setUser(found);
      localStorage.setItem('comfort_active_user_id', found.id);
      loadBookings(found.id);
      return true;
    }
    return false;
  };

  const register = (name: string, phone: string, passwordHash: string) => {
    const usersStr = localStorage.getItem('comfort_users');
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const rawPhone = phone.replace(/\D/g, '');
    if (users.find(u => u.phone.replace(/\D/g, '') === rawPhone)) {
      return null; // Phone exists
    }

    const newUser: User = {
      id: `u_${Date.now()}`,
      name,
      phone,
      passwordHash,
      completedRides: 0,
      balance: 0
    };

    users.push(newUser);
    localStorage.setItem('comfort_users', JSON.stringify(users));
    
    setUser(newUser);
    localStorage.setItem('comfort_active_user_id', newUser.id);
    setBookings([]);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setBookings([]);
    localStorage.removeItem('comfort_active_user_id');
  };

  const addBooking = (bookingData: BookingData) => {
    const record: BookingRecord = {
      ...bookingData,
      id: `b_${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (user) {
      // Logic for 20th ride free
      const willBeFree = user.completedRides >= 20;
      if (willBeFree) {
        record.price = 0; // Free ride
        // Reset loyalty count
        const usersStr = localStorage.getItem('comfort_users');
        if (usersStr) {
          const users = JSON.parse(usersStr) as User[];
          const uIdx = users.findIndex(u => u.id === user.id);
          if (uIdx !== -1) {
            users[uIdx].completedRides = 0;
            localStorage.setItem('comfort_users', JSON.stringify(users));
            setUser(users[uIdx]);
          }
        }
      }

      const updated = [record, ...bookings];
      setBookings(updated);
      saveBookings(user.id, updated);
      
      // Auto-mark as completed for demo purposes after booking
      simulateCompletion(user.id, record.id);
    }
    
    return record;
  };

  // Mock function to increment loyalty manually or simulate completed ride
  const simulateCompletion = (userId: string, bookingId: string) => {
      // In a real app this happens via admin panel
      // We'll just increment completedRides slightly for demo
      setTimeout(() => {
        const usersStr = localStorage.getItem('comfort_users');
        if (usersStr) {
          const users = JSON.parse(usersStr) as User[];
          const uIdx = users.findIndex(u => u.id === userId);
          if (uIdx !== -1 && users[uIdx].completedRides < 20) {
            users[uIdx].completedRides += 1;
            localStorage.setItem('comfort_users', JSON.stringify(users));
            if (user?.id === userId) setUser(users[uIdx]);
          }
        }
      }, 5000); // 5 sec later, ride completes and gives +1 loyalty
  };

  const cancelBooking = (id: string) => {
    if (!user) return;
    const target = bookings.find(b => b.id === id);
    if (!target || target.status !== 'active') return;

    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    setBookings(updated);
    saveBookings(user.id, updated);
    
    if (target.price && target.price > 0) {
      updateBalance(target.price);
    }
  };

  const updateBalance = (amount: number) => {
    if (!user) return;
    const usersStr = localStorage.getItem('comfort_users');
    if (usersStr) {
      const users = JSON.parse(usersStr) as User[];
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx].balance = (users[uIdx].balance || 0) + amount;
        localStorage.setItem('comfort_users', JSON.stringify(users));
        setUser(users[uIdx]);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, bookings, login, register, logout, addBooking, cancelBooking, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
