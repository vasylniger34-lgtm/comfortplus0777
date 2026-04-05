import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BookingData } from '../components/booking/BookingForm';
import { supabase } from '../lib/supabase';

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
  login: (phone: string, passwordHash: string) => Promise<boolean>;
  register: (name: string, phone: string, passwordHash: string) => Promise<User | null>;
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

  // Ініціалізація: перевірка сесії в localStorage (тільки ID) та завантаження з Supabase
  useEffect(() => {
    const initAuth = async () => {
      const activeUserId = localStorage.getItem('comfort_active_user_id');
      if (activeUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUserId)
          .single();

        if (data && !error) {
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
        } else {
          localStorage.removeItem('comfort_active_user_id');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loadBookings = async (userId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const mappedBookings: BookingRecord[] = data.map(b => ({
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
    }
  };

  const login = async (phone: string, passwordHash: string) => {
    setLoading(true);
    const rawPhone = phone.replace(/\D/g, '').slice(-9); // Останні 9 цифр для надійності
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('phone', `%${rawPhone}%`)
      .eq('password_hash', passwordHash)
      .single();

    if (data && !error) {
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
    }
    setLoading(false);
    return false;
  };

  const register = async (name: string, phone: string, passwordHash: string) => {
    setLoading(true);
    
    const newUserRow = {
      name,
      phone,
      password_hash: passwordHash,
      completed_rides: 0,
      balance: 0
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([newUserRow])
      .select()
      .single();

    if (data && !error) {
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
    }
    setLoading(false);
    return null;
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
      // Імітуємо завершення поїздки відразу для демо-лояльності
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
      passenger_phone: bookingData.phone
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingRow])
      .select()
      .single();

    if (data && !error) {
      const record: BookingRecord = {
        ...bookingData,
        id: data.id,
        price: finalPrice,
        status: 'active',
        createdAt: data.created_at
      };

      // Оновлюємо профіль користувача (лояльність)
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ completed_rides: newCompletedRides })
        .eq('id', user.id)
        .select()
        .single();

      if (updatedProfile) {
        setUser({
          ...user,
          completedRides: updatedProfile.completed_rides,
          balance: updatedProfile.balance
        });
      }

      const updatedBookings = [record, ...bookings];
      setBookings(updatedBookings);
      return record;
    }

    return null;
  };

  const cancelBooking = async (id: string) => {
    if (!user) return;
    const target = bookings.find(b => b.id === id);
    if (!target || target.status !== 'active') return;

    // 1. Оновлюємо статус в БД
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (bookingError) return;

    // 2. Якщо квиток платний - повертаємо кошти на баланс
    if (target.price > 0) {
      await updateBalance(target.price);
    }

    // 3. Оновлюємо локальний стан
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  };

  const updateBalance = async (amount: number) => {
    if (!user) return;
    
    const newBalance = user.balance + amount;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id)
      .select()
      .single();

    if (data && !error) {
      setUser({ ...user, balance: data.balance });
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
