/**
 * APEX CLUB — Storage & Database Adapter
 * Seamless Dual-Engine: LocalStorage Instant Mock + Supabase Ready
 */
const APEX_STORAGE_KEYS = {
  SESSIONS: 'apex_class_sessions',
  BOOKINGS: 'apex_bookings',
  MEMBERSHIPS: 'apex_memberships',
  WAIVERS: 'apex_waivers',
  TRAINERS: 'apex_trainers'
};

const DEFAULT_TRAINERS = [
  {
    id: 'tr_1',
    name: 'Marcus "Viper" Vance',
    role: 'Head Striking Coach & Former WBC Contender',
    specialty: 'Elite Pro Boxing & Defense Footwork',
    rounds: '14,200+ Sparring Rounds Coached',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85',
    status: 'In Ring'
  },
  {
    id: 'tr_2',
    name: 'Elena Rostova',
    role: 'Olympic Strength & Conditioning Director',
    specialty: 'Explosive Power, VO2 Max & Metabolic Conditioning',
    rounds: '10+ Years Elite Athlete Prep',
    image: 'https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=1200&q=85',
    status: 'Available'
  },
  {
    id: 'tr_3',
    name: 'Darius Thorne',
    role: 'Muay Thai & Clinch Warfare Master',
    specialty: 'Dutch Kickboxing & High-Impact Heavy Bag Drills',
    rounds: 'Bangkok Stadium Veteran',
    image: 'https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?auto=format&fit=crop&w=1200&q=85',
    status: 'Booked'
  }
];

const DEFAULT_SESSIONS = [
  {
    id: 'sess_101',
    title: 'Pro Fight Conditioning & Mitt Work',
    coach: 'Marcus "Viper" Vance',
    time: '06:30 AM',
    duration: '60 min',
    intensity: 'High / Pro Level',
    spots_total: 10,
    spots_booked: 8,
    category: 'Boxing'
  },
  {
    id: 'sess_102',
    title: 'Heavy Bag Velocity & Footwork Drills',
    coach: 'Darius Thorne',
    time: '09:00 AM',
    duration: '50 min',
    intensity: 'High Intensity Interval',
    spots_total: 12,
    spots_booked: 5,
    category: 'Striking'
  },
  {
    id: 'sess_103',
    title: 'Olympic Barbell & Fighter Aerobics',
    coach: 'Elena Rostova',
    time: '12:00 PM',
    duration: '55 min',
    intensity: 'Strength & Conditioning',
    spots_total: 8,
    spots_booked: 6,
    category: 'Strength'
  },
  {
    id: 'sess_104',
    title: 'Closed-Door Sparring Clinic',
    coach: 'Marcus "Viper" Vance',
    time: '05:30 PM',
    duration: '75 min',
    intensity: 'Advanced / Full Sparring (Waiver Required)',
    spots_total: 6,
    spots_booked: 4,
    category: 'Sparring'
  }
];

const DEFAULT_BOOKINGS = [
  {
    id: 'APX-7801',
    athlete_name: 'Julian Sterling',
    athlete_email: 'j.sterling@sterlingcap.com',
    athlete_phone: '+1 (310) 892-4411',
    session_title: 'Closed-Door Sparring Clinic',
    coach_name: 'Marcus "Viper" Vance',
    date: 'Today, 05:30 PM',
    tier: 'Black Card VIP',
    fee: 150,
    status: 'Confirmed'
  },
  {
    id: 'APX-7802',
    athlete_name: 'Victoria Vance',
    athlete_email: 'vvance@atelier-arch.io',
    athlete_phone: '+1 (415) 782-9902',
    session_title: 'Heavy Bag Velocity & Footwork Drills',
    coach: 'Darius Thorne',
    date: 'Tomorrow, 09:00 AM',
    tier: 'Founding Member',
    fee: 95,
    status: 'Confirmed'
  }
];

window.ApexDB = {
  getTrainers: () => {
    const raw = localStorage.getItem(APEX_STORAGE_KEYS.TRAINERS);
    if (!raw) {
      localStorage.setItem(APEX_STORAGE_KEYS.TRAINERS, JSON.stringify(DEFAULT_TRAINERS));
      return DEFAULT_TRAINERS;
    }
    return JSON.parse(raw);
  },

  getSessions: () => {
    const raw = localStorage.getItem(APEX_STORAGE_KEYS.SESSIONS);
    if (!raw) {
      localStorage.setItem(APEX_STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_SESSIONS));
      return DEFAULT_SESSIONS;
    }
    return JSON.parse(raw);
  },

  getBookings: () => {
    const raw = localStorage.getItem(APEX_STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      localStorage.setItem(APEX_STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
      return DEFAULT_BOOKINGS;
    }
    return JSON.parse(raw);
  },

  createBooking: (booking) => {
    const bookings = window.ApexDB.getBookings();
    const newBooking = {
      id: `APX-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Confirmed',
      created_at: new Date().toISOString(),
      ...booking
    };
    bookings.unshift(newBooking);
    localStorage.setItem(APEX_STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return newBooking;
  },

  deleteBooking: (id) => {
    const bookings = window.ApexDB.getBookings().filter(b => b.id !== id);
    localStorage.setItem(APEX_STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return true;
  },

  getWaivers: () => {
    const raw = localStorage.getItem(APEX_STORAGE_KEYS.WAIVERS);
    return raw ? JSON.parse(raw) : [
      {
        id: 'WV-991',
        name: 'Julian Sterling',
        date: '2026-09-21',
        division: 'Pro Sparring / Full Contact',
        verified: true
      }
    ];
  },

  saveWaiver: (waiver) => {
    const waivers = window.ApexDB.getWaivers();
    const newW = {
      id: `WV-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      verified: true,
      ...waiver
    };
    waivers.unshift(newW);
    localStorage.setItem(APEX_STORAGE_KEYS.WAIVERS, JSON.stringify(waivers));
    return newW;
  }
};
