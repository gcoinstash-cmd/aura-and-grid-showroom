export interface MenuItem {
  name: string;
  price: string;
  description: string;
  badge?: "Signature" | "Popular" | "Bartender’s Pick" | "Chef’s Special" | "Limited";
  category: "cocktails" | "bites" | "plates" | "wine-spirits";
}

export interface WeeklyEvent {
  day: string;
  title: string;
  time: string;
  description: string;
  genre: string;
  badge?: "Weekly" | "Special Guest" | "Limited Seats" | "Sold Out" | "Friday Feature";
}

export interface SignatureFeature {
  title: string;
  description: string;
  iconName: string; // to render lucide-react icons dynamically
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  source: string; // e.g. "Vogue", "Eater", "Local Legend"
}

export interface VenueContent {
  id: string;
  conceptName: string;
  tagline: string;
  announcement: string;
  brandName: string;
  heroTitle: string;
  heroSub: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
  featuresTitle: string;
  featuresSub: string;
  features: SignatureFeature[];
  menuTitle: string;
  menuSub: string;
  menuItems: MenuItem[];
  storyTitle: string;
  storyLead: string;
  storyParagraph1: string;
  storyParagraph2: string;
  storySignatureLabel: string;
  storySignatureAuthor: string;
  eventsTitle: string;
  eventsSub: string;
  events: WeeklyEvent[];
  testimonialsTitle: string;
  testimonialsSub: string;
  testimonials: Testimonial[];
  privateEventsTitle: string;
  privateEventsSub: string;
  privateEventsHighlight1: string;
  privateEventsHighlight2: string;
  privateEventsCopy: string;
  reservationTitle: string;
  reservationSub: string;
  contactTitle: string;
  address: string;
  cityState: string;
  phone: string;
  email: string;
  hours: {
    days: string;
    time: string;
  }[];
}
