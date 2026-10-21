import { StoreItem, JournalEntry } from './types';

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'prov-01',
    name: 'Infused Botanical Elixir №9',
    subtitle: 'Slow-infused for forty-eight hours with sweet hand-harvested honeysuckle, charred chicory root, and smoked Georgia orange peel.',
    description: 'An elevated sensory liquid designed for food pairings. Slow-infused over forty-eight hours with sweet hand-harvested honeysuckle, charred chicory root, and smoked Georgia orange peel.',
    category: 'provisions',
    price: 64,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=1000',
    details: [
      'Volume: 375ml frosted flask with black wax seal',
      'Flavor Profile: Smoked hearth orange, bittersweet juniper, chicory bark undertones',
      'Culinary Pairing: Best served chilled alongside hickory-smoked duck or dark chocolate chess pie'
    ],
    availability: 'Available for Nightly Dinner Service'
  },
  {
    id: 'prov-02',
    name: 'Reserve Cold-Pressed Truffle Oil',
    subtitle: 'Extracted Umami of Black Perigord & Toasted Pecan',
    description: 'A luxurious culinary dressing. Cold-pressed Southern pecan oil combined with black winter Perigord truffles to create a rich, dense forest floor finish for heirloom side dishes.',
    category: 'provisions',
    price: 88,
    image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&q=80&w=1000',
    details: [
      'Volume: 150ml matte-black frosted dropper bottle',
      'Origin: Perigord Black Truffles & wild Georgia pecans',
      'Optimal pairing: Drizzled over three-cheese baked macaroni configurations or fire-roasted heirloom root vegetables'
    ],
    availability: 'Available for Nightly Dinner Service'
  },
  {
    id: 'stone-01',
    name: 'Heritage Smoked Brisket & Charred Allium',
    subtitle: 'Slow-rendered over cured hickory for fourteen hours, served over a velvet parsnip purée and finished with an heirloom wild ramp reduction.',
    description: 'Slow-rendered over cured hickory for fourteen hours, served over a velvet parsnip purée and finished with an heirloom wild ramp reduction.',
    category: 'provisions',
    price: 48,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000',
    details: [
      'Smoking Wood: Aged shagbark hickory & pecan wood splits',
      'Core Temperature: 203°F slow-render threshold',
      'Accompaniment: Buttered parsnip purée, pickled wild ramps, wild allium glaze'
    ],
    availability: 'Chef\'s Daily Limited Allocation'
  },
  {
    id: 'stone-02',
    name: 'Heirloom Bourbon & Tea Pairing',
    subtitle: 'Bespoke Hot-Steeped Chicory & Bourbon Flight',
    description: 'A striking presentation course designed to elevate the service of barrel-aged whiskey, hot steeped chicory, and artisanal molasses cubes after a rich Southern meal.',
    category: 'stoneware',
    price: 38,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1000',
    details: [
      'Pairing Core: Aged Single Barrel Kentucky Bourbon (1.5oz)',
      'Infusion: Traditional roasted Mississippi chicory root tea',
      'Accompaniment: Hand-cut dark molasses sugar cubes & orange zest'
    ],
    availability: 'Curated Table-Side Presentation'
  },
  {
    id: 'lit-01',
    name: 'Cast Iron Southern Peach Cobbler',
    subtitle: 'Warm Georgia Peaches & Bourbon Vanilla Ice Cream',
    description: 'Generational-recipe sweet Georgia peaches baked under an artisanal sea-salt butter crust in a seasoned mini cast iron skillet, crowned with house-churned bourbon vanilla bean ice cream.',
    category: 'literature',
    price: 18,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=1000',
    details: [
      'Preparation: Baked fresh to order in single-use mini cast iron',
      'Ice Cream: House-churned 100% organic vanilla bean & single-barrel bourbon',
      'Serving: Served warm tableside with a light dusting of brown sugar praline'
    ],
    availability: 'Available for Nightly Dinner Service'
  },
  {
    id: 'lit-02',
    name: 'Dark Chocolate Chess Tart No. II',
    subtitle: 'Heirloom Chocolate Filling & Flaked Sea Salt',
    description: 'A rich, velvety dark chocolate custard baked in a crisp cocoa pastry shell, finished with a touch of espresso powder and flaked Maldon sea salt.',
    category: 'literature',
    price: 16,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=1000',
    details: [
      'Cocoa Percent: 72% Valrhona single-origin dark chocolate',
      'Pastry: Flaky dark cocoa pate sablee',
      'Finish: Smoked Maldon sea salt flakes'
    ],
    availability: 'Chef\'s Daily Limited Allocation'
  }
];

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    number: '01',
    title: 'THE ART OF THE 24-HOUR BRINE',
    subtitle: 'Symmetry, Negation, and Southern Comfort Plating',
    excerpt: 'Examining why luxury comfort food is most potent when framed by dramatic black plates, isolating complex rich flavors from visual distractions.',
    content: 'We hold that every culinary event is a volumetric configuration. Traditional Southern cooking—rich, storied, and complex—deserves a layout that clarifies rather than clutters. By framing heirloom collard greens and 24-hour slow brined poultry against stark charcoal ceramic boundaries, we redirect focus entirely to their deep, historical flavor matrices.',
    date: 'EQUINOX I'
  },
  {
    number: '02',
    title: 'THE SMOKE ARCHIVE: HARDWOOD OAK & HICKORY',
    subtitle: 'A Study in Hardwood Oak and Hickory Densities',
    excerpt: 'An investigation into mountain moss-aged kiln wood, cherry embers, and the dry-wood heat used to draw clean, sweet smoke notes from heirloom meats.',
    content: 'The search for perfect smoke flavor is a study in thermodynamic control. Our smoking chambers utilize curated splits of slow-cured hickory and kiln-dried oak. This precision heat creates sweet, thin blue smoke, infusing heritage pork bellies and aged short ribs with beautiful fragrance without any bitter ash residue.',
    date: 'SOLSTICE II'
  },
  {
    number: '03',
    title: 'THE ART OF IRON & SMOKE',
    subtitle: 'Why generations of Southern cooking belong in seasoned cast iron.',
    excerpt: 'Rejecting standard thin porcelain for heavy, warm, faceted clay cups. Challenging the hands to anchor themselves as they hold hot, dark liquid comfort.',
    content: 'Standard luxury focuses on effortless lightness. We aim for deliberate, grounding presence. A heavy clay cup with faceted stone surfaces slows the dining ritual down, forcing the guest to hold and savor the warm chicory distillations and sweet bourbon finishes. This tactile resistance heightens sensory resonance.',
    date: 'EQUINOX II'
  }
];

export const RESIDENCY_ATMOSPHERES = [
  {
    id: 'alcove',
    title: 'The Obsidian Alcove',
    description: 'A completely sequestered, dark-polished dining chamber utilizing subterranean basalt platters, low-frequency gaslight warmth, and an intimate dining bar for four. Perfect for our signature ten-course Southern heirloom micro-tasting menu.',
    capacity: '1 to 4 guest maximum',
    experienceText: 'Ten-step luxury Southern tasting journey exploring heritage comfort recipes.'
  },
  {
    id: 'hearth',
    title: 'The Candlelit Hearth',
    description: 'Our central grand chimney parlor centered around a live oak-fire hearth, highlighting 24-hour slow-smoking, skillet-baked sweetbreads, heirloom cornbread, and charred bone marrow.',
    capacity: '2 to 6 guests',
    experienceText: 'Earth-centric, fire-forged culinary anthology service and comfort table bookings.'
  },
  {
    id: 'glass',
    title: 'The Glass Conservatory',
    description: 'An architectural glass pavilion overlooking our dark pebble courtyard, mirroring the night sky. Serves curations of seasonal Southern comfort menus with carefully paired premium whiskey flights.',
    capacity: '2 to 8 guests',
    experienceText: 'Exquisite pairing menus highlighting aged Bourbon and botanical wine flights.'
  }
];
