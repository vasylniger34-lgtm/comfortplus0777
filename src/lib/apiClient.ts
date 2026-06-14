import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  public socket: Socket;

  constructor() {
    this.socket = io(API_BASE_URL, {
      autoConnect: true
    });
    
    this.socket.on('connect', () => {
      console.log('Підключено до Socket.io сервера:', API_BASE_URL);
    });

    this.socket.on('disconnect', () => {
      console.log('Від\'єднано від Socket.io сервера');
    });
  }

  // ==========================================
  // АВТОРИЗАЦІЯ (AUTH)
  // ==========================================

  async register(name: string, phone: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Помилка реєстрації');
    }
    return res.json();
  }

  async login(phone: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Помилка входу');
    }
    return res.json();
  }

  async getProfile(userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile/${userId}`);
    if (!res.ok) throw new Error('Помилка завантаження профілю');
    return res.json();
  }

  async updateBalance(userId: string, amount: number) {
    const res = await fetch(`${API_BASE_URL}/api/auth/update-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    });
    if (!res.ok) throw new Error('Помилка оновлення балансу');
    return res.json();
  }

  // ==========================================
  // БРОНЮВАННЯ (BOOKINGS)
  // ==========================================

  async getBookings(filters: { user_id?: string; date?: string; crew?: string } = {}) {
    const query = new URLSearchParams();
    if (filters.user_id) query.append('user_id', filters.user_id);
    if (filters.date) query.append('date', filters.date);
    if (filters.crew) query.append('crew', filters.crew);

    const res = await fetch(`${API_BASE_URL}/api/bookings?${query.toString()}`);
    if (!res.ok) throw new Error('Помилка завантаження бронювань');
    return res.json();
  }

  async createBooking(bookingData: any) {
    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (!res.ok) throw new Error('Помилка створення бронювання');
    return res.json();
  }

  async updateBooking(id: string, updateData: any) {
    const res = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) throw new Error('Помилка оновлення бронювання');
    return res.json();
  }

  async deleteBooking(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Помилка видалення бронювання');
    return res.json();
  }

  // ==========================================
  // ВОДІЇ (DRIVERS)
  // ==========================================

  async getDrivers() {
    const res = await fetch(`${API_BASE_URL}/api/drivers`);
    if (!res.ok) throw new Error('Помилка завантаження водіїв');
    return res.json();
  }

  async addDriver(name: string, phone: string, pin_code: string) {
    const res = await fetch(`${API_BASE_URL}/api/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, pin_code })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка додавання водія');
    }
    return res.json();
  }

  async deleteDriver(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/drivers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Помилка видалення водія');
    return res.json();
  }

  async getDriverByPin(pin: string) {
    const res = await fetch(`${API_BASE_URL}/api/drivers/by-pin/${pin}`);
    if (!res.ok) throw new Error('Помилка авторизації водія');
    return res.json();
  }

  // ==========================================
  // РОЗКЛАД ЕКІПАЖІВ (CREW SCHEDULES)
  // ==========================================

  async getSchedules(date: string) {
    const res = await fetch(`${API_BASE_URL}/api/schedules?date=${date}`);
    if (!res.ok) throw new Error('Помилка завантаження розкладу');
    return res.json();
  }

  async createSchedule(scheduleData: any) {
    const res = await fetch(`${API_BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка створення розкладу');
    }
    return res.json();
  }

  async updateSchedule(id: string, updateData: any) {
    const res = await fetch(`${API_BASE_URL}/api/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка оновлення розкладу');
    }
    return res.json();
  }

  async deleteSchedule(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/schedules/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Помилка видалення розкладу');
    return res.json();
  }

  // ==========================================
  // ПРИЗНАЧЕННЯ (ASSIGNMENTS)
  // ==========================================

  async getAssignments(date: string) {
    const res = await fetch(`${API_BASE_URL}/api/assignments?date=${date}`);
    if (!res.ok) throw new Error('Помилка завантаження призначень');
    return res.json();
  }

  async assignDriver(driver_id: string | null, car: string | null, crew: string, date: string) {
    const res = await fetch(`${API_BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id, car, crew, date })
    });
    if (!res.ok) throw new Error('Помилка створення призначення');
    return res.json();
  }

  // ==========================================
  // ЧАТ (CHAT)
  // ==========================================

  async getChatMessages(sessionId: string) {
    const res = await fetch(`${API_BASE_URL}/api/chat/${sessionId}`);
    if (!res.ok) throw new Error('Помилка завантаження повідомлень чату');
    return res.json();
  }

  async sendChatMessage(session_id: string, text: string, is_bot_reply = false) {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, text, is_bot_reply })
    });
    if (!res.ok) throw new Error('Помилка відправки повідомлення');
    return res.json();
  }
}

export const apiClient = new ApiClient();
