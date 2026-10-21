export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface MenuCategory {
  categoryName: string;
  items: MenuItem[];
}

export interface JournalPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  author: string;
  excerpt: string;
  image: string;
  content: string;
}

export interface TemplateConfig {
  brand: {
    name: string;
    tagline: string;
    description: string;
    logoText: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    instagram: string;
  };
  hours: {
    monThu: string;
    friSat: string;
    sunBrunch: string;
  };
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  chef: {
    name: string;
    role: string;
    bio: string;
    image: string;
  };
  signatureSelections: {
    title: string;
    subtitle: string;
    items: {
      name: string;
      price: number;
      description: string;
      image: string;
    }[];
  };
  menu: {
    categories: {
      all: MenuCategory;
      vegan: MenuCategory;
      glutenFree: MenuCategory;
      signature: MenuCategory;
    };
  };
  journal: JournalPost[];
  navigation: { label: string; href: string }[];
  social: {
    instagram: string;
    links: { platform: string; url: string }[];
    posts: { id: string; image: string }[];
  };
  gallery: { url: string; alt: string }[];
  testimonials: { quote: string; author: string; role: string }[];
}

export const templateData: TemplateConfig = {
  brand: {
    name: "Heritage & Honey",
    tagline: "Soulful LA Dining",
    description: "Modern Southern comfort meets the vibrant spirit of Los Angeles.",
    logoText: "HERITAGE & HONEY",
  },
  contact: {
    phone: "(323) 555-0192",
    email: "hello@heritagehoney.com",
    address: "8422 Melrose Ave, West Hollywood, CA 90069",
    instagram: "@HERITAGEHONEY_LA",
  },
  social: {
    instagram: "@HERITAGEHONEY_LA",
    links: [
      { platform: "Instagram", url: "https://instagram.com" },
      { platform: "Facebook", url: "https://facebook.com" },
      { platform: "Twitter", url: "https://twitter.com" },
    ],
    posts: [
      { id: "p1", image: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600" },
      { id: "p2", image: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=600" },
      { id: "p3", image: "https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=600" },
    ]
  },
  navigation: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Signature", href: "#features" },
    { label: "Menu", href: "#menu" },
    { label: "Journal", href: "#journal" },
    { label: "Contact", href: "#contact" },
  ],
  hours: {
    monThu: "5 PM - 10 PM",
    friSat: "5 PM - 12 AM",
    sunBrunch: "11 AM - 4 PM",
  },
  hero: {
    title: "Where Tradition Meets the Coast",
    subtitle: "Elevating the art of soul food in the heart of Los Angeles. Modern flavors rooted in deep Southern heritage.",
    backgroundImage: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  chef: {
    name: "Chef Andrea 'Soul' Banks",
    role: "Executive Culinary Director",
    bio: "Born in the heart of Georgia and polished in the kitchens of New York, Chef Andrea brings her deep Southern roots to the West Hollywood food scene. Her philosophy is simple: celebrate the ingredients, honor the ancestors, and always serve with a side of soul.",
    image: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  signatureSelections: {
    title: "Honoring Heritage",
    subtitle: "THE SIGNATURE SELECTION",
    items: [
      {
        name: "Hot Honey Gold Bird",
        price: 28,
        description: "Organic buttermilk-brined chicken, spicy wildflower honey, pickled heirloom okra.",
        image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&auto=format&fit=crop",
      },
      {
        name: "Short Rib & Grits",
        price: 34,
        description: "48-hour braised short rib, stone-ground cheesy grits, bourbon reduction.",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop",
      },
      {
        name: "Heirloom Cornbread",
        price: 12,
        description: "Sweet and savory skillet corn bread served with house-smoked honey butter and sea salt.",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop",
      },
      {
        name: "Blackened Coastal Salmon",
        price: 36,
        description: "Pan-seared wild salmon, lowcountry succotash, charred lemon creole butter.",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop",
      },
    ],
  },
  menu: {
    categories: {
      all: {
        categoryName: "All Selections",
        items: [
          { id: "1", name: "Deviled Duck Eggs", price: 16, description: "Crispy pancetta, chive oil, smoked paprika." },
          { id: "2", name: "Bourbon Glazed Biscuits", price: 12, description: "Warm flaky biscuits with spiced bourbon peach jam." },
          { id: "3", name: "Cast Iron Catfish", price: 29, description: "Cajun spice rub, braised collard greens, sweet potato puree." },
          { id: "4", name: "The Modern Soul Bowl", price: 26, description: "Smoked jackfruit, okra, lentils, and gold-dusted quinoa." },
          { id: "5", name: "Truffle Mac & Cheese", price: 15, description: "Four cheese blend, white truffle oil, herb crust." }
        ]
      },
      vegan: {
        categoryName: "Vegan",
        items: [
          { id: "4", name: "The Modern Soul Bowl", price: 26, description: "Smoked jackfruit, okra, lentils, and gold-dusted quinoa." }
        ]
      },
      glutenFree: {
        categoryName: "Gluten-Free",
        items: [
          { id: "3", name: "Cast Iron Catfish", price: 29, description: "Cajun spice rub, braised collard greens, sweet potato puree." }
        ]
      },
      signature: {
        categoryName: "Signature",
        items: [
          { id: "1", name: "Deviled Duck Eggs", price: 16, description: "Crispy pancetta, chive oil, smoked paprika." },
          { id: "3", name: "Cast Iron Catfish", price: 29, description: "Cajun spice rub, braised collard greens, sweet potato puree." }
        ]
      }
    }
  },
  journal: [
    {
      id: "j1",
      title: "The Art of the Hot Honey Glaze",
      slug: "art-of-hot-honey",
      category: "CULINARY",
      date: "MAY 12, 2026",
      author: "CHEF ANDREA BANKS",
      excerpt: "Discover the secret behind our signature spicy wildflower honey that has the whole city talking.",
      image: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800",
      content: "The balance between fire and nectar is a delicate dance. We brew our signature hot honey with organic wildflower blossoms infused with three varieties of hand-selected chilis. It provides a striking, immediate warmth that amplifies the buttermilk-brined savory textures of our signature dishes.",
    },
    {
      id: "j2",
      title: "Southern Roots, West Hollywood Soul",
      slug: "southern-roots-weho-soul",
      category: "CULTURE",
      date: "APRIL 28, 2026",
      author: "LIZA JAMES",
      excerpt: "How we balanced traditional recipes with the modern energy of Melrose Avenue.",
      image: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800",
      content: "Bringing deep-south flavor to West Hollywood means staying authentic while embracing Melrose's bold aesthetic. Our space and plates speak on multiple frequencies—retaining ancestral cooking techniques, slow braises, and heirloom grains, wrapped in an architectural narrative of pure contemporary restraint.",
    },
    {
      id: "j3",
      title: "Sustainable Spirits",
      slug: "sustainable-spirits",
      category: "MIXOLOGY",
      date: "APRIL 15, 2026",
      author: "SAMIR SHAH",
      excerpt: "Meeting our local distillers and the stories behind our handcrafted cocktails.",
      image: "https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=800",
      content: "Every spirit in our library tells a distinct story of terroir and precision. By partnering with small-batch artisanal distillers operating with low-waste practices, we can elevate our signature bourbon cocktails with ingredients that respect and honor the earth.",
    },
    {
      id: "j4",
      title: "The Soul of Southern Hospitality",
      slug: "soul-of-southern-hospitality",
      category: "DESIGN & CULTURE",
      date: "MAY 19, 2026",
      author: "EVELYN LOWE",
      excerpt: "Establishing a sanctuary of warm, premium experience and meticulous detail in our West Hollywood dining room.",
      image: "https://images.pexels.com/photos/3225528/pexels-photo-3225528.jpeg?auto=compress&cs=tinysrgb&w=800",
      content: "Deep Southern hospitality is not merely a practice; it is a sacred form of hospitality. In designing our West Hollywood salon, we combined the rich, dark, physical timber and low-hanging amber lights of Savannah with the sleek, high-contrast, modern elegance of LA. From custom velvet booths to pristine silverware, every element serves as an invitation to rest, savor, and belong.",
    }
  ],
  gallery: [
    { url: "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Restaurant interior" },
    { url: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Signature dish" },
    { url: "https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Craft cocktail" },
    { url: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Culinary Excellence" },
    { url: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Lively bar area" },
    { url: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Intimate Dining Corner" },
    { url: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Professional Kitchen" },
    { url: "https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Evening ambiance" },
    { url: "https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Gourmet meal" },
  ],
  testimonials: [
    { 
      quote: "The Hot Honey Gold Bird was pure poetry—perfectly crispy, sweet, and carrying just the right kick of heat. The family-style energy on Melrose is unmatched.", 
      author: "Aria Montgomery", 
      role: "Yelp Elite" 
    },
    { 
      quote: "Every bite felt like a warm embrace from Chef Andrea. The Braised Short Rib is so tender it falls apart at the touch. Our new Friday evening sanctuary.", 
      author: "Elijah Rollins", 
      role: "OpenTable Verified" 
    },
    { 
      quote: "They’ve elevated Southern heirloom recipes with incredible contemporary sophistication. The cornbread alone, with that sea salt smoked honey butter, is worth the wait.", 
      author: "Sasha Vance", 
      role: "Regular Guest" 
    },
  ]
};
