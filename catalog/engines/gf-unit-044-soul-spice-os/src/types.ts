export interface StoreItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'provisions' | 'stoneware' | 'literature';
  price: number;
  image: string;
  details: string[];
  availability: string;
}

export interface JournalEntry {
  number: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  date: string;
}

export interface ReservationInquiry {
  name: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  atmospherePreference: string;
  specialRequests?: string;
}
