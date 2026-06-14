import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BookingData } from '../components/booking/BookingForm';
import { apiClient } from '../lib/apiClient';
import bcrypt from 'bcryptjs';


export interface User {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  completedRides: number;
  balance: number;
}

export interface BookingRecord extends BookingData {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  bookings: BookingRecord[];
  loading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (name: string, phone: string, password: string) => Promise<User | null>;
  logout: () => void;
  addBooking: (booking: BookingData) => Promise<BookingRecord | null>;
  cancelBooking: (id: string) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async (userId: string) => {
    try {
      const data = await apiClient.getBookings({ user_id: userId });
      const mappedBookings: BookingRecord[] = data.map((b: any) => ({
        id: b.id,
        from: b.bus_from,
        to: b.bus_to,
        date: new Date(b.bus_date),
        departureTime: b.departure_time,
        seats: b.seats,
        price: b.price,
        status: b.status as any,
        name: b.passenger_name,
        phone: b.passenger_phone,
        createdAt: b.created_at
      }));
      setBookings(mappedBookings);
    } catch (e) {
      console.error('Помилка завантаження бронювань:', e);
    }
  };

  // Ініціалізація: перевірка сесії в localStorage (тільки ID) та завантаження з сервера
  useEffect(() => {
    const initAuth = async () => {
      const activeUserId = localStorage.getItem('comfort_active_user_id');
      if (activeUserId) {
        try {
          const data = await apiClient.getProfile(activeUserId);
          const mappedUser: User = {
            id: data.id,
            name: data.name,
            phone: data.phone,
            passwordHash: data.password_hash,
            completedRides: data.completed_rides,
            balance: data.balance
          };
          setUser(mappedUser);
          await loadBookings(data.id);
        } catch (e) {
          localStorage.removeItem('comfort_active_user_id');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiClient.login(phone, password);
      const loggedUser: User = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        passwordHash: data.password_hash,
        completedRides: data.completed_rides,
        balance: data.balance
      };
      setUser(loggedUser);
      localStorage.setItem('comfort_active_user_id', data.id);
      await loadBookings(data.id);
      setLoading(false);
      return true;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, phone: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiClient.register(name, phone, password);
      const newUser: User = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        passwordHash: data.password_hash,
        completedRides: data.completed_rides,
        balance: data.balance
      };
      setUser(newUser);
      localStorage.setItem('comfort_active_user_id', data.id);
      setBookings([]);
      setLoading(false);
      return newUser;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setBookings([]);
    localStorage.removeItem('comfort_active_user_id');
  };

  const addBooking = async (bookingData: BookingData) => {
    if (!user) return null;

    // Перевірка на 20-ту безкоштовну поїздку
    let finalPrice = bookingData.price;
    let newCompletedRides = user.completedRides;

    if (user.completedRides >= 20) {
      finalPrice = 0;
      newCompletedRides = 0;
    } else {
      newCompletedRides += 1;
    }

    const bookingRow = {
      user_id: user.id,
      bus_from: bookingData.from,
      bus_to: bookingData.to,
      bus_date: bookingData.date.toISOString(),
      departure_time: bookingData.departureTime,
      seats: bookingData.seats,
      price: finalPrice,
      status: 'active',
      passenger_name: bookingData.name,
      passenger_phone: bookingData.phone,
      pickup_location: bookingData.pickupLocation
    };

    try {
      const data = await apiClient.createBooking(bookingRow);
      const record: BookingRecord = {
        ...bookingData,
        id: data.id,
        price: finalPrice,
        status: 'active',
        createdAt: data.created_at
      };

      // Оновлюємо профіль користувача (лояльність)
      const updatedProfile = await apiClient.getProfile(user.id);
      if (updatedProfile) {
        setUser({
          id: updatedProfile.id,
          name: updatedProfile.name,
          phone: updatedProfile.phone,
          passwordHash: updatedProfile.password_hash,
          completedRides: updatedProfile.completed_rides,
          balance: updatedProfile.balance
        });
      }

      const updatedBookings = [record, ...bookings];
      setBookings(updatedBookings);
      return record;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const cancelBooking = async (id: string) => {
    if (!user) return;
    const target = bookings.find(b => b.id === id);
    if (!target || target.status !== 'active') return;

    try {
      await apiClient.updateBooking(id, { status: 'cancelled' });

      // Якщо квиток платний - повертаємо кошти на баланс
      if (target.price > 0) {
        await updateBalance(target.price);
      }

      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
    } catch (err) {
      console.error('Помилка скасування:', err);
    }
  };

  const updateBalance = async (amount: number) => {
    if (!user) return;
    try {
      const data = await apiClient.updateBalance(user.id, amount);
      setUser({ ...user, balance: data.balance });
    } catch (e) {
      console.error('Помилка оновлення балансу:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      bookings, 
      loading, 
      login, 
      register, 
      logout, 
      addBooking, 
      cancelBooking, 
      updateBalance 
    }}>
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
