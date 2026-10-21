/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking, MenuItem, DietaryRecord, EventStatus, CourseCategory, PrepComplexity, DietaryPreference } from "./types";

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "menu_01",
    name: "Belon Oysters with Champagne Granitée & Gold Leaf",
    category: CourseCategory.AmuseBouche,
    description: "Chilled wild Belon oysters matched with a delicate, frozen Champagne vinegar granité and finished with hand-pressed 24k edible gold flakes.",
    keyIngredients: ["Oysters", "Champagne", "Champagne Vinegar", "Shallot", "Gold Leaf"],
    complexity: PrepComplexity.High,
    costPerServing: 18.5,
    imageUrl: "https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "menu_02",
    name: "Saffron-Poached White Asparagus & Imperial Caviar",
    category: CourseCategory.FirstCourse,
    description: "Slow-simmered French white asparagus in a light, saffron-infused oil emulsion, garnished with sustainably sourced Siberian Imperial Caviar.",
    keyIngredients: ["White Asparagus", "Saffron", "Imperial Caviar", "Meyer Lemon", "Olive Oil"],
    complexity: PrepComplexity.Medium,
    costPerServing: 28.0,
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "menu_03",
    name: "Meyer Lemon & Bergamot Sorbet with Verbena Oil",
    category: CourseCategory.Intermezzo,
    description: "A bracing, palate-cleansing emulsion of fresh organic Meyer lemons and cold-pressed Italian bergamot, drizzled with bright green lemon verbena oil.",
    keyIngredients: ["Meyer Lemon", "Bergamot", "Lemon Verbena", "Sugar"],
    complexity: PrepComplexity.Low,
    costPerServing: 6.0,
    imageUrl: "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "menu_04",
    name: "Dry-Aged Miyazaki A5 Wagyu with Truffle Mille-Feuille",
    category: CourseCategory.Main,
    description: "Charcoal-seared Miyazaki beef tenderloin marbled to perfection, accompanied by a layered, crispy fingerling potato cake and rich cognac demi-glace infused with winter black truffles.",
    keyIngredients: ["Miyazaki Wagyu Beef", "Black Truffle", "Fingerling Potatoes", "Cognac", "Butter", "Beef Stocks"],
    complexity: PrepComplexity.High,
    costPerServing: 85.0,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "menu_05",
    name: "Grand Cru Valrhona Chocolate Textures & Gold Accord",
    category: CourseCategory.Dessert,
    description: "An elegant, multi-textured composition of warm Valrhona dark chocolate soufflé, cocoa butter crunch, and smooth hazelnut-infused gianduja ice cream.",
    keyIngredients: ["Valrhona Dark Chocolate", "Hazelnut", "Gold Leaf", "Cocoa Butter", "Heavy Cream", "Eggs"],
    complexity: PrepComplexity.High,
    costPerServing: 16.0,
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "menu_06",
    name: "Wild Strawberry & Hibiscus Pâte de Fruit",
    category: CourseCategory.Mignardise,
    description: "A concentrated, bite-sized confection made of organic wild strawberry nectar and bright dried Sudanese hibiscus petal reduction, rolled in superfine sugar.",
    keyIngredients: ["Wild Strawberry", "Hibiscus", "Pectin", "Tahitian Vanilla", "Sugar"],
    complexity: PrepComplexity.Medium,
    costPerServing: 4.0,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "booking_01",
    eventName: "The Laurent-Perrier Editorial Dinner",
    clientName: "Lord Alistair Sterling",
    eventDate: "2026-06-15",
    guestCount: 12,
    pricePerPlate: 450,
    status: EventStatus.DepositPaid,
    venueAddress: "Villa L'Horizon, Cliffside Dr, Malibu, CA",
    notes: "A highly sophisticated multi-course dinner with vintage wine pairings. Client requests absolute discretion and premium, immaculate table settings.",
    menuItemIds: ["menu_01", "menu_02", "menu_03", "menu_04", "menu_05", "menu_06"]
  },
  {
    id: "booking_02",
    eventName: "Saffron & Gold Midsummer Soirée",
    clientName: "Vivienne Vance",
    eventDate: "2026-07-02",
    guestCount: 35,
    pricePerPlate: 550,
    status: EventStatus.ProposalSent,
    venueAddress: "Private Estate, Bel Air Road, Los Angeles, CA",
    notes: "Outdoor twilight cocktail reception transitioning into an intimate, seated bento-style lookbook course presentation.",
    menuItemIds: ["menu_01", "menu_02", "menu_04", "menu_05"]
  },
  {
    id: "booking_03",
    eventName: "Ultra-Premium Hideaway Omakase",
    clientName: "Kenichiro Tanaka",
    eventDate: "2026-06-22",
    guestCount: 6,
    pricePerPlate: 850,
    status: EventStatus.ContractSigned,
    venueAddress: "Pacific Heights Mansion, Broadway, San Francisco, CA",
    notes: "Counter-style chef interaction. Focus is on raw prestige ingredients, fresh high-ticket seafood lookbook, and bespoke wagyu customizations.",
    menuItemIds: ["menu_01", "menu_03", "menu_04", "menu_05"]
  }
];

export const INITIAL_DIETARY_RECORDS: DietaryRecord[] = [
  {
    id: "diet_01",
    guestIdentifier: "Lady Sterling (Hostess Spouse)",
    bookingId: "booking_01",
    criticalAllergies: ["Oysters", "Shellfish"],
    preference: DietaryPreference.None
  },
  {
    id: "diet_02",
    guestIdentifier: "Seat 4 (VIP Investor)",
    bookingId: "booking_01",
    criticalAllergies: ["Hazelnut", "Nuts"],
    preference: DietaryPreference.Keto
  },
  {
    id: "diet_03",
    guestIdentifier: "Honorable Senator Vance",
    bookingId: "booking_02",
    criticalAllergies: ["White Asparagus"],
    preference: DietaryPreference.Vegetarian
  },
  {
    id: "diet_04",
    guestIdentifier: "Dr. Kenichiro Tanaka (Host)",
    bookingId: "booking_03",
    criticalAllergies: ["Champagne Vinegar"],
    preference: DietaryPreference.Keto
  }
];

// Helper to determine if a menu item contains allergens or violates dietary preferences
export function checkImpactedItem(item: MenuItem, record: DietaryRecord): { isImpacted: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 1. Critical Allergy Check (contains any word matching our allergies list, case-insensitive)
  if (record.criticalAllergies && record.criticalAllergies.length > 0) {
    for (const allergy of record.criticalAllergies) {
      const lowerAllergy = allergy.trim().toLowerCase();
      if (!lowerAllergy) continue;

      // Check in item name, description, ingredients
      const inIngredients = item.keyIngredients.some(ing => ing.toLowerCase().includes(lowerAllergy));
      const inName = item.name.toLowerCase().includes(lowerAllergy);
      const inDesc = item.description.toLowerCase().includes(lowerAllergy);

      if (inIngredients || inName || inDesc) {
        reasons.push(`Contains potential allergen matching "${allergy}"`);
      }
    }
  }

  // 2. Dietary Preference Check
  if (record.preference !== DietaryPreference.None) {
    const isVegaX = record.preference === DietaryPreference.Vegan || record.preference === DietaryPreference.Vegetarian;
    const isVeganOnly = record.preference === DietaryPreference.Vegan;

    // Animal flesh markers
    const nonVegFleashes = ["Beef", "Wagyu", "Oysters", "Raw", "Caviar", "Chicken", "Pork", "Lamb", "Duck", "Seafood", "Fish", "Stock"];
    // Dairy/egg makers
    const nonVeganProducts = ["Butter", "Egg", "Cream", "Cheese", "Honey", "Gelatin", "Pectin", "Milk", ...nonVegFleashes];

    const itemText = (item.name + " " + item.description + " " + item.keyIngredients.join(" ")).toLowerCase();

    if (isVeganOnly) {
      const foundNonVegan = nonVeganProducts.some(p => itemText.includes(p.toLowerCase()));
      if (foundNonVegan) {
        reasons.push("Contains animal products, dairy, or egg (Incompatible with Vegan diet)");
      }
    } else if (isVegaX) {
      const foundMeat = nonVegFleashes.some(p => itemText.includes(p.toLowerCase()));
      if (foundMeat) {
        reasons.push("Contains meat or seafood (Incompatible with Vegetarian diet)");
      }
    } else if (record.preference === DietaryPreference.Keto) {
      // Carbs check
      const carbKeywords = ["Sugar", "Sorbet", "Pâte", "Potato", "Potatoes", "Flake", "Bread", "Nectar", "Fruit", "Vinegar", "Sweet"];
      const foundHighCarb = carbKeywords.some(p => itemText.includes(p.toLowerCase()));
      if (foundHighCarb) {
        reasons.push("High sugar or carbohydrate content (Incompatible with Keto diet)");
      }
    }
  }

  return {
    isImpacted: reasons.length > 0,
    reasons
  };
}
