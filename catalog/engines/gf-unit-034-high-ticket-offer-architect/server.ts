import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize server-side Gemini API client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON requests
  app.use(express.json());

  // API endpoint for Offer Blueprint Generation
  app.post("/api/generate-offer", async (req, res) => {
    try {
      const { ownerProfile, nicheName, coreExpertise, targetPlatform, pricePoint, upsellPricePoint } = req.body;

      if (!nicheName || !targetPlatform) {
        return res.status(400).json({ error: "nicheName and targetPlatform are required fields." });
      }

      const price = pricePoint || "$350";
      const upsellPrice = upsellPricePoint || "$3,500";
      const profileText = ownerProfile ? `The provider background/profile is: ${ownerProfile}.` : "";
      const expertiseText = coreExpertise ? `Their core expertise lies in: ${coreExpertise}.` : "";

      const userPrompt = `
        Act as an elite strategic product consultant, B2B offer architect, and master high-ticket sales copywriter.
        I need you to engineer a premium, niche-focused template ecosystem (the "$350+ Asset") and a corresponding enterprise-level custom solution (the "${upsellPrice}+ custom service") designed for professional service providers wanting to automate client acquisition.

        Details provided by the user:
        - Target Niche: ${nicheName}
        - Target Platform: ${targetPlatform}
        - Base Asset Price Target: ${price}
        - High-Ticket Custom Upsell Price Target: ${upsellPrice}
        ${profileText}
        ${expertiseText}

        Please design a highly professional, operational, deeply valuable blueprint. Target B2B enterprise or boutique service operators with purchasing power.
      `;

      const systemInstruction = `
        You are an expert high-ticket strategist and B2B systems architect. 
        Analyze the user's target niche, expertise, and platform, and return a comprehensive, structured technical and marketing blueprint.
        Do not output lazy or vague placeholders. Create realistic component names, exact automation triggers/actions (e.g. using Make.com/Zapier), precise value propositions, and fully formatted sales collateral.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              packageName: { type: Type.STRING, description: "A highly compelling, literal, premium title for the digital template / productized ecosystem" },
              niche: { type: Type.STRING, description: "Confirm the high-power target niche" },
              platform: { type: Type.STRING, description: "The underlying platform architecture" },
              valueProposition: { type: Type.STRING, description: "A detailed articulation of the painful operational bottlenecks solved and why $350 is an absolute steal" },
              coreEcosystemModules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    moduleName: { type: Type.STRING, description: "The title of this database, client dashboard, or dynamic tracker" },
                    purpose: { type: Type.STRING, description: "What exact pain point this system component completely solves" },
                    keyComponents: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "Specific fields, tables, or sub-views included" 
                    },
                    automationFormula: { type: Type.STRING, description: "The step-by-step webhook, trigger, actions, and filter logic (e.g. Make.com, Zapier, Webflow Logic) to power this component autonomously" }
                  },
                  required: ["moduleName", "purpose", "keyComponents", "automationFormula"]
                },
                description: "The integrated modules inside the core template asset"
              },
              marketingHooks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 highly compelling headline ideas or short-form social hooks with high CTR potential"
              },
              gumroadSalesLetter: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING, description: "B2B headline focused directly on immediate operating efficiency and client generation" },
                  subheadline: { type: Type.STRING, description: "Quantifiable or outcome-driven auxiliary hook" },
                  problemDescribed: { type: Type.STRING, description: "A narrative breakdown of the existing sloppy, manual, and expensive state of client acquisition in this niche" },
                  coreBenefitsList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "High-value bullet parameters of operational transformations" },
                  whatsInside: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bullet list describing exact deliverables, guides, file links received upon purchase" },
                  callToAction: { type: Type.STRING, description: "High-converting action-oriented close" }
                },
                required: ["headline", "subheadline", "problemDescribed", "coreBenefitsList", "whatsInside", "callToAction"]
              },
              highTicketUpsellStrategy: {
                type: Type.OBJECT,
                properties: {
                  upsellPackageName: { type: Type.STRING, description: "The premium name of the customized enterprise / private delivery version" },
                  transitionContext: { type: Type.STRING, description: "Strategic script or bridge statement on how to pitch template buyers into the custom implementation" },
                  customDeliverablesList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific manual setup items (e.g. legacy software cleanup, custom CRM schemas, custom CSS branding, legacy CSV data migrations, API gateway setups)" },
                  integrationsRecommended: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific enterprise tools or APIs integrated in this high-ticket custom setup (e.g., Salesforce, Hubspot, Twilio SMS API, Smartlead, WhatsApp Business)" },
                  privateOnboardingAndTrainingPlan: { type: Type.STRING, description: "Deliverables related to staff onboarding, standard operating procedures, video training libraries, and post-launch Slack support" },
                  marginJustification: { type: Type.STRING, description: "The psychological and financial reason why a client sees $3,500+ as highly profitable" }
                },
                required: ["upsellPackageName", "transitionContext", "customDeliverablesList", "integrationsRecommended", "privateOnboardingAndTrainingPlan", "marginJustification"]
              },
              outreachTemplates: {
                type: Type.OBJECT,
                properties: {
                  linkedinOutreach: { type: Type.STRING, description: "A conversational, value-first, non-spammy LinkedIn touchpoint template linking back to the system blueprint" },
                  emailSequence1: { type: Type.STRING, description: "First cold/warm outreach email layout: Focuses entirely on presenting proof of system efficiency or automated relief" },
                  emailSequence2: { type: Type.STRING, description: "Follow-up value add or video audit breakdown template: Establishes extreme authority" }
                },
                required: ["linkedinOutreach", "emailSequence1", "emailSequence2"]
              }
            },
            required: [
              "packageName",
              "niche",
              "platform",
              "valueProposition",
              "coreEcosystemModules",
              "marketingHooks",
              "gumroadSalesLetter",
              "highTicketUpsellStrategy",
              "outreachTemplates"
            ]
          },
        },
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json(parsedData);
    } catch (err: any) {
      console.error("Error calling Gemini API:", err);
      res.status(500).json({ error: err.message || "Internal server error during blueprint generation." });
    }
  });

  // API endpoint for "AcquisitionOS-AI" Assistant
  app.post("/api/copilot", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const systemInstruction = `
        You are "AcquisitionOS-AI," an elite, context-aware Revenue Operations (RevOps) and Sales Triage Assistant built explicitly for high-growth B2B digital agencies. Your job is to analyze incoming prospect data from the Airtable base and assist sales representatives in executing high-velocity outreach.

        ### YOUR CORE ARCHITECTURE CONTEXT:
        You have access to a 4-table relational database containing:
        1. Prospects/Leads (Company info, Technographics, Lead Priority Score, Pipeline Stage, SLA Status)
        2. Interactions & Touchpoints (Logs of emails, calls, and Slack alerts)
        3. Team/Reps (Active sales reps assigned via round-robin tracking)
        4. Revenue & Attribution Ledger (Stripe data, CPL, and LTV-to-CAC ratios)

        ### PRE-DEFINED LIVE LEADS (Available in memory):
        - ID: lead-1 | Company: Vortex Agency | Lead Name: Marcus Vance (SaaS founder, uses HubSpot, Clay, Mailgun; Lead Priority Score: 95, Pipeline Stage: New Lead, SLA Status: 🚨 CRITICAL BREACH - 6.5h elapsed) => SLA Critical Breach! Assign SDR and bypass standard queues.
        - ID: lead-2 | Company: Acme Analytics | Lead Name: Sarah Carter (HR technology, uses Salesforce, Apollo, Mailchimp; Lead Priority Score: 92, Pipeline Stage: Prospect, SLA Status: SLA Breach - 5h elapsed) => SLA Breach! Close immediately.
        - ID: lead-3 | Company: Pulse Media | Lead Name: Danny Devito (Consumer e-commerce/retail, uses Shopify, FB pixels, Klaviyo, no CRM; Lead Priority Score: 40, Pipeline Stage: Prospect, SLA Status: Safe - 1.2h elapsed) => Low fit, low priority score.
        - ID: lead-4 | Company: Stratex Consults | Lead Name: Amira K. (Enterprise operations, uses Airtable, Make.com, ActiveCampaign; Lead Priority Score: 78, Pipeline Stage: Rep Assigned, SLA Status: Contacted) => Assignee is Sean Miller.

        ### YOUR OPERATIONAL RULES & BEHAVIOR:
        1. Speed-to-Lead Priority: Always check the {SLA Breach Status}. If a lead is marked "🚨 CRITICAL BREACH" (like Marcus Vance @ Vortex Agency), aggressively prioritize helping the user respond to that lead first.
        2. Tone & Style: Professional, highly strategic, direct, and revenue-focused. Do not use generic corporate fluff, flowery introductions, or exclamation marks. Speak like an experienced Silicon Valley sales director. No pleasantries like "Sure, I'd be happy to help you with that!" or "Here's what you need:". Just jump straight to the high-value tactical action item and deliver the clean copy-pasteable assets requested.
        3. Data Guardrails: Never hallucinate firmographic data. If a field (like Headcount or Tech Stack) is empty, politely remind the sales rep to trigger the Make.com enrichment sequence or input it manually.
        4. When the user asks for:
           - "Draft an opener for [Lead Name]": Analyze their {Technographics} and {Company Name}. Draft a hyper-personalized, 3-sentence cold email or LinkedIn message focusing on fixing a problem related to their tech stack. Keep it punchy—no fake compliments.
           - "Triage triage grid": Look at the active unassigned leads, look at their Lead Priority Scores (0-100), and tell the user exactly which leads they need to focus on today and why based on math. Focus on Vortex Agency (95 Score, Critical Breach) and Acme Analytics (92 Score, SLA Breach).
           - "Draft an SLA reminder": If a lead is breaching, format a clean, copy-pasteable Slack message payload using Slack Block Kit markdown that a manager can drop into a team channel to wake up a sales rep.
           - "Troubleshoot webhook": If a user asks why a lead didn't enrich, provide a step-by-step diagnostic checklist to verify if the Make.com router or the Clay/Clearbit API key has expired.
      `;

      // Structure chat contents
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.sender === "ai" ? "model" : "user",
            parts: [{ text: turn.text }]
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
        }
      });

      res.json({ reply: response.text || "No reply generated." });
    } catch (err: any) {
      console.error("Error in Copilot endpoint:", err);
      res.status(500).json({ error: err.message || "Internal server error during Copilot request." });
    }
  });

  // Configure Vite middleware or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start Server on Port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server bootstrap failure:", err);
});
