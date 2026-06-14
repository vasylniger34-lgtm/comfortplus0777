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
  'lviv-stebnik': 250,
  'lviv-truskavets': 300,
  'lviv-boryslav': 300,
  'lviv-skhidnytsia': 350,
  
  'stebnik-lviv': 250,
  'truskavets-lviv': 300,
  'boryslav-lviv': 300,
  'skhidnytsia-lviv': 350,

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
  phone1Display: '098 001 19 00',
  phone2: '+380970011900',
  phone2Display: '097 001 19 00',
  instagram: 'https://instagram.com/comfortplus0777',
  instagramHandle: '@comfortplus0777',
  email: 'comfortplus0777@gmail.com',
};

export const LEGAL_INFO = {
  companyName: 'Comfort Plus 0777',
  legalName: 'ТОВ «КОМФОРТ ПЛЮС 0777»',
  legalAddress: 'Україна, 82195, Львівська обл., Дрогобицький р-н, село Рибник, вул. Завирська, будинок 8',
  physicalAddress: '82100, Львівська обл., м. Дрогобич, вул. Орлика Пилипа 18/2',
  taxId: '45876032',
  email: 'comfortplus0777@gmail.com',
  bankInfo: 'UA363204780000026004924956186 в АБ "УКРГАЗБАНК" МФО 320478',
  director: 'Маршалок Степан Степанович',
  taxGroup: 'Платник єдиного податку 3 група 5%',
};

