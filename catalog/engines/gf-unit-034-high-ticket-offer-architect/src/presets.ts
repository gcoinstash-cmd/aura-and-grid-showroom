import { PresetConcept } from "./types";

export const PRESET_CONCEPTS: PresetConcept[] = [
  {
    id: "agency-acquisition-os",
    packageName: "AgencyAcquisition OS Engine",
    niche: "Boutique Creative & Growth Agencies (generating $50k-$250k/mo)",
    platform: "Airtable + Make.com (with custom webhooks)",
    tagline: "Automate outbound lead sourcing, data enrichment & customized appointment setting.",
    valueProposition: "High-volume digital agencies leak up to 35% of inbound pipeline due to slow response times and zero automated qualification. Modern agencies waste precious founder hours researching warm leads and writing personalized openers manually. This system automates lead capturing, pulls deep firmographic data, rates target budgets, and triggers outbound calendar pitches within 95 seconds.",
    coreEcosystemModules: [
      {
        moduleName: "Multi-Channel Ingestion & Enrichment Hub",
        purpose: "Aggregates cold leads from Apollo, Clay, and Warm webforms into a single highly structured, centralized clearing house.",
        keyComponents: [
          "Universal Forms Webhook Parser (Framer, Webflow, LinkedIn Lead Gen)",
          "Data Enrichment Pipeline (Clearbit & BuiltWith API integrations)",
          "Estimated Revenue & Technographics Classifier",
          "Duplicate Lead & Previous Outreach Sanitizer"
        ],
        automationFormula: "Trigger: Inbound Webhook is fired via Make.com. -> Action 1: Query BuiltWith to identify CMS/tech-stack -> Action 2: Retrieve employee headcount and funding history -> Action 3: Write data back into 'Prospects' Airtable table -> Action 4: Set status to 'Enriched' for routing."
      },
      {
        moduleName: "Outbound Followup Cadence Trigger Engine",
        purpose: "Maintains optimal close rate by enforcing standardized CRM milestones and automating task sequences.",
        keyComponents: [
          "Dynamic SLA Breach (4-hour countdown tracker)",
          "Auto-Drafting Personalized Introduction Opener",
          "Sales Rep Task Assignment Logic Table",
          "Scheduled Follow-up Reminders Grid"
        ],
        automationFormula: "Trigger: Lead status remains 'Qualified Uncontacted' for over 4 hours. -> Action: Calculate target rep schedules -> Action: Generate high-relevance email drafting using lead data -> Action: Ping customized notification in private Slack channels with direct hotlinks."
      },
      {
        moduleName: "Revenue attribution & CAC Dashboard",
        purpose: "Analyzes client lifetime value (CLV) and acquisition costs to optimize ad campaigns and outbound budget distribution.",
        keyComponents: [
          "Won Deals Ledger Linked to Stripe Payments",
          "Calculated Cost Per Lead (CPL) by Source Table",
          "Monthly Rep Commissions Tracker Canvas",
          "LTV-to-CAC Ratio visual calculator"
        ],
        automationFormula: "Trigger: A payment is received via Stripe Checkout Webhook. -> Action: Find corresponding record in Airtable Hub -> Action: Update CRM stage to 'Deal Won' or 'Re-Activated' -> Action: Calculate cost-to-close metrics automatically."
      }
    ],
    marketingHooks: [
      "🔥 'Stop paying raw virtual assistants. Deploy an autonomous client engine that enriches, qualifies, and primes agency deals in 95 seconds.'",
      "📌 'The fully automated B2B Agency CRM that high-end agencies use to streamline outbound deals, without database clutter.'",
      "💼 'Turn your boutique agency's cold pipeline into a centralized high-ticket operation. Airtable-Make blueprints ready to load.'"
    ],
    gumroadSalesLetter: {
      headline: "The Autonomous Agent Client Blueprint: Close Boutique Growth Clients Without Constant Hustle",
      subheadline: "For boutique agency owners tired of missing qualified meetings & wasting creative energy on manual follow-up logs.",
      problemDescribed: "Agencies struggle to scale past $100k/mo because they treat client acquisition like a creative art instead of a predictable engineering system. Lead lists are copy-pasted into spreadsheets. Enriched data lies neglected. Founders spend midnight hours trying to remember who to message. Low-relevance salespeople burn premium ad budgets. This system brings institutional rigor directly to your agency with automated infrastructure, saving 25+ hours of manual labor per week.",
      coreBenefitsList: [
        "Enrich lead datasets instantly with full technologies, revenue ranges, and executive contacts on autopilot",
        "Maintain a neat, professional Deal Flow Kanban that aligns cold prospects to active client pipelines",
        "Enforce strict client delivery timelines via built-in SLA alert integrations directly in Discord or Slack"
      ],
      whatsInside: [
        "Fully-mapped agency CRM template (Airtable Blueprint Schema)",
        "3 high-relevance Make.com automated blueprint blueprints (.json configuration files)",
        "Comprehensive 45-minute premium system walkthrough with standard operating procedures",
        "Outbound tracking tables & personalized automated email copy templates"
      ],
      callToAction: "Deploy Your Agency Acquisition System Today for Only $350"
    },
    highTicketUpsellStrategy: {
      upsellPackageName: "The Customized Agency Systems Implementation",
      transitionContext: "Pitch buyers who already bought the template and run into personal workflow constraints: 'The $350 blueprint is complete. But if you want a custom, white-gloved build that plugs into your legacy HubSpot CRM, is custom-branded to your agency, and comes with a bespoke team-facing SLA Dashboard, let's step up to the Enterprise Custom implementation.'",
      customDeliverablesList: [
        "Surgical migration of up to 5,000 legacy CRM records from Google Sheets, HubSpot or Pipedrive",
        "Custom design of individual brand attributes, company colors, logo pairings, and navigation layout",
        "Configuration of dedicated SMS/Email API gateways (Twilio, Sendgrid) and custom-routed DNS setups",
        "Production of 3 highly customized industry-specific outbound acquisition sequences with deep pre-saved persona rules"
      ],
      integrationsRecommended: [
        "Hubspot Enterprise CRM APIs",
        "Lusha Data Enrichment Gateway",
        "Twilio Dynamic Texting Engine",
        "Apollo.io Custom CRM Snych Webhooks"
      ],
      privateOnboardingAndTrainingPlan: "2 live 90-minute design consultation & setup calls with our senior architect, a custom Loom training archive detailing every automation trigger for your specific team, and 30 days of private Slack helpdesk support with a guaranteed 4-hour SLA.",
      marginJustification: "The agency owner avoids hiring an internal operations manager (minimum cost $6k/month) and prevents standard software leaks, turning a $3,500 investment into a highly repeatable inbound pipeline that pays back with the first single client closed."
    },
    outreachTemplates: {
      linkedinOutreach: "Hey {First Name}, saw your agency is currently expanding the {Niche} team. Often finding that scaling boutique operators are having sales reps waste 40% of their days chasing stale pipeline contacts. We built a fully autonomous client pipeline OS on Airtable + Make that qualified and assigned deals to reps in under 2 minutes. Shared the complete concept diagram with several 8-figure agency owners already. Any interest in taking a quick peek? Open to sharing the schema.",
      emailSequence1: "Subject: automating your agency's pipeline chaos, {First Name}...\n\nHi {First Name},\n\nWhen your creative growth team is scaling, manual follow-up is the first thing that gets forgotten. If your reps take hours to qualify a lead, your contact rates plummet by 390%.\n\nWe engineered the 'Agency CRM OS' to entirely systemize client acquisition:\n1. Ingest leads automatically from webforms and LinkedIn.\n2. Instantly lookup technologies + funding levels using BuiltWith/Clearbit APIs.\n3. Ping reps on Slack with custom pre-drafted emails within 95 seconds.\n\nWe sell this blueprints pack to boutique operators for $350, but I'd happily send over the exact architecture diagram so your team can set it up free. Or we can consult with you to build it bespoke.\n\nLet me know if you would like me to slide the design over?\n\nBest,\n{Your Name}",
      emailSequence2: "Subject: Quick audit on your current stack, {First Name}?\n\nHi {First Name},\n\nNo pitch today. I recorded a quick 4-minute overview showing how high-growth sales agencies configure their Slack alerting thresholds and Make.com routers so no hot deal slips through the cracks.\n\nOur clients use this specific architecture to completely avoid hiring high-overhead operational managers, keeping cold client CAC at historical lows.\n\nShould I send the Loom video link over here?\n\nBest,\n{Your Name}"
    }
  },
  {
    id: "consultant-authority-engine",
    packageName: "The Solo Sovereign Consultation CRM",
    niche: "Independent Consultants, Executive Advisors, and Fractional Executives",
    platform: "Framer Portal + Notion Master Control",
    tagline: "Unify content planning, qualified executive applications, and automated onboarding.",
    valueProposition: "High-ticket solo consultants face a constant feast-or-famine cycle. They write content to trigger authority, but have no reliable mechanism to filter high-budget corporate accounts from low-budget solopreneurs. This system establishes a premium, gated authority portal that forces inbound accounts to declare revenue sizes and problem severity before scheduling corporate advisory briefings.",
    coreEcosystemModules: [
      {
        moduleName: "Sovereign Application Gatekeeper",
        purpose: "Pre-qualifies incoming client requests and enforces corporate budget standards before unlock code or calendar scheduler.",
        keyComponents: [
          "Interactive Budget-Filtering Form Interface",
          "Calculated Deal Size Scoring Block",
          "Automated Cal.com Secret URI Generator",
          "High-Value Account Red-Alert System"
        ],
        automationFormula: "Trigger: Form entry completed with declared Budget > $10,000. -> Action 1: Query Notion CRM directory -> Action 2: Retrieve private high-tier Cal.com schedule link -> Action 3: Dispatch invitation automated email to client -> Action 4: Register active pipeline item in Notion."
      },
      {
        moduleName: "Authority Matrix & Content Scheduler",
        purpose: "Streamlines publishing with pre-mapped, high-status B2B templates and asset delivery tracking.",
        keyComponents: [
          "LinkedIn Hooks Matrix Notion Table",
          "Lead Magnet Vault Gate Tracker",
          "Content Ideas Queue with Tag Search",
          "Social Engagement Analysis Sheet"
        ],
        automationFormula: "Trigger: Content status set to 'Ready' on Notion Editorial Plan -> Action: Trigger Make automation to format text tags -> Action: Log scheduled date inside calendar -> Action: Set reminder alert for morning publication focus."
      },
      {
        moduleName: "Premium Instant Client Onboarding Vault",
        purpose: "Guarantees a premium client onboarding experience that starts within seconds of receipt of payment.",
        keyComponents: [
          "Instant Client Access Gateway link maker",
          "Standard Client Project Scope (SOW) Automator",
          "Notion Shared Workspace Blueprint Instantiation",
          "Automated Invoice & Stripe Link dispatcher"
        ],
        automationFormula: "Trigger: Stripe Checkout invoice matches advisor tier. -> Action 1: Clone template client Notion portal -> Action 2: Create secure guest share access -> Action 3: Dispatch welcome workspace email with initial video steps → Action 4: Register contract active."
      }
    ],
    marketingHooks: [
      "🔥 'Stop playing the LinkedIn DM game with low-budget contacts. The Sovereign System pre-screens enterprise leads before they touch your schedule.'",
      "📌 'For fractional executives: A beautiful Framer portal connected directly to your private Notion dashboard to automate incoming qualified inquiries.'",
      "💼 'An elite digital ecosystem built for independent B2B advisors who charge $5k+/mo and demand a matching clients experience.'"
    ],
    gumroadSalesLetter: {
      headline: "The Authority Acquisition Hub. Automate Elite Pre-Qualification & Corporate Onboarding for Solopreneur Advisors",
      subheadline: "For high-ticket consultants ready to banish discovery call fatigue and client onboarding friction forever.",
      problemDescribed: "Solo consultants make the mistake of looking like generic freelancers. Leads send email inquiries, and the advisor frantically coordinates schedules back and forth. You get on calls only to find out the prospect has a $500 project budget. It looks disorganized and dilutes your premium pricing authority. The Authority Acquisition Hub transforms your system into a modern, corporate executive terminal. Your content is meticulously organized, prospects are rigorously qualified, and closed clients are onboarded in seconds.",
      coreBenefitsList: [
        "Present a jaw-dropping premium digital presence via custom gated assets and polished application interfaces",
        "Systematically reject low-ticket inquiries without losing prospect goodwill or spending hours on manual emails",
        "Deliver a flawless, world-class instant service client experience with automated onboarding portals"
      ],
      whatsInside: [
        "The Elite Sovereign framed application template (Framer Design System)",
        "Master Advisory Control Panel (Comprehensive Notion Database template Hub)",
        "2 fully integrated automated connection formulas (.json files for Make.com)",
        "Interactive outbound negotiation script library for key advisory clients"
      ],
      callToAction: "Own the Complete Sovereign Advisory OS for $350"
    },
    highTicketUpsellStrategy: {
      upsellPackageName: "The Master Authority Bespoke Installation",
      transitionContext: "Pitch buyers who want custom, professional alignment: 'The blueprint gives you the framework. But if you want us to write your custom, automated corporate onboarding script, integrate Cal.com custom CSS, white-label your custom subdomains, and program a custom corporate outreach engine, our custom setup handles it all.'",
      customDeliverablesList: [
        "Bespoke Framer UI/UX redesign tailored to match your personal executive portraiture & brand style guide",
        "Deep custom writing of a 3-part premium corporate advisory lead magnet sequence (fully formatted)",
        "Advanced Stripe and Cal.com custom integration, including localized company tax calculation configurations",
        "Full CSV-based migration of past CRM history, contract databases, and active client documents"
      ],
      integrationsRecommended: [
        "Framer VIP Domain Gateways",
        "Cal.com Developer REST APIs",
        "Stripe Custom Tax Automators",
        "Notion Enterprise Client Workspace Databases"
      ],
      privateOnboardingAndTrainingPlan: "3 executive-grade roadmap consulting calls, a dedicated executive assistant setup manual, and 30-day VIP messaging support over a private Telegram thread directly with our team.",
      marginJustification: "Solo consultants operate with extremely high LTV (often $30,000 to $100,000 per locked client). Securing just one single corporate agreement because of a hyper-professional application gating platform pays back the $3,500 investment instantly."
    },
    outreachTemplates: {
      linkedinOutreach: "Greetings {First Name}, read your recent insightful piece on executive scaling. I work with high-tier consultants who find that while personal brand engagement is high, their inbound pipeline contains 90% unqualified solopreneurs. We helped fractional leaders deploy an automated Sovereign Gating system that pre-filters corporate clients on autopilot before they ever touch your schedule. Open to reviewing the interactive concept flow? Happy to drop it over.",
      emailSequence1: "Subject: Streamlining client onboarding for {First Name}...\n\nHi {First Name},\n\nWhen advisory clients are paying you upwards of $5,000/month, the onboarding experience can make or break the relationship. Sending massive manual worksheets and coordinating calendars over email looks amateur.\n\nWe designed the 'Sovereign Advisor Portals' on Framer & Notion to unify three high-impact workflows:\n1. Elite Prospect Gating: Forces companies to declare budgets and business bottlenecks before scheduling.\n2. Scheduled CRM Syncing: Instant notification on key high-intent accounts.\n3. Dynamic Client Induction: Automated provisioning of private workspace folders when they complete payment.\n\nI design these systems for select solo fractional advisors. I'd be happy to share the visual client experience flow to show you how it works.\n\nAre you available for a 5-minute preview of the schema?\n\nBest,\n{Your Name}",
      emailSequence2: "Subject: Eliminating discovery call fatigue, {First Name}...\n\nHi {First Name},\n\nQuick follow-up with no pitch attached.\n\nMost B2B advisors burn out because they're doing 15 discovery calls a week with people who can't afford their retainer. Our clients cut that down to 3 highly vetted, pre-qualified corporate video calls by deploying simple, beautiful application portals.\n\nI put together a brief outline showing the specific conversion gating numbers we use to maintain a 40%+ closing rate.\n\nShould I send the link over to help streamline your quarter?\n\nBest,\n{Your Name}"
    }
  },
  {
    id: "venture-partner-hub",
    packageName: "The Institutional Dealflow & LP Portal",
    niche: "High-Growth VC Funds, Investment Syndicates, and Placement Agents",
    platform: "Webflow Client Area + Airtable Deal Ledger",
    tagline: "Track prospective LP capital allocations, distribute syndicated deals, and track pitchdeck telemetry.",
    valueProposition: "In the private equity and VC space, acquiring and managing Limited Partner (LP) capital is a highly manual, chaotic mess of spreadsheets, DocuSign tabs, and leaky PDF pitch decks. This system brings institutional automation to dealer-manager syndications: managing LP commitments, tracking deck slide viewership, and automating compliant capital calls.",
    coreEcosystemModules: [
      {
        moduleName: "LP Capital Commitment Ledger",
        purpose: "Enforces SEC / fundraising compliance by centralizing LP accredited certifications and subscription agreement statuses.",
        keyComponents: [
          "Accredited Qualification Screening Form",
          "Dynamic KYC Checklist Status Grid",
          "LP Pipeline Capital Call Progress Ledger",
          "Calculated Asset Class Allocation Ratios"
        ],
        automationFormula: "Trigger: SEC status updated to 'Qualified Accredited' in Airtable. -> Action 1: Generate PDF Turnkey Software Asset Transfer (APA) Booklet via Document Parser API -> Action 2: Instantly distribute DocuSign term-sheet payload -> Action 3: Flag Venture Partner in internal Slack for validation."
      },
      {
        moduleName: "Syndicate Dealflow Portal",
        purpose: "Safely shares active investment details, deal briefs, and pitch materials behind a compliant private password interface.",
        keyComponents: [
          "Secure Portfolio Investment Deal Room Webflow view",
          "Deck Viewer Engagement Tracking Table",
          "Interactive Allocation Request Gating form",
          "Automated Syndication Outbound Newsletter engine"
        ],
        automationFormula: "Trigger: LP clicks 'View Active Deal Brief' link. -> Action 1: Register page event in Airtable Tracker -> Action 2: Set slide viewed timer -> Action 3: If view duration exceeds 120 seconds, send executive summary directly to LP."
      },
      {
        moduleName: "Venture Deal Pipeline Tracker",
        purpose: "Tracks inbound company pitches from initial screening to Investment Committee (IC) due-diligence approvals.",
        keyComponents: [
          "Founder Inbound Form Parser Page",
          "Target Industry Sector Automatic Categorizer",
          "IC Due Diligence Milestone checklist",
          "Venture Portfolio Valuation Tracking system"
        ],
        automationFormula: "Trigger: Founder form submission indicates MRR > $50k. -> Action 1: Flag high-priority sector in Lead Hub -> Action 2: Trigger investor intro template script -> Action 3: Queue on due-diligence tasks dashboard."
      }
    ],
    marketingHooks: [
      "🔥 'Stop leaking investment pitchdecks to non-accredited groups. Set up a secure, white-labeled LP Allocation Room on Webflow & Airtable.'",
      "📌 'The capital raising and syndication operating system utilized by modern emerging technology managers to track $10M+ pipelines.'",
      "💼 'A professional institutional ecosystem that replaces expensive $15k per year SaaS tools for syndicating dealflow with transparent owned components.'"
    ],
    gumroadSalesLetter: {
      headline: "The Institutional Investor Acquisition Hub. Run Capital Raising Like a High-Tech Deal Desk",
      subheadline: "For emerging VC funds, angel syndicates, and real estate investment groups tired of chaotic LP capital-raising pipelines.",
      problemDescribed: "Emerging managers raise capital with emails, spreadsheets, and shared raw PDFs. You send an investment proposal out and have no idea if your lead prospects actually read it, why they dropped off, or if their legal terms are compliant. It leads to missed funding goals, friction with regulators, and lost corporate trust. This Webflow + Airtable LP Portal automates fundraising compliance while tracking exactly who opens your assets, letting you raise capital with analytical precision.",
      coreBenefitsList: [
        "Unify all LP contact parameters, legal KYC validations, and investment target documents into one Airtable database",
        "Enable precise telemetry monitoring of deck engagement so you focus partner outreach on warm accounts",
        "Bypass exorbitant, high-friction compliance SaaS fees by deploying a custom white-labeled platform"
      ],
      whatsInside: [
        "Master Institutional Dealflow CRM schema (Airtable Blueprint Template)",
        "Premium Secure LP Investor Lounge configuration (Webflow Project Backup link)",
        "3 high-relevance Make.com webhook automation bundles for DocuSign and email",
        "Complete LP compliance handbook layout and on-screen workflow maps"
      ],
      callToAction: "Acquire the Sovereign Private Equity Asset System with Full Setup for $350"
    },
    highTicketUpsellStrategy: {
      upsellPackageName: "The Sovereign Fund Bespoke Custom Blueprint",
      transitionContext: "Pitch emerging fund managers demanding absolute data privacy: 'We have provided the initial template structures. For funds preparing live investor raises requiring bank-grade security integrations, legal KYC automation, Stripe Treasury capabilities, and complete SEC-compliant document routing, we implement our $3,500 enterprise bespoke installation.'",
      customDeliverablesList: [
        "Full implementation of custom OAuth secure LP validation logic inside Webflow/Airtable portals",
        "Integration of professional KYC verification systems (e.g. Persona/Passbase Webhooks)",
        "Writing of 5 custom, hyper-targeted investor follow-up sequences using dynamic CRM variable tagging",
        "Bespoke white-labeled LP subscription certificate creation, automated via Adobe Sign integration"
      ],
      integrationsRecommended: [
        "Stripe Treasury Banking Node APIs",
        "Persona Identity Verification Services",
        "DocuSign Enterprise Developer APIs",
        "Airtable Enterprise DB Access Control Gateways"
      ],
      privateOnboardingAndTrainingPlan: "3 dedicated strategic fundraising calls, custom video operating matrices for your investment partners, and a full 1-on-1 walk-through with your venture fund's legal counsel.",
      marginJustification: "Emerging managers are closing multi-million dollar funds. Paying a flat $3,500 custom implementation is an trivial cost compared to the alternative of continuous administrative delays, regulatory friction, or hiring full-time operational support."
    },
    outreachTemplates: {
      linkedinOutreach: "Hello {First Name}, saw your focus of VC dealflow in early-stage tech. Emerging managers often lose massive hours on LP data and deck tracking during capital raising. We helped syndicates assemble a private Webflow + Airtable investor room that tracks deck slide engagement and automates KYC. Happy to share our operational schema diagram with you if you're exploring system upgrades this year. Shall I drop it here?",
      emailSequence1: "Subject: Streamlining LP allocation pipelines, {First Name}...\n\nHi {First Name},\n\nManaging VC allocations using sheets and emails leads to massive document confusion. More critically, you raise without telemetry: you have no idea which prospective LP opened your memo or how many minutes they spent on the financials.\n\nWe designed the 'Institutional Investor OS' to combine structural compliance with modern product analytics:\n1. White-Labeled Portal: Secure investor gate matching your fund brand.\n2. Engagement Telemetry: Track when a prospective LP clicks resources in real-time.\n3. Dynamic KYC Compliance: Automate document Generation for SEC accreditation.\n\nWe share our templates with raising GPs for $350, but I would be glad to email over our standard operating schema diagram for your team's review.\n\nLet me know if you would like me to share the blueprint?\n\nBest,\n{Your Name}",
      emailSequence2: "Subject: Eliminating investor friction, {First Name}...\n\nHi {First Name},\n\nOur research shows emerging tech syndicates lose up to 30% of warm investors simply due to friction in signing physical subscription agreements.\n\nOur automated Airtable-DocuSign schema prompts accredited investors with simple pre-filled fields the second active deal briefs are signed, keeping closing speed down to minutes.\n\nI created a brief 3-minute video showcase explaining our automation workflows. Would you find value in having it?\n\nBest,\n{Your Name}"
    }
  }
];
