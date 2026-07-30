import { apiClient } from './apiClient';

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  pin_code: string;
  created_at?: string;
}

export interface DriverAssignment {
  id: string;
  driver_id: string | null;
  car?: string | null;
  crew: string;
  date: string;
  created_at?: string;
}

const LOCAL_DRIVERS_KEY = 'comfort_plus_drivers';
const LOCAL_ASSIGNMENTS_KEY = 'comfort_plus_assignments';

// Дефолтні водії для локального режиму, щоб користувач міг одразу протестувати роботу
const DEFAULT_DRIVERS: DriverProfile[] = [
  {
    id: 'drv-1',
    name: 'Іван Петренко',
    phone: '+380 97 123 45 67',
    pin_code: '2222',
  },
  {
    id: 'drv-2',
    name: 'Олександр Козак',
    phone: '+380 50 987 65 43',
    pin_code: '3333',
  },
  {
    id: 'drv-3',
    name: 'Михайло Шевченко',
    phone: '+380 63 456 78 90',
    pin_code: '4444',
  }
];

// Ініціалізація локальних даних, якщо їх немає
function initLocalData() {
  if (!localStorage.getItem(LOCAL_DRIVERS_KEY)) {
    localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(DEFAULT_DRIVERS));
  }
  if (!localStorage.getItem(LOCAL_ASSIGNMENTS_KEY)) {
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify([]));
  }
}

export const driverService = {
  // 1. Отримати список усіх водіїв
  async getDrivers(): Promise<DriverProfile[]> {
    initLocalData();
    try {
      const data = await apiClient.getDrivers();
      return data || [];
    } catch (e) {
      console.warn('Error fetching drivers from server, using localStorage:', e);
      return JSON.parse(localStorage.getItem(LOCAL_DRIVERS_KEY) || '[]');
    }
  },

  // 2. Додати водія
  async addDriver(name: string, phone: string, pin_code: string): Promise<DriverProfile> {
    initLocalData();
    try {
      const data = await apiClient.addDriver(name, phone, pin_code);
      return data;
    } catch (e) {
      console.error('Error adding driver:', e);
      throw e;
    }
  },

  // 3. Видалити водія
  async deleteDriver(id: string): Promise<boolean> {
    initLocalData();
    try {
      await apiClient.deleteDriver(id);
      return true;
    } catch (e) {
      console.error('Error deleting driver:', e);
      throw e;
    }
  },

  // 4. Отримати всі призначення на конкретну дату
  async getAssignments(date: string): Promise<DriverAssignment[]> {
    initLocalData();
    try {
      const data = await apiClient.getAssignments(date);
      return data || [];
    } catch (e) {
      console.warn('Error fetching assignments from server, using localStorage:', e);
      const localAssignments = JSON.parse(localStorage.getItem(LOCAL_ASSIGNMENTS_KEY) || '[]');
      return localAssignments.filter((a: DriverAssignment) => a.date === date);
    }
  },

  // 5. Призначити водія та/або автомобіль на екіпаж (якщо і водій і авто порожні - видаляємо призначення)
  async assignDriver(driverId: string | null, car: string | null, crew: string, date: string): Promise<boolean> {
    initLocalData();
    try {
      await apiClient.assignDriver(driverId, car, crew, date);
      return true;
    } catch (e) {
      console.warn('Error saving assignment to server, using localStorage:', e);
      const localAssignments = JSON.parse(localStorage.getItem(LOCAL_ASSIGNMENTS_KEY) || '[]');
      const index = localAssignments.findIndex((a: DriverAssignment) => a.crew === crew && a.date === date);
      
      if (!driverId && !car) {
        const filtered = localAssignments.filter((a: DriverAssignment) => !(a.crew === crew && a.date === date));
        localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(filtered));
      } else {
        if (index > -1) {
          localAssignments[index].driver_id = driverId;
          localAssignments[index].car = car;
        } else {
          localAssignments.push({
            id: 'asg-' + Date.now(),
            driver_id: driverId,
            car: car,
            crew,
            date,
            created_at: new Date().toISOString(),
          });
        }
        localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(localAssignments));
      }
      return true;
    }
  },

  async saveAssignment(assignment: any): Promise<boolean> {
    return this.assignDriver(assignment.driver_id, assignment.car || '', assignment.crew, assignment.date);
  },

  // 6. Пошук водія за PIN-кодом
  async getDriverByPin(pin: string): Promise<DriverProfile | null> {
    const drivers = await this.getDrivers();
    return drivers.find(d => d.pin_code === pin) || null;
  }
};
