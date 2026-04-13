export type Stop = {
  id: string;
  name: string;
  nameEn: string;
  order: number;
};

export type Route = {
  from: Stop;
  to: Stop;
  price: number;
  duration: string;
};

export const STOPS: Stop[] = [
  { id: 'lviv', name: 'Львів', nameEn: 'Lviv', order: 0 },
  { id: 'stebnik', name: 'Стебник', nameEn: 'Stebnik', order: 1 },
  { id: 'truskavets', name: 'Трускавець', nameEn: 'Truskavets', order: 2 },
  { id: 'boryslav', name: 'Борислав', nameEn: 'Boryslav', order: 3 },
  { id: 'skhidnytsia', name: 'Східниця', nameEn: 'Skhidnytsia', order: 4 },
];

export const ROUTE_PRICES: Record<string, number> = {
  // Routes available for online booking
  'lviv-stebnik': 200,
  'lviv-truskavets': 250,
  'lviv-boryslav': 250,
  'lviv-skhidnytsia': 300,
  
  'stebnik-lviv': 200,
  'truskavets-lviv': 250,
  'boryslav-lviv': 250,
  'skhidnytsia-lviv': 300,

  // Routes bookable only by phone (setting price to 0 or keeping for reference, 
  // but logic in form should redirect to phone)
  'skhidnytsia-truskavets': 0,
  'skhidnytsia-stebnik': 0,
  'stebnik-skhidnytsia': 0,
  'truskavets-skhidnytsia': 0,

  // Forbidden routes (not bookable)
  'skhidnytsia-boryslav': 0,
  'boryslav-truskavets': 0,
  'boryslav-stebnik': 0,
  'truskavets-stebnik': 0,
  'stebnik-truskavets': 0,
  'stebnik-boryslav': 0,
  'boryslav-skhidnytsia': 0,
};

export const ROUTE_DURATIONS: Record<string, string> = {
  'lviv-stebnik': '1:45',
  'lviv-truskavets': '2:00',
  'lviv-boryslav': '2:10',
  'lviv-skhidnytsia': '2:20',
  'stebnik-skhidnytsia': '0:35',
  'truskavets-skhidnytsia': '0:25',
  'boryslav-skhidnytsia': '0:15',
};

export function getPrice(fromId: string, toId: string): number {
  const key = `${fromId}-${toId}`;
  return ROUTE_PRICES[key] || 0;
}

export function getDuration(fromId: string, toId: string): string {
  const key = `${fromId}-${toId}`;
  const reverseKey = `${toId}-${fromId}`;
  return ROUTE_DURATIONS[key] || ROUTE_DURATIONS[reverseKey] || '~2:00';
}

export const CONTACTS = {
  phone1: '+380980011900',
  phone1Display: '098 00 119 00',
  phone2: '+380970011900',
  phone2Display: '097 00 119 00',
  instagram: 'https://instagram.com/comfortplus0777',
  instagramHandle: '@comfortplus0777',
};
