export type ScheduleEntry = {
  departure: string;
  arrival: string;
  fromCity: string;
  toCity: string;
  isPopular?: boolean;
};

export const SCHEDULE_SKHIDNYTSIA_TO_LVIV: ScheduleEntry[] = [
  { departure: '05:50', arrival: '08:10', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '06:20', arrival: '09:00', fromCity: 'Східниця', toCity: 'Львів', isPopular: true },
  { departure: '07:10', arrival: '10:15', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '08:10', arrival: '11:05', fromCity: 'Східниця', toCity: 'Львів', isPopular: true },
  { departure: '08:50', arrival: '11:50', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '09:30', arrival: '12:20', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '10:35', arrival: '13:10', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '11:10', arrival: '14:10', fromCity: 'Східниця', toCity: 'Львів', isPopular: true },
  { departure: '12:00', arrival: '14:50', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '12:40', arrival: '15:30', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '13:20', arrival: '16:10', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '14:10', arrival: '18:20', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '15:30', arrival: '19:20', fromCity: 'Східниця', toCity: 'Львів', isPopular: true },
  { departure: '16:20', arrival: '20:00', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '17:00', arrival: '20:40', fromCity: 'Східниця', toCity: 'Львів' },
  { departure: '17:40', arrival: '21:10', fromCity: 'Східниця', toCity: 'Львів' },
];

// Computed reverse schedule (Lviv → Skhidnytsia)
export const SCHEDULE_LVIV_TO_SKHIDNYTSIA: ScheduleEntry[] = [
  { departure: '08:10', arrival: '10:30', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '09:00', arrival: '11:20', fromCity: 'Львів', toCity: 'Східниця', isPopular: true },
  { departure: '10:15', arrival: '12:35', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '11:05', arrival: '13:25', fromCity: 'Львів', toCity: 'Східниця', isPopular: true },
  { departure: '11:50', arrival: '14:10', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '12:20', arrival: '14:40', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '13:10', arrival: '15:30', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '14:10', arrival: '16:30', fromCity: 'Львів', toCity: 'Східниця', isPopular: true },
  { departure: '14:50', arrival: '17:10', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '15:30', arrival: '17:50', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '16:10', arrival: '18:30', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '18:20', arrival: '20:40', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '19:20', arrival: '21:40', fromCity: 'Львів', toCity: 'Східниця', isPopular: true },
  { departure: '20:00', arrival: '22:20', fromCity: 'Львів', toCity: 'Східниця' },
  { departure: '20:40', arrival: '23:00', fromCity: 'Львів', toCity: 'Східниця' },
];
