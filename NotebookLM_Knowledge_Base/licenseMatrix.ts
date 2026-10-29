/**
 * GhostFactoryOS × Aura & Grid APA Valuation Matrix
 * 
 * Defines the Pure Asset Purchase Agreement (APA) Title Transfer framework:
 * 1. Track 1 (Lean Tuner): Retail Price: $4,500 ($3,800–$6,500)
 * 2. Track 2 (Hypercar Flagship): Retail Price: $14,500 | Strategic Buyout: $25k–$50k
 * 3. Track 3 (Skunkworks Engine): Retail Price: $35,000–$150,000 (Top-Tier Flagship Retail Price: $150,000)
 */

export type LicenseType = 'standard' | 'pro' | 'exclusive_buyout';

export interface LicenseDefinition {
  type: LicenseType;
  name: string;
  exclusivity: 'non-exclusive' | 'exclusive';
  term: string;
  rights: string;
  description: string;
  includesUpdates: boolean;
  removesFromSale: boolean;
  requiresNotPermanent: boolean;
}

export const LICENSE_MATRIX: Record<LicenseType, LicenseDefinition> = {
  standard: {
    type: 'standard',
    name: 'Standard APA Buyout',
    exclusivity: 'exclusive',
    term: 'Asset Purchase Agreement (APA)',
    rights: 'Direct repository & title transfer',
    description: 'Turnkey Asset Purchase Agreement (APA) conveying single-asset source code and schema title.',
    includesUpdates: true,
    removesFromSale: true,
    requiresNotPermanent: false,
  },
  pro: {
    type: 'pro',
    name: 'Vault APA Buyout',
    exclusivity: 'exclusive',
    term: 'Vault Asset Purchase Agreement (APA)',
    rights: 'Full vertical IP assignment & repository handover',
    description: 'Institutional Vault APA buyout with full clean-room IP assignment and schema migration kit.',
    includesUpdates: true,
    removesFromSale: true,
    requiresNotPermanent: false,
  },
  exclusive_buyout: {
    type: 'exclusive_buyout',
    name: 'Exclusive Title (APA)',
    exclusivity: 'exclusive',
    term: 'Asset Purchase Agreement (APA)',
    rights: 'Exclusive IP ownership & source transfer',
    description: 'Removes the asset from the showroom; offered for eligible liquid tranche units under the 80% retention floor.',
    includesUpdates: true,
    removesFromSale: true,
    requiresNotPermanent: true,
  },
};

export const LICENSE_TIERS: LicenseDefinition[] = [
  LICENSE_MATRIX.standard,
  LICENSE_MATRIX.pro,
  LICENSE_MATRIX.exclusive_buyout,
];

export interface BlueprintPricing {
  standardPrice: string;
  proPrice: string;
  buyoutPrice?: string;
  buyoutAnchor?: string;
  buyoutRange?: string;
  ctaLabel: string;
  secondaryCtaLabel?: string;
  isBuyoutEligible: boolean;
}

/**
 * Derives Pure APA Buyout valuation and CTA labels for any unit by track.
 */
export function getBlueprintPricing(product: {
  id: number;
  pricing_track?: string;
  flagship_qualified?: boolean;
  buyoutEligible?: boolean;
  permanent?: boolean;
  exclusive_buyout_anchor?: number;
  exclusive_buyout_range?: number[];
}): BlueprintPricing {
  const isTrack3 = product.pricing_track?.includes('Track 3') || product.id >= 138;
  const isBuyoutEligible = Boolean((product.buyoutEligible ?? true) && !product.permanent);

  if (isTrack3) {
    return {
      standardPrice: 'Retail Price: $35,000–$150,000',
      proPrice: 'Wholesale Price: $17,500–$35,000',
      buyoutPrice: '$35,000–$150,000',
      buyoutAnchor: 'Retail Price: $35,000–$150,000',
      buyoutRange: 'Wholesale Price: $17,500–$35,000',
      ctaLabel: 'ACQUIRE TITLE (APA)',
      secondaryCtaLabel: 'MOUNT CHASSIS ON DYNO',
      isBuyoutEligible,
    };
  }

  const isTrack2 = product.pricing_track?.includes('Track 1')
    ? false
    : Boolean(product.flagship_qualified) ||
      (product.pricing_track?.includes('Track 2') ?? false) ||
      (product.id >= 86 && product.id !== 112);

  if (isTrack2) {
    return {
      standardPrice: 'Retail Price: $14,500',
      proPrice: 'Wholesale Price: $7,250',
      buyoutPrice: '$14,500',
      buyoutAnchor: 'Retail Price: $14,500',
      buyoutRange: 'Wholesale Price: $7,250',
      ctaLabel: 'ACQUIRE TITLE (APA) - $14,500',
      secondaryCtaLabel: 'INQUIRE VAULT BUYOUT',
      isBuyoutEligible,
    };
  }

  return {
    standardPrice: 'Retail Price: $12,500',
    proPrice: 'Wholesale Price: $6,250',
    buyoutPrice: '$12,500',
    buyoutAnchor: 'Retail Price: $12,500',
    buyoutRange: 'Wholesale Price: $6,250',
    ctaLabel: 'ACQUIRE TITLE (APA) - $12,500',
    isBuyoutEligible,
  };
}

