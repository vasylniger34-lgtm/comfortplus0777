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
  'lviv-stebnik': 200,
  'lviv-truskavets': 230,
  'lviv-boryslav': 250,
  'lviv-skhidnytsia': 350,
  'stebnik-truskavets': 50,
  'stebnik-boryslav': 70,
  'stebnik-skhidnytsia': 150,
  'truskavets-boryslav': 40,
  'truskavets-skhidnytsia': 120,
  'boryslav-skhidnytsia': 90,
  // Reverse routes
  'stebnik-lviv': 200,
  'truskavets-lviv': 230,
  'boryslav-lviv': 250,
  'skhidnytsia-lviv': 350,
  'truskavets-stebnik': 50,
  'boryslav-stebnik': 70,
  'skhidnytsia-stebnik': 150,
  'boryslav-truskavets': 40,
  'skhidnytsia-truskavets': 120,
  'skhidnytsia-boryslav': 90,
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
