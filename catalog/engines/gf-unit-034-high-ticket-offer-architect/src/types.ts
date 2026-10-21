export interface CoreModule {
  moduleName: string;
  purpose: string;
  keyComponents: string[];
  automationFormula?: string;
}

export interface SalesLetter {
  headline: string;
  subheadline: string;
  problemDescribed: string;
  coreBenefitsList: string[];
  whatsInside: string[];
  callToAction: string;
}

export interface HighTicketUpsell {
  upsellPackageName: string;
  transitionContext: string;
  customDeliverablesList: string[];
  integrationsRecommended: string[];
  privateOnboardingAndTrainingPlan: string;
  marginJustification: string;
}

export interface OutreachTemplates {
  linkedinOutreach: string;
  emailSequence1: string;
  emailSequence2: string;
}

export interface ConceptBlueprint {
  packageName: string;
  niche: string;
  platform: string;
  valueProposition: string;
  coreEcosystemModules: CoreModule[];
  marketingHooks: string[];
  gumroadSalesLetter: SalesLetter;
  highTicketUpsellStrategy: HighTicketUpsell;
  outreachTemplates: OutreachTemplates;
}

export interface PresetConcept {
  id: string;
  packageName: string;
  niche: string;
  platform: string;
  tagline: string;
  valueProposition: string;
  coreEcosystemModules: CoreModule[];
  marketingHooks: string[];
  gumroadSalesLetter: SalesLetter;
  highTicketUpsellStrategy: HighTicketUpsell;
  outreachTemplates: OutreachTemplates;
}
