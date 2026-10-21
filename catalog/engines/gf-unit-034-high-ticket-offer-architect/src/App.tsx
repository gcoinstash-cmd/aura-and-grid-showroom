import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Briefcase, 
  Cpu, 
  Coins, 
  Send, 
  Copy, 
  Check, 
  Loader2, 
  ArrowRight, 
  BookOpen, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Mail, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
  Zap,
  Workflow,
  ClipboardList,
  CheckSquare,
  Shield,
  Clock
} from "lucide-react";
import AdminPortalModal from "./components/AdminPortalModal";
import { PRESET_CONCEPTS } from "./presets";
import { ConceptBlueprint } from "./types";

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(
    window.location.pathname.includes('/admin') || window.location.hash.includes('admin')
  );
  // Navigation / Tabs State
  const [activePresetId, setActivePresetId] = useState<string>("agency-acquisition-os");
  const [activeTab, setActiveTab] = useState<"architecture" | "copywriting" | "upsell" | "outreach" | "airtable" | "integrations" | "deployment">("architecture");
  const [activeScenario, setActiveScenario] = useState<"ingestion" | "sla" | "daily_snapshot" | "roi_trigger">("ingestion");
  const [copiedState, setCopiedState] = useState<string | null>(null);
  
  // Airtable Simulator State
  const [simCompanySize, setSimCompanySize] = useState<string>("11-50");
  const [simTechStack, setSimTechStack] = useState<string>("complete-match");
  const [simResponseHours, setSimResponseHours] = useState<number>(2);

  // Expanded Airtable Relational State
  const [activeDay, setActiveDay] = useState<number>(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [checkedSubtasks, setCheckedSubtasks] = useState<string[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedPricingTier, setSelectedPricingTier] = useState<"base" | "guided" | "bespoke">("base");
  const [simulationPayload, setSimulationPayload] = useState<string>(`{
  "email": "lead@vortex.com",
  "fullName": "Marcus Vance",
  "company": "Vortex Analytics",
  "message": "We need to scale our pipeline. Current response lag is 8 hours.",
  "companySize": "11-50",
  "techStack": "HubSpot, React, Webflow"
}`);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulatingTest, setIsSimulatingTest] = useState<boolean>(false);

  const [sdrReps, setSdrReps] = useState([
    { id: "rep-1", name: "Alex Mercer", status: "Active & Accepting Leads", assignedLeads: 14, closedWon: 5, totalRevenue: 17500 },
    { id: "rep-2", name: "Sarah Jenkins", status: "Active & Accepting Leads", assignedLeads: 12, closedWon: 6, totalRevenue: 21000 },
    { id: "rep-3", name: "Marcus Brody", status: "Active & Accepting Leads", assignedLeads: 18, closedWon: 4, totalRevenue: 14000 },
    { id: "rep-4", name: "Elena Rostova", status: "On Break", assignedLeads: 9, closedWon: 3, totalRevenue: 10500 }
  ]);

  const [simulatedIncomingLead, setSimulatedIncomingLead] = useState({
    company: "Apex Scale Corp",
    size: "51-200",
    tech: "Complete Match",
    value: 3500
  });

  const [routingLogs, setRoutingLogs] = useState<string[]>([
    "System Initialized: Round-robin load algorithm standing by.",
    "Relationships loaded (Many-to-One linked registers online)."
  ]);

  // AcquisitionOS-AI Copa-pilot States
  const [copilotMessage, setCopilotMessage] = useState<string>("");
  const [copilotHistory, setCopilotHistory] = useState<{ id: string; sender: "user" | "ai"; text: string; timestamp: string }[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Initializing AcquisitionOS-AI [v1.4.1]... Done.\nRelational Database Linked: Leads [4 active], Team [4 active], Interactions, Attributions connected.\n\nReady for high-velocity triage commands. You can input custom prompts or run pre-configured workflows to handle sales operations instantly.",
      timestamp: "07:27 AM"
    }
  ]);
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);

  const [activeRelationalDetail, setActiveRelationalDetail] = useState<"interactions" | "reps" | "revenue" | "analytics">("analytics");

  // Lead assignment logic for Round-Robin Simulator
  const handleRouteLead = () => {
    const activeReps = sdrReps.filter(r => r.status === "Active & Accepting Leads");
    if (activeReps.length === 0) {
      setRoutingLogs(prev => [`[ERROR] ${new Date().toLocaleTimeString()} - No active reps are accepting leads.`, ...prev]);
      return;
    }
    
    // Pick active rep with least assigned workload (best load distribution for RevOps)
    const sortedReps = [...activeReps].sort((a, b) => a.assignedLeads - b.assignedLeads);
    const targetRep = sortedReps[0];
    
    // Update rep load and simulate performance upgrade
    const randomConversionValue = Math.random() < 0.25; // 25% chance of instantly won closed business
    const leadValue = simulatedIncomingLead.value;

    setSdrReps(prev => prev.map(rep => {
      if (rep.id === targetRep.id) {
        return {
          ...rep,
          assignedLeads: rep.assignedLeads + 1,
          closedWon: randomConversionValue ? rep.closedWon + 1 : rep.closedWon,
          totalRevenue: randomConversionValue ? rep.totalRevenue + leadValue : rep.totalRevenue
        };
      }
      return rep;
    }));

    const detailsText = `Name: ${simulatedIncomingLead.company} | Priority: Sub-24hr SLA | Tech: ${simulatedIncomingLead.tech}`;
    const conversionAlert = randomConversionValue 
      ? ` 🔥 DEAL CLOSED WON! Real-time revenue rolling up with sum formula for +$${leadValue.toLocaleString()}.`
      : ` Enscheduled onto active outbound sequences.`;

    const newLog = `[SUCCESS] Routed "${simulatedIncomingLead.company}" to ${targetRep.name} (${targetRep.assignedLeads + 1} Current Leads). ${conversionAlert}`;
    setRoutingLogs(prev => [newLog, ...prev]);

    // Randomly update next simulation variables with highly engaging B2B targets
    const companies = ["Vortex Flow Analytics", "Solaria Agency System", "Quantum Dev Studio", "Sovereign Growth LLC", "NeuraSync AI", "BlueHorizon Consultative", "IronPath CRM Inc", "StellarScale LLC"];
    const sizes = ["1-10", "11-50", "51-200", "200+"];
    const techs = ["Complete Match", "Partial Match", "No Match"];
    const selectCompany = companies[Math.floor(Math.random() * companies.length)] + " " + String(Math.floor(Math.random() * 90) + 10);
    const selectSize = sizes[Math.floor(Math.random() * sizes.length)];
    const selectTech = techs[Math.floor(Math.random() * techs.length)];
    setSimulatedIncomingLead({
      company: selectCompany,
      size: selectSize,
      tech: selectTech,
      value: selectSize === "51-200" || selectSize === "200+" ? 3500 : 350
    });
  };

  const handleSendCopilotMessage = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || copilotMessage;
    if (!textToSend.trim()) return;

    // Add user message to history
    const userMsg = {
      id: "msg-" + Date.now(),
      sender: "user" as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setCopilotHistory(prev => [...prev, userMsg]);
    if (!overridePrompt) setCopilotMessage("");
    setIsCopilotLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: copilotHistory.slice(-10) // Limit context window for speed
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setCopilotHistory(prev => [...prev, {
          id: "msg-ai-" + Date.now(),
          sender: "ai" as const,
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
      } else {
        throw new Error(data.error || "Failed to receive copilot stream reply.");
      }
    } catch (err: any) {
      console.error("Copilot Error:", err);
      // Fallback offline handler with tactical, pristine answers when API fails or in local development
      let mockReply = "Operational Gateway Timeout. Responding via Offline RevOps Backup Layer.\n\n";
      
      const lowerInput = textToSend.toLowerCase();
      if (lowerInput.includes("opener") || lowerInput.includes("draft an opener")) {
        const isSarah = lowerInput.includes("sarah") || lowerInput.includes("carter");
        const name = isSarah ? "Sarah Carter" : "Marcus Vance";
        const company = isSarah ? "Acme Analytics" : "Vortex Agency";
        const tech = isSarah ? "Salesforce, Apollo, Active Campaign" : "HubSpot, Clay, Mailgun";
        
        mockReply += `### [OFFLINE DESCRIPTIVE DRAFT FOR ${name.toUpperCase()} @ ${company.toUpperCase()}]\n` +
          `**Subject:** Quick question re: ${tech.split(',')[0]} sync stack for ${company}\n\n` +
          `Hey ${name.split(' ')[0]},\n\n` +
          `I noticed ${company} is currently running ${tech.split(',')[0]} paired with ${tech.split(',')[1] || 'outbound channels'} to manage pipeline growth.\n\n` +
          `Most high-growth agencies struggle with automated record double-touch or webhook dropouts routing to standard custom reps.\n\n` +
          `We engineered an automated Airtable-to-Make webhook ingestion pipeline that reduces response speed down to 4 minutes without duplicating Salesforce leads. Worth a quick look?\n\n` +
          `Best,\n` +
          `RevOps Direct Advisory`;
      } else if (lowerInput.includes("triage") || lowerInput.includes("triage grid")) {
        mockReply += `### [MATH-BASED ACTION TRIAGE ORDER FOR ACTIVE PIPELINE]\n\n` +
          `1. **🔥 LEAD: Marcus Vance (Vortex Agency)** | Score: 95 | Status: 🚨 **CRITICAL BREACH** (6.5 hours elapsed)\n` +
          `   - *Reason:* SaaS Founder, High Target ICP, uses HubSpot + Clay. Inbound Webhook is currently sitting uncontacted past the 4-hour SLA. Assign immediately to Lead Rep Alex Mercer.\n\n` +
          `2. **⚡ LEAD: Sarah Carter (Acme Analytics)** | Score: 92 | Status: **SLA Breach** (5 hours elapsed)\n` +
          `   - *Reason:* HR tech company, Salesforce enterprise user, high employee density. Has CRM overlap, but requires instant personal email routing. Assign to Sarah Jenkins.\n\n` +
          `3. **🟢 LEAD: Amira K. (Stratex Consults)** | Score: 78 | Status: **Safe** (Assigned to Sean)\n` +
          `   - *Reason:* Standard enterprise workflow prospect. Ensure active sequences are running.\n\n` +
          `4. **⚠️ LEAD: Danny Devito (Pulse Media)** | Score: 40 | Status: **Safe** (1.2 hours elapsed)\n` +
          `   - *Reason:* Low CRM fit (E-commerce profile, Shopify). De-prioritize below B2B targets to preserve rep bandwidth.`;
      } else if (lowerInput.includes("sla reminder") || lowerInput.includes("reminder") || lowerInput.includes("slack")) {
        mockReply += `### [SLACK BLOCK KIT ACTIONABLE PAYLOAD - COPY-PASTE TO CHANNEL]\n\n` +
          `\`\`\`json\n` +
          `{\n` +
          `  "blocks": [\n` +
          `    {\n` +
          `      "type": "header",\n` +
          `      "text": {\n` +
          `        "type": "plain_text",\n` +
          `        "text": "🚨 SLA CRITICAL BREACH ALERT"\n` +
          `      }\n` +
          `    },\n` +
          `    {\n` +
          `      "type": "section",\n` +
          `      "text": {\n` +
          `        "type": "mrkdwn",\n` +
          `        "text": "*Lead Name:* Marcus Vance (SaaS founder, Vortex Agency)\\n*Pipeline Priority:* 🔥 *95/100 Score*\\n*SLA Status:* 🚨 *6.5 Hours Unassigned (Limit: 4h)*"\n` +
          `      }\n` +
          `    },\n` +
          `    {\n` +
          `      "type": "actions",\n` +
          `      "elements": [\n` +
          `        {\n` +
          `          "type": "button",\n` +
          `          "style": "danger",\n` +
          `          "text": {\n` +
          `            "type": "plain_text",\n` +
          `            "text": "⚡ CLAIM LEAD NOW"\n` +
          `          },\n` +
          `          "url": "https://airtable.com"\n` +
          `        }\n` +
          `      ]\n` +
          `    }\n` +
          `  ]\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `Drop this Block Kit payload in team channels to trigger immediate Slack notifications for representatives.`;
      } else if (lowerInput.includes("troubleshoot") || lowerInput.includes("webhook") || lowerInput.includes("enrich")) {
        mockReply += `### [REVOPS WEBHOOK DIAGNOSTIC CHECKLIST]\n\n` +
          `If inbound payloads fail or records are created without Clay / Clearbit technographics parameters, run these checks:\n\n` +
          `1. **🔑 API Key Status Check:**\n` +
          `   - Log in to Clay.com/Clearbit. Confirm your API billing is active and token hasn't expired / rolled.\n` +
          `2. **📶 Make.com Router Payload Log Check:**\n` +
          `   - Open active Make.com scenario list. Open the execution history logs.\n` +
          `   - Verify if HTTP Response status is 200 or 403 (Invalid Auth Credentials) / 429 (Rate Limit Breached).\n` +
          `3. **🚦 Airtable Webhook Matching:**\n` +
          `   - Check if incoming fields match your Airtable single-select exactly (e.g. "1-10" with quotes instead of space "1 - 10"). Spacing typos in Airtable options cause automatic write dropouts.`;
      } else {
        mockReply += "I am online and evaluating database status. To run quick tactical RevOps scripts, execute one of the pre-configured triage commands below.";
      }

      setCopilotHistory(prev => [...prev, {
        id: "msg-ai-offline-" + Date.now(),
        sender: "ai" as const,
        text: mockReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(id);
    setTimeout(() => {
      setCopiedState(null);
    }, 2000);
  };

  const runSimulationTest = () => {
    setIsSimulatingTest(true);
    setSimulationLogs(["[07:14:25] 🕒 Initializing end-to-end automation test payload validation..."]);
    
    let parsedPayload: any = {};
    try {
      parsedPayload = JSON.parse(simulationPayload);
    } catch (e) {
      setTimeout(() => {
        setSimulationLogs(prev => [
          ...prev, 
          "⚠️ [ERROR] Invalid JSON payload configuration! Parse failed. Please check for trailing commas, proper quotes, and matching brackets."
        ]);
        setIsSimulatingTest(false);
      }, 700);
      return;
    }

    const { email, fullName, company, message, companySize, techStack } = parsedPayload;
    
    const logs = [
      `[00:01] 📥 Webhook listener caught raw HTTP POST request from form submission.`,
      `[00:03] ⚙️ Parsing payload params - Lead Name: "${fullName || 'N/A'}", Email: "${email || 'N/A'}", Company: "${company || 'N/A'}"`,
      `[00:06] 🔍 Running API Enrichment Lookup: Domain parsed as "${email ? email.split('@')[1] : 'vortex.com'}"...`,
      `[00:09] 👤 Enrichment metadata returned matching target criteria: Company Size: "${companySize || '11-50'}", CMS Stack: "${techStack || 'CMS Match'}"`,
      `[00:12] 💾 Inserting verified lead row into Airtable 'Leads' schema. Assigning primary ID [rec${Math.random().toString(36).substring(2, 8).toUpperCase()}].`,
      `[00:15] 🤖 Running workload algorithm: Assigning to available SDR rep: "Alex Mercer" (Active - Accepting Leads)`,
      `[00:17] 📢 Constructing Slack rich text payload block with dynamic 4-hour SLA countdown link.`,
      `[00:19] 📱 Dispatching incoming webhook connection payload to Slack channel #sales-sla-alerts. Status check: 200 OK.`,
      `[00:20] 🎉 Test run completed successfully! Ready-to-Deploy Assets have verified full workflow alignment.`
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setSimulationLogs(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setIsSimulatingTest(false);
        }
      }, (index + 1) * 350);
    });
  };
  
  // Custom Generation State
  const [nicheName, setNicheName] = useState<string>("");
  const [targetPlatform, setTargetPlatform] = useState<string>("");
  const [ownerProfile, setOwnerProfile] = useState<string>("");
  const [coreExpertise, setCoreExpertise] = useState<string>("");
  const [pricePoint, setPricePoint] = useState<string>("$350");
  const [upsellPricePoint, setUpsellPricePoint] = useState<string>("$3,500");
  
  // Interactive ROI Calculator State for Tab 2
  const [roiRetainerValue, setRoiRetainerValue] = useState<number>(3500);
  const [roiLostLeads, setRoiLostLeads] = useState<number>(2);
  const [roiFounderRate, setRoiFounderRate] = useState<number>(200);
  const [roiAdminHours, setRoiAdminHours] = useState<number>(6);
  const [upsellScriptStep, setUpsellScriptStep] = useState<number>(0);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedBlueprint, setGeneratedBlueprint] = useState<ConceptBlueprint | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Copy Status UI Helpers
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  
  // Choose which blueprint to display
  const currentBlueprint: ConceptBlueprint = generatedBlueprint 
    ? generatedBlueprint 
    : PRESET_CONCEPTS.find(p => p.id === activePresetId)!;

  // Sync state helpers when selecting presets
  const handleSelectPreset = (id: string) => {
    setGeneratedBlueprint(null);
    setActivePresetId(id);
    setErrorMsg(null);
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  // Submit custom blueprint generation to Express server
  const handleForgeBlueprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicheName.trim() || !targetPlatform.trim()) {
      setErrorMsg("Please provide both a Target Niche and a Target Platform.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedBlueprint(null);

    try {
      const response = await fetch("/api/generate-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerProfile: ownerProfile.trim(),
          nicheName: nicheName.trim(),
          coreExpertise: coreExpertise.trim(),
          targetPlatform: targetPlatform.trim(),
          pricePoint: pricePoint.trim(),
          upsellPricePoint: upsellPricePoint.trim()
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to generate your premium asset blueprint.");
      }

      const data = await response.json();
      setGeneratedBlueprint(data);
      setActiveTab("architecture"); // Reset tab to architecture
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Please verify your internet connection and API credentials.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      {/* Upper Premium Announcement bar */}
      <div className="bg-slate-900 text-slate-100 py-3 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold px-2 py-0.5 rounded text-xs font-semibold tracking-wider tracking-wide font-mono uppercase">Blueprint System</span>
            <span>Client Acquisition Offer Architecture Studio v1.2</span>
          </div>
          <div className="text-slate-400 font-mono text-xs font-semibold">
            System Time Flag: <span className="text-indigo-400">2026-05-29 UTC</span>
          </div>
        </div>
      </div>

      {/* Main Luxury Header */}
      <header className="border-b border-slate-200/80 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> B2B High-Ticket Ecosystem Crafting
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none sm:text-5xl">
              OfferArchitect Studio
            </h1>
            <p className="mt-3 text-lg text-slate-300/90 leading-relaxed font-light">
              Design premium, highly automated micro-assets and system templates you can sell as a standalone productized system for <span className="text-slate-900 font-medium">$350+</span> &mdash; then leverage them into high-ticket custom implementation retainers for <span className="text-slate-900 font-medium">$3,500+</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-mono font-medium text-slate-600 px-3 py-1.5 rounded-lg bg-white shadow-xs">
              Productized Asset: $350+
            </span>
            <span className="text-xs font-mono font-medium text-indigo-600 px-3 py-1.5 rounded-lg bg-white shadow-xs">
              Enterprise Retainer: $3,500+
            </span>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-xs font-mono font-semibold text-amber-700 hover:text-amber-800 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shield size={12} />
              <span>[ ARCHITECT PASS ]</span>
            </button>
          </div>
        </div>
      </header>

      <AdminPortalModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Primary Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: interactive Sidebar Form & Presets Explorer */}
        <section className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Section A: Handcrafted Premium Blueprints Selector */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none" />
            
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Core Curation Hub (Presets)
            </h2>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Select one of our highly profitable, pre-designed templates tailored for professional service providers wanting to automate client flow.
            </p>

            <div className="flex flex-col gap-3">
              {PRESET_CONCEPTS.map((p) => {
                const isSelected = activePresetId === p.id && !generatedBlueprint;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected 
                        ? "bg-slate-900 border-slate-950 shadow-md text-white" 
                        : "bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-semibold tracking-wider font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSelected ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/20" : "bg-slate-200/80 text-slate-600"
                      }`}>
                        {p.platform.split(" ")[0]} Project
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold font-mono">
                        <TrendingUp className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-emerald-500"}`} />
                        <span className={isSelected ? "text-slate-200" : "text-slate-300"}>10x Retainer</span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-sm mt-2 tracking-tight">
                      {p.packageName}
                    </h3>
                    <p className={`text-xs mt-1 font-light line-clamp-2 ${isSelected ? "text-slate-300" : "text-slate-300"}`}>
                      {p.tagline}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-dashed justify-between text-xs font-semibold font-mono">
                      <span className={isSelected ? "text-slate-400" : "text-slate-300"}>Target: </span>
                      <span className={`font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>{p.niche.split(" ")[0]} Niche</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: AI Blueprint Generator Forge */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Offer Architect Forge
              </h2>
              {generatedBlueprint && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wider font-mono font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Custom Generated Active
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Need a blueprint for a specific target niche? Input your profile, target platform, and budget pricing below to generate a comprehensive template concept and enterprise proposal strategy.
            </p>

            <form onSubmit={handleForgeBlueprintSubmit} className="flex flex-col gap-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price targets fields */}
                <div>
                  <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300 mb-1">
                    Store Price Target ($350+)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={pricePoint}
                      onChange={(e) => setPricePoint(e.target.value)}
                      placeholder="$350"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300 mb-1">
                    Upsell Target ($3,500+)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={upsellPricePoint}
                      onChange={(e) => setUpsellPricePoint(e.target.value)}
                      placeholder="$3,500"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300 mb-1">
                  Target Niche <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nicheName}
                  onChange={(e) => setNicheName(e.target.value)}
                  placeholder="e.g., Boutique Real Estate, VC Funds, SaaS CTOs"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300 mb-1">
                  Underlying Ecosystem Platform <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  placeholder="e.g., Airtable, Notion, Framer + Webflow"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300 mb-1">
                  Your Profile / Background (Optional)
                </label>
                <textarea
                  value={ownerProfile}
                  onChange={(e) => setOwnerProfile(e.target.value)}
                  placeholder="e.g., Growth marketer, product designer, workflows architect"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300 mb-1">
                  Core Expertise (Optional)
                </label>
                <input
                  type="text"
                  value={coreExpertise}
                  onChange={(e) => setCoreExpertise(e.target.value)}
                  placeholder="e.g., low-code automation, CRM integrations, sales funnel audit"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Generation Error:</span> {errorMsg}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer text-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Architecting Strategy Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Forge Premium Blueprint</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: Primary Workspace / Output Display Card */}
        <section className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-full flex flex-col min-h-[600px]">
            
            {/* Workbench Header & Active Blueprint Indicator */}
            <div className="border-b border-slate-200/80 bg-slate-50/60 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Active Environment: Workspace
                  </span>
                  {generatedBlueprint && (
                    <span className="text-xs font-semibold tracking-wider uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Forge-Generated
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-2">
                  {currentBlueprint.packageName}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Integrated client automated platform for: <span className="text-slate-700 font-medium">{currentBlueprint.niche}</span>
                </p>
              </div>
              
              <div className="text-right flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {pricePoint || "$350"}
                </span>
                <span className="text-xs font-semibold tracking-wider font-mono text-slate-400 font-medium uppercase tracking-wide">
                  Assets Leverage Blueprint
                </span>
              </div>
            </div>

            {/* Visual Workspace Sub-Navigation tabs */}
            <div className="border-b border-slate-100 bg-white px-6 py-1 flex overflow-x-auto gap-4 no-scrollbar">
              <button
                onClick={() => setActiveTab("architecture")}
                className={`py-3 text-xs font-mono font-bold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-2 ${
                  activeTab === "architecture" 
                    ? "border-slate-900 text-slate-950" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> 1. System Core Map
              </button>
              
              <button
                onClick={() => setActiveTab("copywriting")}
                className={`py-3 text-xs font-mono font-bold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-2 ${
                  activeTab === "copywriting" 
                    ? "border-slate-900 text-slate-950" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> 2. Sales Page & Hooks
              </button>

              <button
                onClick={() => setActiveTab("upsell")}
                className={`py-3 text-xs font-mono font-bold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-2 ${
                  activeTab === "upsell" 
                    ? "border-slate-900 text-slate-950" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Coins className="w-3.5 h-3.5" /> 3. High-Ticket Upsell
              </button>

              <button
                onClick={() => setActiveTab("outreach")}
                className={`py-3 text-xs font-mono font-bold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-2 ${
                  activeTab === "outreach" 
                    ? "border-slate-900 text-slate-950" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> 4. Outbound Sequences
              </button>

              <button
                onClick={() => setActiveTab("airtable")}
                className={`py-3 text-xs font-mono font-bold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-2 ${
                  activeTab === "airtable" 
                    ? "border-slate-900 text-slate-950" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" /> 5. Airtable Schema
              </button>

              <button
                onClick={() => setActiveTab("integrations")}
                className={`py-3 text-xs font-mono font-bold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-2 ${
                  activeTab === "integrations" 
                    ? "border-slate-900 text-slate-950" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" /> 6. Automation Blueprints
              </button>

              <button
                onClick={() => setActiveTab("deployment")}
                className={`py-3 text-xs font-mono font-bold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-2 ${
                  activeTab === "deployment" 
                    ? "border-slate-900 text-slate-950" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-teal-600" /> 7. Deployable Assets
              </button>
            </div>

            {/* Interactive Workspace Panel */}
            <div className="p-6 flex-1 bg-slate-50/20">
              
              {/* TAB 1: System Core Map */}
              {activeTab === "architecture" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Strategic Value Prop Callout */}
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-950 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold tracking-wider font-mono font-bold uppercase tracking-widest text-indigo-300">Operational Pain Point Solved</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">
                      {currentBlueprint.valueProposition}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-semibold font-mono text-slate-400">
                      <span>Platform Tech Stack:</span>
                      <span className="text-white font-medium">{currentBlueprint.platform}</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Core Ecosystem System Modules ({currentBlueprint.coreEcosystemModules.length})
                  </h3>

                  {/* Modules Architecture Grid */}
                  <div className="space-y-4">
                    {currentBlueprint.coreEcosystemModules.map((module, mIdx) => (
                      <div key={mIdx} className="bg-white border border-slate-200/80 rounded-xl p-5 hover:border-slate-300 hover:shadow-xs transition-all duration-150">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold flex items-center justify-center font-bold">
                            {mIdx + 1}
                          </span>
                          <h4 className="font-semibold text-sm tracking-tight text-slate-900">
                            {module.moduleName}
                          </h4>
                        </div>
                        
                        <p className="text-xs text-slate-300 leading-relaxed pl-7">
                          {module.purpose}
                        </p>

                        <div className="mt-4 pl-7">
                          <h5 className="text-xs font-semibold tracking-wider font-mono font-semibold uppercase text-slate-400 mb-2">
                            Structural Database Tables / Interfaces
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {module.keyComponents.map((component, cIdx) => (
                              <span key={cIdx} className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-medium">
                                {component}
                              </span>
                            ))}
                          </div>
                        </div>

                        {module.automationFormula && (
                          <div className="mt-4 pl-7 pt-4 border-t border-slate-100">
                            <h5 className="text-xs font-semibold tracking-wider font-mono font-semibold uppercase text-indigo-500 mb-1.5 flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" /> Make / Zapier Integration Formula
                            </h5>
                            <p className="text-xs text-indigo-950 bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-3 leading-relaxed font-mono font-light">
                              {module.automationFormula}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Strategic Copy & Hooks */}
              {activeTab === "copywriting" && (
                <div className="space-y-8 animate-fade-in text-left">
                  
                  {/* Strategic Copywriting Framework Intro */}
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-950 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0 border border-indigo-500/20">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold tracking-wider font-mono tracking-widest font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 uppercase px-2.5 py-1 rounded">
                          Copywriting Framework & Asset Pitch Deck
                        </span>
                        <h3 className="text-xl font-bold text-white mt-2.5">
                          ✍️ The B2B Conversion Copywriting Matrix
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1.5 font-light">
                          High-volume boutique agencies (generating $50k-$250k/mo) represent the most lucrative target audience for micro-assets. They don't just buy "templates" – they buy <strong>solutions to bleeding leaks</strong>. Use the structured copy matrices below to load your Gumroad storefront, power high-ticket outbound cold loops, and pitch customized implementation contracts.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Core Hook / Headline Matrix */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                        Module 01: Core Headline Matrix
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">
                        🎯 The Speed-to-Lead & Lost Pipeline Headline System
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1">
                        High-converting headline splits designed directly to snap boutique agency founders out of complacency.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {[
                        {
                          category: "The Cold Hard Operational Truth",
                          headline: `Stop Letting ${upsellPricePoint || "$3,500"}+ Retainers Rot in Webhook Logs: Lock Down Warm Leads in Under 95 Seconds.`,
                          subheadline: "High-growth agencies leak up to 35% of inbound pipeline by waiting over 4 hours. Systemize cold lists, pull deep firmographics, and auto-assign qualified SDR reps on auto-pilot.",
                          badge: "bg-slate-100 text-slate-800 border-slate-200"
                        },
                        {
                          category: "The Scale & Profit Margin Play",
                          headline: `Ditch the Over-Paid RevOps Hire. Deploy an Automated CRM Ingestion Engine That Qualifies & Slack-Alerts SDRs on Pure Autopilot.`,
                          subheadline: "Why pay a full-time coordinator $5,000/mo to copy-paste spreadsheet fields? This Airtable-Make CRM matches buyer budgets, parses server stacks, and drafts personalized openers automatically.",
                          badge: "bg-indigo-50 text-indigo-700 border-indigo-100"
                        },
                        {
                          category: "The High-Velocity Trigger Challenge",
                          headline: `The 4-Hour Decay: Why Boutique Agencies Sinking Past $150k/Mo Lose 80% of Inbound Closing Opportunity (And the Blueprint Solution).`,
                          subheadline: "When a potential buyer requests a consultation, every minute of lag burns capital. Unify Apollo, Clay, and Webforms into an absolute client-acquisition fortress today.",
                          badge: "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }
                      ].map((item, idx) => {
                        const copyString = `HEADLINE: ${item.headline}\nSUBHEADLINE: ${item.subheadline}`;
                        return (
                          <div key={idx} className="border border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-white rounded-xl p-5 transition-all text-left relative group">
                            
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border font-semibold ${item.badge}`}>
                                {item.category}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(copyString, `headline-${idx}`)}
                                className="text-xs font-semibold tracking-wider bg-white border border-slate-200 hover:bg-slate-50 text-slate-300 hover:text-slate-900 px-2.5 py-1 rounded flex items-center gap-1 font-mono hover:shadow-xs transition"
                              >
                                {copiedState === `headline-${idx}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale-in" />
                                    <span className="text-emerald-600 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Template</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <h5 className="font-bold text-slate-900 text-sm md:text-base leading-tight pr-12">
                              "{item.headline}"
                            </h5>
                            <p className="text-xs text-slate-600 font-light mt-2 leading-relaxed border-l-2 border-indigo-500 pl-3 italic">
                              {item.subheadline}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Pain-Point Visualizer */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        Module 02: Pain-Point Visualizer
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">
                        ⚖️ The Comparison Matrix: Manual Overlap vs. Automated Client Flow
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1">
                        High-impact comparison copy that contrasts structural organizational decay against systemized execution precision.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      
                      {/* Column A: Messy Manual */}
                      <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                            <span className="font-mono font-bold text-xs text-rose-800 uppercase tracking-wider">
                              The Loose Spreadsheet Way (Profit Leak)
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="bg-white/80 p-3.5 rounded-lg border border-rose-100 text-xs text-slate-700 space-y-1.5">
                              <h5 className="font-bold text-rose-950 flex items-center gap-1.5 leading-none">
                                ❌ Manual Inbound Copy-Pasting
                              </h5>
                              <p className="font-light text-slate-655 leading-relaxed">
                                Form submits and cold prospect details are manually extracted, copy-pasted into disjointed sheets. Zero automatic technographics classifier checks.
                              </p>
                            </div>
                            <div className="bg-white/80 p-3.5 rounded-lg border border-rose-100 text-xs text-slate-700 space-y-1.5">
                              <h5 className="font-bold text-rose-950 flex items-center gap-1.5 leading-none">
                                ❌ Invisible SLAs & Lost Leads
                              </h5>
                              <p className="font-light text-slate-655 leading-relaxed">
                                SDRs follow up "when they have time." Leads stay unchecked over weekends or nights. Average first-touch lag averages a cold 18 hours.
                              </p>
                            </div>
                            <div className="bg-white/80 p-3.5 rounded-lg border border-rose-100 text-xs text-slate-700 space-y-1.5">
                              <h5 className="font-bold text-rose-950 flex items-center gap-1.5 leading-none">
                                ❌ Disconnected Revenue Attribution
                              </h5>
                              <p className="font-light text-slate-655 leading-relaxed">
                                Closed-won client contracts are never traced back to specific acquisition channels. Ad spend is run blindly, bleeding founder cash.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-rose-150/50 text-xs font-semibold text-slate-300 italic font-mono text-center">
                          Total Leak: Up to 35% of Pipeline Lost.
                        </div>
                      </div>

                      {/* Column B: Automated Ecosystem */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                              <Zap className="w-4 h-4 text-emerald-600" />
                            </span>
                            <span className="font-mono font-bold text-xs text-emerald-800 uppercase tracking-wider">
                              The Automated Ecosystem OS Path ({pricePoint || "$350"})
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="bg-white/80 p-3.5 rounded-lg border border-emerald-100 text-xs text-slate-700 space-y-1.5">
                              <h5 className="font-bold text-emerald-950 flex items-center gap-1.5 leading-none">
                                ⚡ Real-Time API Data Ingestion
                              </h5>
                              <p className="font-light text-slate-655 leading-relaxed">
                                Form submissions instantly fire Clearbit & BuiltWith API queries. Inserts corporate headcount, budgets, and CMS stacks into Airtable in 95 seconds.
                              </p>
                            </div>
                            <div className="bg-white/80 p-3.5 rounded-lg border border-emerald-100 text-xs text-slate-700 space-y-1.5">
                              <h5 className="font-bold text-emerald-950 flex items-center gap-1.5 leading-none">
                                ⚡ Slack Alerter & Pre-baked Outreach
                              </h5>
                              <p className="font-light text-slate-655 leading-relaxed">
                                A 4-hour countdown trigger triggers automated rep alerts on Slack with direct record hotlinks and personalized email drafts pre-compiled.
                              </p>
                            </div>
                            <div className="bg-white/80 p-3.5 rounded-lg border border-emerald-100 text-xs text-slate-700 space-y-1.5">
                              <h5 className="font-bold text-emerald-950 flex items-center gap-1.5 leading-none">
                                ⚡ Stripe Checkout Webhook Attribution
                              </h5>
                              <p className="font-light text-slate-655 leading-relaxed">
                                Stripe transactions sync instantly to customer entries, providing real-time ROAS, CPL, commission tracking, and dynamic budget metrics.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-emerald-150/50 text-xs font-semibold text-emerald-800 font-bold font-mono text-center">
                          Total Result: 100% Accountability & Maximized LTV.
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 3. Feature-to-Benefit Breakdown */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                        Module 03: Feature-to-Benefit Translation
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">
                        💳 Transforming Technical Modules Into Immediate Buyer Value
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1">
                        How to articulate the individual tables and webhooks of your {pricePoint || "$350"} asset as absolute cash generators.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          num: "01",
                          tech: "Ingestion & Enrichment Hub",
                          title: "Automated Budget & Tech Qualifier",
                          benefit: "Stops SDRs and high-value founders from chasing unqualified, low-budget local accounts.",
                          desc: "By instantly querying tech stack budgets and corporate sizing in the background, this module weeds out dry deals before a rep ever books a call.",
                          color: "from-indigo-500/10 to-indigo-500/0 border-indigo-200"
                        },
                        {
                          num: "02",
                          tech: "Outbound Followup Cadence Trigger",
                          title: "SDR Response Enforcer Core",
                          benefit: "Forces rapid closing momentum when lead buying intent is at its highest.",
                          desc: "Tracks the exact elapsed minutes a qualified lead has sat in 'Prospect' status. Direct Slack user pings leave sales reps zero room to hide of uncontacted logs.",
                          color: "from-rose-500/10 to-rose-500/0 border-rose-200"
                        },
                        {
                          num: "03",
                          tech: "Stripe-Linked Attribution Ledger",
                          title: "CAC Scoreboard & ROI Radar",
                          benefit: "Prevents cash leaks by proving which campaign hooks are actually closing.",
                          desc: "Connects real Stripe Won transaction records back to lead acquisition origins. Instantly shows you which outreach angles yield high-profit clients.",
                          color: "from-emerald-500/10 to-emerald-500/0 border-emerald-200"
                        }
                      ].map((mod, idx) => (
                        <div key={idx} className={`bg-gradient-to-b ${mod.color} border rounded-xl p-5 text-left flex flex-col justify-between`}>
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="font-mono text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                                SCHEMA SECTION {mod.num}
                              </span>
                              <span className="text-lg font-black text-slate-300 font-mono">
                                {mod.num}
                              </span>
                            </div>
                            <span className="text-xs font-semibold tracking-wider text-slate-300 font-mono block mt-2.5 leading-none">
                              ⚙️ Technical: {mod.tech}
                            </span>
                            <h5 className="font-bold text-slate-900 text-sm mt-1">
                              💎 Benefit: {mod.title}
                            </h5>
                            <p className="text-xs text-slate-700 font-semibold mt-3 italic leading-relaxed">
                              "{mod.benefit}"
                            </p>
                            <p className="text-xs font-semibold text-slate-550 mt-1.5 leading-relaxed font-light">
                              {mod.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. The 3-Tier Pricing Anchor Stack Matrix */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        Module 04: Pricing Anchor Stack Matrix
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2 font-sans">
                        📊 The 3-Tier Strategic Pricing Anchor Stack
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1 font-sans">
                        A high-converting comparison architecture that positions the <strong className="text-indigo-600">$350 Base Asset</strong> as an absolute bargain, while priming buyers for group acceleration ($950) or custom high-ticket operations delivery ($3,500+).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      
                      {/* Tier 1: The Base Asset ($350) */}
                      <div 
                        onClick={() => setSelectedPricingTier("base")}
                        className={`group border rounded-2xl p-6 transition-all duration-200 text-left flex flex-col justify-between relative cursor-pointer ${
                          selectedPricingTier === "base" 
                            ? "bg-slate-50 border-slate-900 shadow-md ring-1 ring-slate-950" 
                            : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="space-y-4 font-sans">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold tracking-wider font-mono tracking-widest font-bold text-slate-400 uppercase">TIER 1 &bull; SELF-GUIDED</span>
                            {selectedPricingTier === "base" && <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" />}
                          </div>
                          <div>
                            <h5 className="text-lg font-extrabold text-slate-900 leading-tight">The Base Asset</h5>
                            <p className="text-xs text-slate-300 font-light mt-1">Instant operational blueprints & duplication links.</p>
                          </div>
                          <div className="py-2">
                            <span className="text-3xl font-black text-slate-900">$350</span>
                            <span className="text-xs text-slate-400 font-mono"> one-time</span>
                          </div>
                          <ul className="text-xs text-slate-650 space-y-2.5 pt-4 border-t border-slate-100 font-light">
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-slate-900 shrink-0 mt-0.5" />
                              <span>Complete Airtable DB schema duplication link</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-slate-900 shrink-0 mt-0.5" />
                              <span>Interactive SLA countdown & scoring formulas</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-slate-900 shrink-0 mt-0.5" />
                              <span>Self-guided deployment handbook & SOP scripts</span>
                            </li>
                          </ul>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <span className={`w-full block text-center py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                            selectedPricingTier === "base" 
                              ? "bg-slate-900 text-slate-50 shadow-xs" 
                              : "bg-slate-100 text-slate-700 group-hover:bg-slate-205"
                          }`}>
                            {selectedPricingTier === "base" ? "Viewing Base Anchor" : "Select Base Offer"}
                          </span>
                        </div>
                      </div>

                      {/* Tier 2: The Guided Accelerator ($950) */}
                      <div 
                        onClick={() => setSelectedPricingTier("guided")}
                        className={`group border rounded-2xl p-6 transition-all duration-200 text-left flex flex-col justify-between relative cursor-pointer ${
                          selectedPricingTier === "guided" 
                            ? "bg-indigo-50/50 border-indigo-500 shadow-md ring-1 ring-indigo-500" 
                            : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                          Highly Popular
                        </div>
                        <div className="space-y-4 font-sans">
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-xs font-semibold tracking-wider font-mono tracking-widest font-bold text-indigo-650 uppercase">TIER 2 &bull; ACCELERATOR</span>
                            {selectedPricingTier === "guided" && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />}
                          </div>
                          <div>
                            <h5 className="text-lg font-extrabold text-slate-900 leading-tight">Guided Accelerator</h5>
                            <p className="text-xs text-slate-300 font-light mt-1">Base templates + live workshop QA + pre-built JSON.</p>
                          </div>
                          <div className="py-2">
                            <span className="text-3xl font-black text-indigo-900">$950</span>
                            <span className="text-xs text-slate-400 font-mono"> one-time</span>
                          </div>
                          <ul className="text-xs text-slate-700 space-y-2.5 pt-4 border-t border-slate-100 font-light">
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span className="font-semibold text-slate-900">All Base Asset features included</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span>Complete Make.com .json scenario packet imports</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span>Private onboarding live workshop with active review</span>
                            </li>
                          </ul>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <span className={`w-full block text-center py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                            selectedPricingTier === "guided" 
                              ? "bg-indigo-600 text-white shadow-xs" 
                              : "bg-indigo-50/50 text-indigo-700 group-hover:bg-indigo-100"
                          }`}>
                            {selectedPricingTier === "guided" ? "Viewing Accelerator" : "Select Accelerator"}
                          </span>
                        </div>
                      </div>

                      {/* Tier 3: Bespoke Revenue Operations Retainer ($3,500+) */}
                      <div 
                        onClick={() => setSelectedPricingTier("bespoke")}
                        className={`group border rounded-2xl p-6 transition-all duration-200 text-left flex flex-col justify-between relative cursor-pointer ${
                          selectedPricingTier === "bespoke" 
                            ? "bg-emerald-50/50 border-emerald-600 shadow-md ring-1 ring-emerald-600" 
                            : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="space-y-4 font-sans">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold tracking-wider font-mono tracking-widest font-bold text-emerald-600 uppercase">TIER 3 &bull; CUSTOM COFOUNDER</span>
                            {selectedPricingTier === "bespoke" && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />}
                          </div>
                          <div>
                            <h5 className="text-lg font-extrabold text-slate-900 leading-tight">Bespoke Retainer</h5>
                            <p className="text-xs text-slate-300 font-light mt-1">Full-service 1-on-1 operational execution.</p>
                          </div>
                          <div className="py-2">
                            <span className="text-3xl font-black text-slate-900">$3,500+</span>
                            <span className="text-xs text-slate-400 font-mono"> / mo recurring</span>
                          </div>
                          <ul className="text-xs text-slate-700 space-y-2.5 pt-4 border-t border-slate-100 font-light">
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-semibold text-slate-900">Custom 1-on-1 legacy database migration</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>Custom webhook integrations & custom Slack setups</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>Dedicated team onboarding training & operational SLA oversight</span>
                            </li>
                          </ul>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <span className={`w-full block text-center py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                            selectedPricingTier === "bespoke" 
                              ? "bg-emerald-600 text-white shadow-xs" 
                              : "bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100"
                          }`}>
                            {selectedPricingTier === "bespoke" ? "Viewing Bespoke Setup" : "Select Bespoke Setup"}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Highly Tactical Pitch Cues */}
                    <div className="p-4.5 bg-slate-50 rounded-xl border border-slate-200/65 font-sans relative overflow-hidden">
                      <div className="flex gap-3 text-xs leading-relaxed relative z-10">
                        <div className="p-2 bg-indigo-500/10 text-indigo-650 rounded-lg shrink-0 border border-indigo-200/50 self-start">
                          <Coins className="w-4 h-4 text-indigo-600 animate-pulse" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-black text-indigo-600 uppercase tracking-wider block mb-1">
                            Sales Pitch Strategy & Anchor Cue
                          </span>
                          <p className="text-slate-600 font-light">
                            {selectedPricingTier === "base" && (
                              <span><strong>Framing Strategy:</strong> Position the $350 base template as 90% of the value of a $3,500 custom advisory contract. When pitching, focus on how manual data entry errors and response delay leaks cost them far more than a single $350 template in lost opportunity alone. Setup is self-serve, letting them take control with zero recurring costs.</span>
                            )}
                            {selectedPricingTier === "guided" && (
                              <span><strong>Framing Strategy:</strong> Pitch the $950 Guided Accelerator to agencies eager to run. They bypass visual coding complexity with direct, copy-and-paste Make.com .json scenario blueprints. A single 1-hour workshop clarifies legacy pipeline workflows, saving weeks of trial-and-error.</span>
                            )}
                            {selectedPricingTier === "bespoke" && (
                              <span><strong>Framing Strategy:</strong> Present the $3,500/mo retainer exclusively to mature teams (generating $100k+/mo) struggling with operational chaos. Framing the retainer as cheaper than half the cost of a junior hire ensures high-value B2B founders happily delegate their entire system setup.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. The "Pre-Emptive Strike" FAQ Objection Block */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                        Module 05: Pre-Emptive strike FAQ Matrix
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2 font-sans">
                        🗯️ The "Pre-Emptive Strike" Objection Framework
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1 font-sans">
                        Dismantle buyer resistance before it is ever spoken. Address high-velocity tactical concerns with sharp, authoritative explanations.
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        {
                          q: "What if we already use an established CRM like HubSpot or Salesforce?",
                          a: "Position this as the high-velocity ingestion front-end that cleans and filters data before it messes up your core CRM database. Instead of polluting Salesforce or HubSpot with messy, duplicate, or unverified inbound webhook payloads, this platform intercepts, enriches, and scores prospects. Only validated high-value opportunities map to your CRM, preserving data purity and optimizing custom user seat licenses.",
                          icon: Layers,
                          color: "indigo",
                          bullets: ["Protects your core CRM from low-value webhook junk", "Real-time Apollo + Clay enrichment filtering *before* CRM sync", "Minimizes unnecessary, bloated CRM seat overhead expenditures"]
                        },
                        {
                          q: "What if our sales team is incredibly small or it's just the founder?",
                          a: "This is exactly who it is designed for. It is the virtual equivalent of a full-time, round-the-clock Revenue Operations hire. By automating structural lookup, triage relevance, and compilation of raw personalized outbound email drafts instantly, a single founder can handle the custom output of three active outbound pipelines in under 10 minutes a day.",
                          icon: Users,
                          color: "rose",
                          bullets: ["Saves 15+ manual administrative research hours per week", "Requires zero technical hire or operations salary overhead", "Pre-formatted drafts crafted instantly on alert trigger to accelerate response"]
                        },
                        {
                          q: "What if we don't use Airtable or Make.com yet?",
                          a: "Perfect. No prior systems knowledge or tech backgrounds are required. Everything is built on click-to-duplicate ease. We provide complete 1-click duplicating database URLs and raw pre-packaged Make.com .json scenario imports. You can go from absolute zero to live automation in less than 20 minutes.",
                          icon: Cpu,
                          color: "emerald",
                          bullets: ["1-Click duplication structure mapped to clear guidelines", "Fully compatible with free account tiers in tools", "Includes complete self-guided video blueprint manuals for quick deployment"]
                        }
                      ].map((faq, index) => {
                        const isExpanded = expandedFaq === index;
                        const IconComponent = faq.icon;
                        return (
                          <div 
                            key={index} 
                            className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                              isExpanded 
                                ? "bg-slate-50/80 border-slate-900 shadow-xs" 
                                : "bg-white hover:bg-slate-50 border-slate-200"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedFaq(isExpanded ? null : index)}
                              className="w-full p-4.5 text-left flex justify-between items-center gap-4 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`p-2 rounded-lg shrink-0 ${
                                  faq.color === 'indigo' 
                                    ? "bg-indigo-50/80 text-indigo-600 border border-indigo-100" 
                                    : faq.color === 'rose' 
                                      ? "bg-rose-50 text-rose-600 border border-rose-100" 
                                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                }`}>
                                  <IconComponent className="w-4 h-4" />
                                </span>
                                <h5 className="font-extrabold text-slate-900 text-base font-semibold font-sans tracking-tight">
                                  {faq.q}
                                </h5>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-slate-405 shrink-0 transition-transform duration-200 ${
                                isExpanded ? "rotate-90 text-slate-800" : ""
                              }`} />
                            </button>

                            {isExpanded && (
                              <div className="px-4.5 pb-5 pt-1 text-xs text-slate-650 leading-relaxed font-sans border-t border-slate-100 animate-slide-down">
                                <p className="font-light">{faq.a}</p>
                                <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-200/50">
                                  <span className="text-xs font-semibold tracking-wider font-mono font-bold text-slate-450 uppercase tracking-wider block mb-1">
                                    Strategic Objection Repositioning:
                                  </span>
                                  {faq.bullets.map((bText, bIdx) => (
                                    <div key={bIdx} className="flex items-center gap-2 text-slate-800 font-medium">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
                                      <span>{bText}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 6. Target Alignment Filter (Who This Is For vs. Not For) */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-left">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        Module 06: Target Alignment Filter
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2 font-sans">
                        🎯 The Alignment Filter: Is This For You?
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1 font-sans">
                        High-ticket buyers respect extreme transparency. Qualify agency partners up-front with a hardline alignment filter that positions this system as a pristine asset for operators, not a generic utility.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      
                      {/* Who It Is For */}
                      <div className="bg-emerald-50/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
                              <Check className="w-4 h-4" />
                            </span>
                            <h5 className="font-bold text-slate-950 text-sm font-sans">
                              Perfect Alignment: Yes, This Is Built For You If...
                            </h5>
                          </div>
                          
                          <ul className="text-xs text-slate-700 space-y-3.5 pl-1 font-light font-sans leading-relaxed">
                            <li className="flex gap-2.5 items-start">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2 animate-pulse" />
                              <span>
                                <strong>Scaling Growth Agencies ($50k-$250k/mo):</strong> You are already driving inbound streams but lose high-revenue deals to slow, unorganized, or manual sales representative triage loops.
                              </span>
                            </li>
                            <li className="flex gap-2.5 items-start">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2 animate-pulse" />
                              <span>
                                <strong>Outbound-Heavy B2B Teams:</strong> You have active reps booking sales meetings, but suffer from overlapping outreach actions, lead cannibalization, or sloppy pipeline attribution records.
                              </span>
                            </li>
                            <li className="flex gap-2.5 items-start">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2 animate-pulse" />
                              <span>
                                <strong>Fractional Operations/RevOps Consultants:</strong> You seek structured, copy-and-paste assets to solve core pipeline bottlenecks for high-ticket clients, turning immediate value into scalable advisory contracts.
                              </span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="p-3 bg-emerald-500/10 text-emerald-900 rounded-xl text-xs font-semibold font-medium border border-emerald-500/10 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Guarantees absolute workflow mastery and fast execution loops.</span>
                        </div>
                      </div>

                      {/* Who It Is NOT For */}
                      <div className="bg-rose-50/10 border border-rose-500/20 p-6 rounded-2xl flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-rose-500/10 text-rose-600 rounded-lg border border-rose-500/20">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                            <h5 className="font-bold text-slate-950 text-sm font-sans">
                              Imperfect Alignment: No, Avoid This Product If...
                            </h5>
                          </div>
                          
                          <ul className="text-xs text-slate-700 space-y-3.5 pl-1 font-light font-sans leading-relaxed">
                            <li className="flex gap-2.5 items-start">
                              <span className="w-1.5 h-1.5 bg-rose-450 rounded-full shrink-0 mt-2" />
                              <span>
                                <strong>Direct-to-Consumer E-Commerce Stores:</strong> You depend on high-volume consumer checkout carts, email abandoned loops, or social influencer attribution, rather than high-value B2B deals.
                              </span>
                            </li>
                            <li className="flex gap-2.5 items-start">
                              <span className="w-1.5 h-1.5 bg-rose-450 rounded-full shrink-0 mt-2" />
                              <span>
                                <strong>Casual Part-Time Freelancers:</strong> You process under 3 prospective clients per month and cannot justify automating webhook routers or dedicated sales representative triage queues.
                              </span>
                            </li>
                            <li className="flex gap-2.5 items-start">
                              <span className="w-1.5 h-1.5 bg-rose-450 rounded-full shrink-0 mt-2" />
                              <span>
                                <strong>Generic Task-List Hunters:</strong> You want basic visual progress boards (like Trello or Todoist) with no complex automation routing, Clearbit enrichment API, or Slack alert webhooks.
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-3 bg-rose-500/10 text-rose-900 rounded-xl text-xs font-semibold font-medium border border-rose-500/10 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>We heavily advise against purchasing; save your capital for D2C tools.</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 7. High-Impact Use-Case Scenario Library */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-left">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                        Module 07: Proof Scenarios Library
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2 font-sans">
                        📖 The Use-Case Scenario Proof Library
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1 font-sans">
                        Turn theoretical theories into concrete math. Present high-spending buyers with side-by-side Before vs. After operational case narratives detailing how leaks are plugged in real-time.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Scenario A: The Creative/Design Agency */}
                      <div className="border border-slate-200 rounded-2xl p-5 bg-white hover:bg-slate-50/40 transition-all flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border font-semibold bg-indigo-50 text-indigo-700 border-indigo-100 uppercase">
                              SCENARIO A &bull; DESIGN OS
                            </span>
                            <span className="text-xs font-semibold tracking-wider text-rose-500 font-mono font-bold">Weekend Leak Decay</span>
                          </div>
                          
                          <div>
                            <h5 className="font-bold text-slate-950 text-sm font-sans">
                              🎨 The Creative & Design Agency
                            </h5>
                            <p className="text-xs text-slate-450 font-light mt-1">Plugging response speed decay on off-duty inbound leads.</p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs font-sans">
                            {/* Before */}
                            <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                              <span className="text-[9px] font-mono font-bold tracking-wider text-rose-600 block uppercase mb-1">
                                ❌ OLD CHAOTIC WAY (SLA: 62hr Decay)
                              </span>
                              <p className="text-slate-650 font-light leading-relaxed">
                                High-intent lead lands on Friday at 7:15 PM with a $12,000 corporate rebranding budget. The team is logged off. The inquiry sits dead in a generic inbox until Monday morning at 9:30 AM. By then, the client already booked calls on Saturday with 2 competitors. <strong className="text-rose-700">Lost revenue: $12,000.</strong>
                              </p>
                            </div>

                            {/* After */}
                            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                              <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-600 block uppercase mb-1">
                                ✅ NEW AUTOMATED WAY (SLA: 12-min Reply)
                              </span>
                              <p className="text-slate-650 font-light leading-relaxed">
                                Lead submits Friday 7:15 PM. Webhook triggers tech stack lookup and enriches them as "50+ employee enterprise target". High-urgency mobile Slack notification triggers. Active SDR claims deal on phone and dispatches custom portfolio in 14 mins. <strong className="text-emerald-700">Contract locked: $12,000 won.</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-slate-100 text-xs font-semibold tracking-wider font-mono text-slate-450">
                          Metric: Outbound Response Time Reduced 99.4%
                        </div>
                      </div>

                      {/* Scenario B: The Paid Media/Growth Shop */}
                      <div className="border border-slate-200 rounded-2xl p-5 bg-white hover:bg-slate-50/40 transition-all flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border font-semibold bg-indigo-50 text-indigo-700 border-indigo-100 uppercase">
                              SCENARIO B &bull; PAID GROWTH
                            </span>
                            <span className="text-xs font-semibold tracking-wider text-rose-500 font-mono font-bold">Untracked Ad Attribution</span>
                          </div>
                          
                          <div>
                            <h5 className="font-bold text-slate-950 text-sm font-sans">
                              📈 The Paid Media & Growth Shop
                            </h5>
                            <p className="text-xs text-[rgb(120,120,150)] font-light mt-1">Fixing blind scales & chaotic source data tracking leaks.</p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs font-sans">
                            {/* Before */}
                            <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                              <span className="text-[9px] font-mono font-bold tracking-wider text-rose-600 block uppercase mb-1">
                                ❌ OLD CHAOTIC WAY (Untracked Spends)
                              </span>
                              <p className="text-slate-650 font-light leading-relaxed">
                                Shop spends $15,000/mo on digital acquisition ads, capturing 45 inbound leads. Due to sloppy manual tracking, UTM parameters are lost or mapped onto incorrect rows. Founders fly blind, with zero concrete return-on-ad-spend (ROAS) visibility. <strong className="text-rose-700">Ad budget bleed: $5,000+.</strong>
                              </p>
                            </div>

                            {/* After */}
                            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                              <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-600 block uppercase mb-1">
                                ✅ NEW AUTOMATED WAY (Locked UTM & ROAS)
                              </span>
                              <p className="text-slate-650 font-light leading-relaxed">
                                Webhooks intercept form posts and lock UTMs in the record. The background parser automatically appends Clearbit Technographics and maps them directly to active payment grids. Executive dashboards immediately calculate dynamic client acquisition cost (CAC). <strong className="text-emerald-700">ROAS scale: 2.5x efficiency jump.</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-slate-100 text-xs font-semibold tracking-wider font-mono text-slate-450">
                          Metric: Zero lost tracking UTM parameters
                        </div>
                      </div>

                      {/* Scenario C: The Outbound/SDR Team */}
                      <div className="border border-slate-200 rounded-2xl p-5 bg-white hover:bg-slate-50/40 transition-all flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border font-semibold bg-indigo-50 text-indigo-700 border-indigo-100 uppercase">
                              SCENARIO C &bull; OUTBOUND OS
                            </span>
                            <span className="text-xs font-semibold tracking-wider text-rose-500 font-mono font-bold">Rep Cannibalization</span>
                          </div>
                          
                          <div>
                            <h5 className="font-bold text-slate-950 text-sm font-sans">
                              🤝 The Outbound & SDR Team
                            </h5>
                            <p className="text-xs text-slate-450 font-light mt-1">Standardizing dispatcher assignment routes & rep sync.</p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs font-sans">
                            {/* Before */}
                            <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                              <span className="text-[9px] font-mono font-bold tracking-wider text-rose-600 block uppercase mb-1">
                                ❌ OLD CHAOTIC WAY (Sloppy Assignments)
                              </span>
                              <p className="text-slate-650 font-light leading-relaxed">
                                3 active reps sharing a chaotic, messy spreadsheet. Multiple SDRs contact the same high-tier enterprise lead on accident, while other hot leads sit stale for over 48 hours without assignment. Leads are cannibalized, creating customer distrust. <strong className="text-rose-700">Team efficiency: down 40%.</strong>
                              </p>
                            </div>

                            {/* After */}
                            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                              <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-600 block uppercase mb-1">
                                ✅ NEW AUTOMATED WAY (Round-Robin & Alarm)
                              </span>
                              <p className="text-slate-650 font-light leading-relaxed">
                                Inbounds are handled via sequential active rep Round-Robin dispatch. An automated 4-hour countdown evaluates if status remains "Pending", triggering high-urgency manager recovery alarms in Slack. Double assignments drop to absolute zero. <strong className="text-emerald-700">Rep output: 45% bookings increase.</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-slate-100 text-xs font-semibold tracking-wider font-mono text-slate-450">
                          Metric: Rep double-touch overlap eliminated 100%
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 8. Risk Reversal & Interactive ROI Math */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                        Module 08: Risk Reversal & ROI Math
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">
                        ⚖️ Interactive Profit Leak Math & Risk Reversal
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1">
                        Show agency founders the absolute cost of delay. Save a single lead or two executive hours, and the complete template investment of {pricePoint || "$350"} is recovered 10x over.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* Risk Reversal Copy block (5 cols) */}
                      <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col justify-between text-left">
                        <div className="space-y-4">
                          <h5 className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Elite Risk-Reversal Statement
                          </h5>
                          
                          <p className="text-xs text-slate-650 leading-relaxed font-light">
                            "If you save just a single lost qualified pipeline prospect per quarter, or recover two hours of executive administrative research time per month, you don't just pay back the <strong className="text-slate-850 font-bold">{pricePoint || "$350"} one-time template fee</strong> – you generate an immediate 10x ROI."
                          </p>
                          <p className="text-xs text-slate-650 leading-relaxed font-light">
                            This asset is a tax-deductible operational expense that builds a structured moat around your agency's pipeline. No recurring software fees, no experimental HR overhead, and completely standard-operating-procedure compliant.
                          </p>
                          
                          <div className="p-3 bg-amber-50 border border-amber-150 rounded-lg text-xs font-semibold text-amber-850">
                            <strong>🎯 Hot Pitch Copy:</strong> Use the live calculated leakage metrics values to back up sales messages and close boutique owners with absolute cold authority.
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleCopyText(
                              `Risk Reversal ROI Proof:\nAt an Average Client Retainer Value of $${roiRetainerValue}, losing ${roiLostLeads} leads/month leads to a $${(roiLostLeads * roiRetainerValue * 0.20).toLocaleString()}/month leaked pipeline. Reclaiming just 20% of this leak secures $${(roiLostLeads * roiRetainerValue * 0.20).toLocaleString()} back. A single template purchase at ${pricePoint} is an instant ROI.`,
                              "roi-copy"
                            )}
                            className="w-full text-[10.5px] bg-slate-900 text-slate-100 hover:bg-slate-850 py-2 rounded-lg font-mono font-bold text-center flex items-center justify-center gap-1.5 transition"
                          >
                            {copiedState === "roi-copy" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">ROI Pitch Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Live ROI Pitch Statement</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Interactive Calculator (7 cols) */}
                      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                        
                        <div>
                          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                              Interactive Profit Leak Calculator
                            </span>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 font-mono">Dynamic Values</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                            {/* ACV Input */}
                            <div className="space-y-1.5 text-left">
                              <label className="text-sm font-semibold font-bold text-slate-700 uppercase font-mono block">
                                Average Retainer Value (ACV)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="1000"
                                  max="15000"
                                  step="500"
                                  value={roiRetainerValue}
                                  onChange={(e) => setRoiRetainerValue(parseInt(e.target.value))}
                                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                                />
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800 shrink-0 select-none w-16 text-right">
                                  ${roiRetainerValue.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Lost Leads Input */}
                            <div className="space-y-1.5 text-left">
                              <label className="text-sm font-semibold font-bold text-slate-700 uppercase font-mono block">
                                Lost Leads / Month (By delay)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="15"
                                  step="1"
                                  value={roiLostLeads}
                                  onChange={(e) => setRoiLostLeads(parseInt(e.target.value))}
                                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                                />
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800 shrink-0 select-none w-10 text-right">
                                  {roiLostLeads}
                                </span>
                              </div>
                            </div>

                            {/* Founder hourly rate */}
                            <div className="space-y-1.5 text-left">
                              <label className="text-sm font-semibold font-bold text-slate-700 uppercase font-mono block">
                                Founder Hourly Value ($/hr)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="50"
                                  max="500"
                                  step="25"
                                  value={roiFounderRate}
                                  onChange={(e) => setRoiFounderRate(parseInt(e.target.value))}
                                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                                />
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800 shrink-0 select-none w-14 text-right">
                                  ${roiFounderRate}
                                </span>
                              </div>
                            </div>

                            {/* Manual hours saved */}
                            <div className="space-y-1.5 text-left">
                              <label className="text-sm font-semibold font-bold text-slate-700 uppercase font-mono block">
                                Weekly Manual Admin Hours
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="25"
                                  step="1"
                                  value={roiAdminHours}
                                  onChange={(e) => setRoiAdminHours(parseInt(e.target.value))}
                                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                                />
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800 shrink-0 select-none w-10 text-right">
                                  {roiAdminHours}h
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Calculated Results Block */}
                        <div className="mt-5 grid grid-cols-3 gap-3">
                          {/* Reclaimed Revenue Box */}
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
                            <span className="text-[9px] font-mono font-bold text-rose-500 uppercase leading-none block">
                              Monthly Pipeline Leak
                            </span>
                            <span className="text-sm md:text-base font-extrabold text-rose-700 block mt-1">
                              ${(roiLostLeads * roiRetainerValue).toLocaleString()}
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono block leading-none mt-1">
                              at 100% loss value
                            </span>
                          </div>

                          {/* Reclaimed Time Box */}
                          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                            <span className="text-[9px] font-mono font-bold text-indigo-500 uppercase leading-none block">
                              Founder Time Wasted
                            </span>
                            <span className="text-sm md:text-base font-extrabold text-indigo-700 block mt-1">
                              ${Math.round(roiAdminHours * 4.33 * roiFounderRate).toLocaleString()}
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono block leading-none mt-1 text-center">
                              / month in admin
                            </span>
                          </div>

                          {/* Instant Return ROI box */}
                          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                            <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase leading-none block">
                              Reclaim Opportunity
                            </span>
                            <span className="text-sm md:text-base font-extrabold text-emerald-700 block mt-1">
                              ${Math.round((roiLostLeads * roiRetainerValue * 0.20) + (roiAdminHours * 4.33 * roiFounderRate)).toLocaleString()}
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono block leading-none mt-1 text-center">
                              at 20% rescue rate
                            </span>
                          </div>
                        </div>

                        {/* Dynamic Payback Ratio Gauge Banner */}
                        <div className="mt-4 p-3 bg-slate-900 leading-normal rounded-xl border border-slate-950 text-slate-100">
                          <div className="flex justify-between items-center text-xs font-semibold font-mono">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
                              <span>Dynamic System Return Ratio:</span>
                            </div>
                            <span className="font-bold text-emerald-405 text-xs">
                              {Math.max(
                                10,
                                Math.round(
                                  (((roiLostLeads * roiRetainerValue * 0.20) + (roiAdminHours * 4.33 * roiFounderRate)) / 350) * 100
                                )
                              ).toLocaleString()}% First-Month ROI
                            </span>
                          </div>
                          <p className="text-xs font-semibold tracking-wider text-slate-400 font-light text-left mt-1.5 font-sans leading-relaxed">
                            Based on your custom rates: Rescuing just 20% of your current response-delay leads (${(roiLostLeads * roiRetainerValue * 0.20).toLocaleString()}) and reclaiming your admin hours saves <strong>${Math.round((roiLostLeads * roiRetainerValue * 0.20) + (roiAdminHours * 4.33 * roiFounderRate)).toLocaleString()}/month</strong>, meaning the template pays for itself in less than <strong>{Math.max(1, Math.round(350 / (Math.max(100, (roiLostLeads * roiRetainerValue * 0.20) + (roiAdminHours * 4.33 * roiFounderRate)) / 30)))} days</strong>!
                          </p>
                        </div>

                      </div>

                    </div>
                  </div>

                  {/* Module 09: Performance Analytics Core Sales Hook Copy Block */}
                  <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white rounded-xl border border-indigo-950 p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-start flex-wrap gap-4 text-left">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded inline-block">
                            GUMROAD COPY ENGINE &bull; ANALYTICS HOOK
                          </span>
                          <h4 className="text-lg md:text-xl font-bold text-white font-sans flex items-center gap-2">
                            <span>📊 Feature Spotlight: The Performance Analytics Deep Hook</span>
                          </h4>
                          <p className="text-base text-zinc-200 leading-relaxed font-light font-sans max-w-3xl">
                            Expose operational bleeding in cold B2B campaigns to make the <strong className="text-slate-205">{pricePoint || "$350"} template</strong> an irresistible bargain. This conversion-optimized storefront copy illustrates how the new dashboard saves agency founders from "flying blind" and exposes which exact sales reps are letting hot inbound leads decay.
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleCopyText(
                            `THE ANALYTICS CORE HOOK (GUMROAD STOREFRONT COPY):\n\nHeadline: Is Your Sales Team Letting $3,500+ Retainers Rot in Your Pipeline? (The Performance Analytics Cure)\n\nSubtitle: Most agency founders are completely blind. They spend thousands on cold outreach campaigns, only to let their sales reps leave hot inbound prospects decaying on empty spreadsheets.\n\nBody Copy:\nLet’s be honest. As a founder, you're flying blind.\n\nYou celebrate the raw lead counts. But you have zero idea which specific sales rep is letting a $3,500/mo warm lead rot in their inbox because they took 14 hours to reply.\n\nYou spend $5,000 on ads or outbound and complain that "leads are garbage" – when the truth is your response decay is burning your cash.\n\nIntroducing the SLA & Performance Analytics Dashboard:\nThis isn't a passive template. It is an active operational scoreboard. It maps every prospect tracking milestone, calculates real-time Cost-Per-Lead (CPL) by channel, and tracks outbound response times down to the minute.\n\n- No more rep hiding: See exactly who is neglecting hot prospects with a red-flag warning feed.\n- Instant CAC ROI metrics: Know which specific campaign or UTM tag closed, pulling automated Stripe Checkout metrics directly inside Airtable.\n- Complete Operational Control: No more chaos. Run your agency with the mathematical precision of a private equity fund.`,
                            "analytics-gumroad-copy"
                          )}
                          className="text-[10.5px] bg-indigo-600 hover:bg-indigo-500 text-white font-mono px-3 py-1.5 rounded-lg border border-indigo-500 hover:shadow-sm cursor-pointer flex items-center gap-1.5 transition select-none self-start shrink-0"
                        >
                          {copiedState === "analytics-gumroad-copy" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-in" />
                              <span className="text-emerald-400 font-bold">Copied Copywriter Asset!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Sales Page Text</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Copier Interface Container */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-left">
                        {/* Header mimic */}
                        <div className="flex justify-between items-center bg-slate-950/80 px-4 py-2.5 border-b border-slate-800/80 font-mono text-xs font-semibold tracking-wider text-slate-450">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            <span className="ml-1 text-slate-300">gumroad_sales_page_pitch_matrix.html</span>
                          </span>
                          <span className="text-slate-300 font-mono uppercase">Sales Copy Block</span>
                        </div>

                        {/* Copy block visual preview */}
                        <div className="p-5 space-y-4 font-sans text-xs text-slate-300 leading-relaxed border-b border-slate-800">
                          <div>
                            <span className="text-xs font-semibold tracking-wider text-indigo-400 font-mono uppercase font-black tracking-widest block mb-1">
                              [LAUNCHHEAD PITCH LINE]
                            </span>
                            <h5 className="text-base font-extrabold text-white leading-snug">
                              Is Your Sales Team Letting {upsellPricePoint || "$3,500"}+ Retainers Rot in Your Pipeline? (The Performance Analytics Cure)
                            </h5>
                          </div>

                          <div className="border-l-2 border-indigo-500 pl-4 py-1 italic text-slate-350 bg-indigo-950/30 p-2.5 rounded-r">
                            "Most agency founders are completely blind. They spend thousands on cold outreach campaigns, only to let their sales reps leave hot inbound prospects decaying on empty spreadsheets without real accountability."
                          </div>

                          <p className="font-light">
                            Let's be completely honest. As an agency founder scaling past $50k/mo, you are <strong className="text-white font-bold">flying blind</strong>. You celebrate the raw inbound count in your Slack channels, but you have zero idea which specific sales rep is letting a warm enterprise lead decay because they took 14 hours to reply.
                          </p>

                          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                            <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase leading-none">🔥 EXPOSING THE HIDDEN DECAY BOTTLENECK:</span>
                            <p className="text-xs font-semibold text-slate-400 font-light leading-relaxed">
                              You spend $5,000 to launch outbound campaigns and complain to the SDR team that "outbound leads are garbage" – when the truth is your response decay is burning your cash. If a lead waits over 4 hours, close rates drop by 80%. But because you don't have the metrics, your reps can hide behind subjective reports.
                            </p>
                          </div>

                          <p className="font-light">
                            <strong>The SLA & Performance Analytics Dashboard</strong> isn't a passive sheet. It is an active operational scoreboard. It maps every prospect tracking milestone, calculates real-time Cost-Per-Lead (CPL) by channel, and tracks outbound response times down to the minute. You instantly see which reps are neglecting hot prospects with a red-flag warning feed, and pull Stripe Checkout webhooks to calculate actual ROAS.
                          </p>
                        </div>
                        
                        {/* Interactive Reclaim Calculator Widget inside the copy card */}
                        <div className="bg-slate-950 p-5 text-xs text-slate-300 space-y-4">
                          <div className="flex justify-between items-center border-b border-indigo-950 pb-2">
                            <span className="text-[10.5px] font-mono text-indigo-400 font-black uppercase flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Interactive Blind-Founder Leak Estimator
                            </span>
                            <span className="text-xs font-semibold tracking-wider text-slate-300 font-mono">Demos on-page lead-decay calculations</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <label className="text-[10.5px] text-slate-400 font-medium block">
                                Inbounds per Rep / Month:
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="5"
                                  max="100"
                                  step="5"
                                  value={roiLostLeads * 10}
                                  onChange={(e) => setRoiLostLeads(Math.max(1, Math.round(Number(e.target.value) / 10)))}
                                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <span className="font-mono text-white text-xs font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0 w-12 text-center">
                                  {roiLostLeads * 10}
                                </span>
                              </div>
                              <p className="text-[9.5px] text-slate-300 font-light">
                                Total prospects distributed to your active reps.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10.5px] text-slate-400 font-medium block">
                                Inbound Retainer Size ($):
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="1000"
                                  max="10000"
                                  step="500"
                                  value={roiRetainerValue}
                                  onChange={(e) => setRoiRetainerValue(Number(e.target.value))}
                                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <span className="font-mono text-white text-xs font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0 w-16 text-center">
                                  ${roiRetainerValue.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-[9.5px] text-slate-300 font-light">
                                Typical client contract volume value.
                              </p>
                            </div>
                          </div>

                          {/* Calculated Math Panel */}
                          <div className="bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors border border-indigo-500/10 rounded-lg p-3.5 mt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-left w-full sm:w-auto">
                              <span className="text-[9px] font-mono text-rose-450 font-bold block uppercase leading-none mb-1">
                                💔 CURRENT REPUTATIONAL INBOUND DECAY LOSS (Est 25% Leak):
                              </span>
                              <span className="text-base font-extrabold text-rose-500 font-mono">
                                ${(roiLostLeads * 10 * roiRetainerValue * 0.25).toLocaleString()}/month
                              </span>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <span className="text-[9px] font-mono text-emerald-450 font-bold block uppercase leading-none mb-1">
                                ⚡ VALUE RECLAIMED BY DISPATCH ALARMS:
                              </span>
                              <span className="text-base font-extrabold text-emerald-400 font-mono">
                                ${(roiLostLeads * 10 * roiRetainerValue * 0.25 * 0.80).toLocaleString()}/month
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: High-Ticket Upsell */}
              {activeTab === "upsell" && (
                <div className="space-y-6 animate-fade-in text-slate-800">
                  
                  {/* High Ticket Value Statement */}
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-5 shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold tracking-wider font-mono font-bold uppercase text-sky-700 tracking-wider">
                        10x Upsell Bridge Method
                      </span>
                      <span className="text-sm font-mono font-bold text-sky-800">
                        {upsellPricePoint || "$3,500"}+ Retainer Target
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm tracking-tight mb-2">
                      Leverage Package Name: <span className="text-sky-800">{currentBlueprint.highTicketUpsellStrategy.upsellPackageName}</span>
                    </h3>
                    <p className="text-xs text-sky-950 font-light leading-relaxed">
                      {currentBlueprint.highTicketUpsellStrategy.transitionContext}
                    </p>
                  </div>

                  {/* Interactive $3,500+ Retainer Upsell Pitch Script Widget */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl border border-slate-950 p-6 shadow-sm relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-5">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded inline-block">
                            STRATEGIC UPSELL &bull; WHITE-GLOVE SCRIPT
                          </span>
                          <h4 className="text-base font-bold text-white font-sans flex items-center gap-2">
                            <span>💼 The $3,500+ Retainer Upsell Script: Command Center Consultation</span>
                          </h4>
                          <p className="text-base text-zinc-200 leading-relaxed font-light max-w-3xl">
                            Position yourself as an enterprise RevOps architect. Use this interactive pitch script to move buyers of the <strong className="text-slate-200">{pricePoint || "$350"} template</strong> onto a custom <strong className="text-slate-205">{upsellPricePoint || "$3,500"}+ implementation retainer</strong> by proposing a unified financial command center integrating QuickBooks, Stripe, and performance analytics.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const steps = [
                              `[STAGE 01: Trust Transition & Opener]\n"Hey, since you’ve successfully loaded our base ${currentBlueprint.packageName} engine, your raw capture systems are running. But let me ask you: how are you currently tying this inbound pipeline to your actual financial ledger? Right now, your lead capturing is automated, but your financial calculations are likely sitting in siloed QuickBooks accounts or Stripe portals, meaning you have to manually copy numbers to calculate ROI. If you want, instead of leaving you to configure these custom webhooks, we can do a complete white-glove setup. We'll integrate your QuickBooks or Stripe financials directly into a unified company Command Center so you have a real-time CFO radar on your scaling margins. Would you be open to seeing how we integrate that?"`,
                              `[STAGE 02: Exposing the Blindspots]\n"Here is the issue: most agency founders are flying blind when they scale past $100k/mo. They look at raw lead count in Slack and think everything is fine. But behind the scenes, you have a massive blindspot: response decay. If a rep takes 4 hours instead of 5 minutes to follow up, your close rate drops by 80%. But without an automated SLA performance audit log, they can just blame 'bad lead quality' instead of admitting slow response compliance. By tracking Average Speed-to-Lead and SLA compliance rates, we turn subjective arguments into objective mathematical metrics. You'll know immediately which specific rep is letting $3,500+ retainers rot in your pipeline."`,
                              `[STAGE 03: Proposing the Unified Command Center]\n"What we build for you is a unified company command center. We hook up QuickBooks, Stripe, and your legacy CRM data directly to your new Performance Analytics Airtable CRM database. Every time a deal transitions to Closed-Won, the background scenarios instantly cross-reference its inbound UTM traffic source, calculate the exact Customer Acquisition Cost (CAC) for that profile, and update your executive dashboard. You see your actual ROAS and rep commission maps on a single pane of glass. No matching datasets. No manual math. Just absolute executive command."`,
                              `[STAGE 04: Financial integrations & Closing]\n"Look, to hire a dedicated full-time RevOps engineer or a VP of Sales Operations would cost you at least $6,000 to $8,000 a month. By retaining us for a customized implementation at a flat $3,500 retainer, we build this company command center for you, migrate up to 5,000 legacy records, and onboard your entire team on live consultation calls. If we save just a single lost client deal or eliminate two hours of founder administrative hours, the entire investment is fully recovered with immediate margin payload. Let's schedule your setup call for this Friday?"`
                            ];
                            handleCopyText(steps[upsellScriptStep], `upsell-script-step-${upsellScriptStep}`);
                          }}
                          className="text-xs font-semibold tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white font-mono px-3 py-1.5 rounded-lg border border-indigo-500 hover:shadow-sm cursor-pointer flex items-center gap-1.5 transition select-none self-start shrink-0"
                        >
                          {copiedState === `upsell-script-step-${upsellScriptStep}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-in" />
                              <span className="text-emerald-400 font-bold font-sans">Active Step Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Active Pitch Step</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Interactive Teleprompter Tabs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 border-b border-slate-800 pb-3 font-mono text-[9px]">
                        {[
                          { step: 0, label: "01. Trust Opener" },
                          { step: 1, label: "02. Expose Blindspot" },
                          { step: 2, label: "03. Command Center" },
                          { step: 3, label: "04. Financial Close" }
                        ].map((t) => (
                          <button
                            key={t.step}
                            type="button"
                            onClick={() => setUpsellScriptStep(t.step)}
                            className={`p-2 py-1.5 rounded-md text-center transition-all cursor-pointer font-bold uppercase border ${
                              upsellScriptStep === t.step
                                ? "bg-indigo-650 text-white border-indigo-500/80 shadow-xs"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Teleprompter Display Console */}
                      <div className="bg-slate-950 rounded-xl border border-slate-850 p-4.5 space-y-4">
                        <div className="flex justify-between items-center text-xs font-semibold tracking-wider font-mono border-b border-indigo-950 pb-2">
                          <span className="text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Teleprompter Section: Stage 0{upsellScriptStep + 1}
                          </span>
                          <span className="text-slate-300">TARGET: Boutique Agency Owner ($50k-$250k/mo)</span>
                        </div>

                        {/* Speech script preview text */}
                        <div className="space-y-3.5">
                          <div>
                            <span className="text-[9px] font-mono text-indigo-400 font-bold tracking-widest block uppercase mb-1">
                              🎯 CORE PITCH STRATEGY & GOAL:
                            </span>
                            <p className="text-xs font-semibold text-slate-300 font-light leading-relaxed font-sans">
                              {upsellScriptStep === 0 && "Subvert the \"freelance developer\" dynamic by positioning your team as strategic financial scaling architects. Request visual access to audited systems."}
                              {upsellScriptStep === 1 && "Expose the severe leak of CRM response delay times. Frame subjective performance metrics into absolute math to establish complete trust."}
                              {upsellScriptStep === 2 && "Detail the beautiful, automated unification of CRM pipelines with Stripe and QuickBooks cash ledger webhooks directly."}
                              {upsellScriptStep === 3 && "Anchor your price of $3,500/mo against the cost of hiring a VP of Sales Operations ($6k-$8k/mo) to make it an instant buying math decision."}
                            </p>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden">
                            <span className="text-[9px] font-mono text-emerald-400 font-extrabold block uppercase mb-2">
                              🎤 VERBAL DIALOGUE TO SPEAK (TAILORED SCRIPT TEXT):
                            </span>
                            
                            <p className="text-xs text-white leading-relaxed font-sans italic font-light font-sans">
                              {upsellScriptStep === 0 && (
                                <>
                                  "Hey, since you’ve successfully loaded our base <strong className="text-indigo-300">{currentBlueprint.packageName}</strong> engine, your raw capture systems are running. But let me ask you: how are you currently tying this inbound pipeline to your actual financial ledger? Right now, your lead capturing is automated, but your financial calculations are likely sitting in siloed QuickBooks accounts or Stripe portals, meaning you have to manually copy numbers to calculate ROI. If you want, instead of leaving you to configure these custom webhooks, we can do a complete white-glove setup. We'll integrate your QuickBooks or Stripe financials directly into a unified company Command Center so you have a real-time CFO radar on your scaling margins. Would you be open to seeing how we integrate that?"
                                </>
                              )}
                              {upsellScriptStep === 1 && (
                                <>
                                  "Here is the issue: most agency founders are flying blind when they scale past $100k/mo. They look at raw lead count in Slack and think everything is fine. But behind the scenes, you have a massive blindspot: response decay. If a rep takes 4 hours instead of 5 minutes to follow up, your close rate drops by 80%. But without an automated SLA performance audit log, they can just blame 'bad lead quality' instead of admitting slow response compliance. By tracking Average Speed-to-Lead and SLA compliance rates, we turn subjective arguments into objective mathematical metrics. You'll know immediately which specific rep is letting <strong className="text-rose-300">{upsellPricePoint || "$3,500"}+ retainers</strong> rot in your pipeline."
                                </>
                              )}
                              {upsellScriptStep === 2 && (
                                <>
                                  "What we build for you is a unified company command center. We hook up QuickBooks, Stripe, and your legacy CRM data directly to your new Performance Analytics Airtable CRM database. Every time a deal transitions to Closed-Won, the background scenarios instantly cross-references its inbound UTM traffic source, calculates the exact Customer Acquisition Cost (CAC) for that profile, and updates your executive dashboard. You see your actual ROAS and rep commission maps on a single pane of glass. No matching datasets. No manual math. Just absolute executive command."
                                </>
                              )}
                              {upsellScriptStep === 3 && (
                                <>
                                  "Look, to hire a dedicated full-time RevOps engineer or a VP of Sales Operations would cost you at least $6,000 to $8,000 a month. By retaining us for a customized implementation at a flat <strong className="text-emerald-300">{upsellPricePoint || "$3,500"} retainer</strong>, we build this company command center for you, migrate up to 5,000 legacy records, and onboard your entire team on live consultation calls. If we save just a single lost client deal or eliminate two hours of founder administrative hours, the entire investment is fully recovered with immediate margin payload. Let's schedule your setup call for this Friday?"
                                </>
                              )}
                            </p>
                          </div>

                          <div className="bg-slate-900/45 p-3 rounded-lg border border-slate-850 text-xs font-semibold space-y-1">
                            <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase">🛡️ PRE-EMPTIVE OBJECTION ANCHOR COUNTER:</span>
                            <div className="text-slate-400 font-light font-sans">
                              {upsellScriptStep === 0 && (
                                <>
                                  <strong className="text-slate-300">Objection:</strong> "Why not just do it ourselves?"
                                  <br />
                                  <strong className="text-slate-300">Leverage response:</strong> "The blueprint gives you standard formulas. Our bespoke implementation handles your historical cleaning hygiene, chart of accounts mapping, and securely authorizes live Quickbooks nodes to prevent data collision."
                                </>
                              )}
                              {upsellScriptStep === 1 && (
                                <>
                                  <strong className="text-slate-300">Objection:</strong> "My reps say they reply immediately."
                                  <br />
                                  <strong className="text-slate-300">Leverage response:</strong> "Gut feeling is expensive. When we install automated Slack escalation alarms and real-time speed tracking formulas, you get objective statistics instead of rep excuses."
                                </>
                              )}
                              {upsellScriptStep === 2 && (
                                <>
                                  <strong className="text-slate-300">Objection:</strong> "Our financial data is too messy to sync."
                                  <br />
                                  <strong className="text-slate-300">Leverage response:</strong> "A messy data pool is the ultimate reason you need systems automation. Part of our implementation is deep data sanitization and strict matching logic to ensure clean reporting mappings."
                                </>
                              )}
                              {upsellScriptStep === 3 && (
                                <>
                                  <strong className="text-slate-300">Objection:</strong> "Can we do this next month?"
                                  <br />
                                  <strong className="text-slate-300">Leverage response:</strong> "Every day your team works on empty spreadsheets, you are bleeding ad spend and rep alignment. Reclaim control today so you can scale marketing channels on absolute mathematical margins this upcoming week."
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Bespoke Deliverables Matrix */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-6">
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Tailored High-Ticket Client Deliverables
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-indigo-500" /> Manual Setup Core Duties
                        </h5>
                        <ul className="space-y-2">
                          {currentBlueprint.highTicketUpsellStrategy.customDeliverablesList.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-indigo-500 font-bold shrink-0">&bull;</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-emerald-500" /> Enterprise APIs & Integrations
                        </h5>
                        <ul className="space-y-2">
                          {currentBlueprint.highTicketUpsellStrategy.integrationsRecommended.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold shrink-0">&bull;</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <h5 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-600" /> Staff Onboarding & Operational Alignment Plan
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {currentBlueprint.highTicketUpsellStrategy.privateOnboardingAndTrainingPlan}
                      </p>
                    </div>

                    <div className="mt-6 bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-950">
                      <h5 className="text-xs font-mono uppercase font-black text-indigo-400 tracking-wider mb-2">
                        Client Purchasing ROI Justification
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {currentBlueprint.highTicketUpsellStrategy.marginJustification}
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: Outbound Outreach Sequences */}
              {activeTab === "outreach" && (
                <div className="space-y-6 animate-fade-in text-slate-800">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                    
                    {/* Left Column: AcquisitionOS-AI Copilot */}
                    <div className="lg:col-span-3 bg-slate-900 border border-slate-950 rounded-2xl p-5 text-slate-150 flex flex-col justify-between shadow-lg relative min-h-[580px]">
                      
                      {/* Header */}
                      <div className="border-b border-slate-800 pb-3 mb-3 shrink-0">
                        <div className="flex items-center gap-1.5 justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                              AcquisitionOS-AI V1.4.1 &bull; Copilot Status: Online
                            </span>
                          </div>
                          <span className="text-[8px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                            RevOps Port: 3000
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-white mt-1 font-sans flex items-center gap-2">
                          🤖 B2B RevOps & Sales Triage Assistant
                        </h3>
                        <p className="text-xs font-semibold tracking-wider text-slate-400 font-light mt-0.5">
                          Silicon Valley-grade operational copilot designed to analyze databases & draft high-velocity outreach response packages.
                        </p>
                      </div>

                      {/* Live Context Card */}
                      <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-3 mb-3 space-y-1.5 text-xs shrink-0">
                        <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                          📶 Live Airtable Prospect Feeds (Click to load context):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5 text-[9px] font-mono">
                          <button 
                            type="button"
                            onClick={() => handleSendCopilotMessage("Draft an opener for Marcus Vance")}
                            className="p-1 px-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 rounded-md text-left transition-all cursor-pointer group shrink-0"
                          >
                            <div className="flex items-center justify-between font-bold text-rose-300">
                              <span className="truncate">1. Marcus V.</span>
                              <span className="text-[7px] bg-rose-500 text-white px-0.5 font-sans rounded">95</span>
                            </div>
                            <div className="text-slate-400 text-[7px] mt-0.5 group-hover:text-white transition-colors">🚨 CRITICAL SLA (6.5h)</div>
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleSendCopilotMessage("Draft an opener for Sarah Carter")}
                            className="p-1 px-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 rounded-md text-left transition-all cursor-pointer group shrink-0"
                          >
                            <div className="flex items-center justify-between font-bold text-amber-300">
                              <span className="truncate">2. Sarah C.</span>
                              <span className="text-[7px] bg-indigo-500 text-white px-0.5 font-sans rounded">92</span>
                            </div>
                            <div className="text-slate-400 text-[7px] mt-0.5 group-hover:text-white transition-colors">⚠️ SLA Breach (5h)</div>
                          </button>

                          <div className="p-1 px-1.5 bg-slate-850 border border-slate-800 rounded-md">
                            <div className="flex items-center justify-between font-bold text-slate-300">
                              <span className="truncate">3. Amira K.</span>
                              <span className="text-[7px] bg-slate-700 text-white px-0.5 font-sans rounded">78</span>
                            </div>
                            <div className="text-slate-300 text-[7px] mt-0.5">🟢 SDR Sean Assigned</div>
                          </div>

                          <div className="p-1 px-1.5 bg-slate-850 border border-slate-800 rounded-md">
                            <div className="flex items-center justify-between font-bold text-slate-400">
                              <span className="truncate">4. Danny D.</span>
                              <span className="text-[7px] bg-slate-750 text-white px-0.5 font-sans rounded">40</span>
                            </div>
                            <div className="text-slate-300 text-[7px] mt-0.5">🟢 Safe Outbound (1.2h)</div>
                          </div>
                        </div>
                      </div>

                      {/* Dialogue History */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex-1 max-h-[300px] overflow-y-auto mb-3 space-y-3.5 shadow-inner scrollbar-thin scrollbar-thumb-slate-800 text-left">
                        {copilotHistory.map((msg, mIdx) => (
                          <div 
                            key={mIdx} 
                            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[8px] font-mono text-slate-300">
                              <span>{msg.timestamp}</span>
                              <span className={`font-bold uppercase ${msg.sender === "user" ? "text-indigo-400" : "text-emerald-400"}`}>
                                {msg.sender === "user" ? "SDR Executive" : "AcquisitionOS AI"}
                              </span>
                            </div>
                            <div 
                              className={`text-xs p-3 rounded-lg max-w-[95%] whitespace-pre-wrap leading-relaxed ${
                                msg.sender === "user" 
                                  ? "bg-indigo-600 text-white border border-indigo-700 font-medium font-sans" 
                                  : "bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs font-semibold"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}

                        {isCopilotLoading && (
                          <div className="flex flex-col items-start animate-pulse">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                                AcquisitionOS-AI querying database maps...
                              </span>
                            </div>
                            <div className="h-10 w-2/3 bg-slate-850 rounded-lg" />
                          </div>
                        )}
                      </div>

                      {/* Command Shell Quick Drawer */}
                      <div className="mb-3 shrink-0">
                        <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                          🛡️ Quick Trigger Workflows (1-Click Executes):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendCopilotMessage("Triage triage grid")}
                            className="text-[9px] font-mono font-bold py-1 px-2 border rounded bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-200 hover:text-white transition-all cursor-pointer"
                          >
                            📊 /triage-lead-grid
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendCopilotMessage("Draft an SLA reminder")}
                            className="text-[9px] font-mono font-bold py-1 px-2 border rounded bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-200 hover:text-white transition-all cursor-pointer"
                          >
                            💬 /sla-slack-reminder
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendCopilotMessage("Troubleshoot webhook")}
                            className="text-[9px] font-mono font-bold py-1 px-2 border rounded bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-200 hover:text-white transition-all cursor-pointer"
                          >
                            🛠️ /troubleshoot-webhook
                          </button>
                        </div>
                      </div>

                      {/* Command Console Input Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendCopilotMessage();
                        }}
                        className="flex gap-2 items-center shrink-0"
                      >
                        <input
                          type="text"
                          value={copilotMessage}
                          onChange={(e) => setCopilotMessage(e.target.value)}
                          placeholder="Command copilot: 'Draft an opener for Marcus Vance'... or ask custom RevOps questions"
                          className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-xs flex-grow font-sans"
                          disabled={isCopilotLoading}
                        />
                        <button
                          type="submit"
                          disabled={isCopilotLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all flex items-center justify-center font-mono text-base font-semibold min-h-[44px] font-bold"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Outbound Copywriting sequences list */}
                    <div className="lg:col-span-2 space-y-4 flex flex-col justify-start">
                      
                      <div className="p-1 px-3 bg-slate-100 border border-slate-200 rounded-xl text-left">
                        <h4 className="text-xs font-bold text-slate-900 mt-1">📋 Outbound Sequence Templates</h4>
                        <p className="text-xs font-semibold tracking-wider text-slate-300 leading-tight font-light mb-1">
                          Copywriting structures generated for your {pricePoint || "$350"} client asset stack.
                        </p>
                      </div>

                      {/* LinkedIn outreach templates */}
                      <div className="bg-white border border-slate-200/80 rounded-xl p-4 relative text-left shadow-xs">
                        <button
                          onClick={() => handleCopyToClipboard(currentBlueprint.outreachTemplates.linkedinOutreach, "linkedin")}
                          className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-100 p-1 rounded transition-all"
                          title="Copy message to clipboard"
                        >
                          {copiedTextId === "linkedin" ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        
                        <span className="text-[9px] font-mono text-slate-300 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 uppercase font-black tracking-wider">
                          LinkedIn Conversational Touchpoint
                        </span>

                        <p className="text-xs font-semibold text-slate-600 mt-3 leading-relaxed pr-6 whitespace-pre-wrap font-sans">
                          {currentBlueprint.outreachTemplates.linkedinOutreach}
                        </p>
                      </div>

                      {/* Cold Email Cadence 1 */}
                      <div className="bg-white border border-slate-200/80 rounded-xl p-4 relative text-left shadow-xs">
                        <button
                          onClick={() => handleCopyToClipboard(currentBlueprint.outreachTemplates.emailSequence1, "email-1")}
                          className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-100 p-1 rounded transition-all"
                          title="Copy email to clipboard"
                        >
                          {copiedTextId === "email-1" ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        
                        <span className="text-[9px] font-mono text-indigo-500 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 uppercase font-black tracking-wider">
                          Outbound Sequence Email #1 &mdash; Problem Pitch
                        </span>

                        <p className="text-xs font-semibold tracking-wider text-slate-600 mt-3 leading-relaxed pr-6 whitespace-pre-wrap font-mono">
                          {currentBlueprint.outreachTemplates.emailSequence1}
                        </p>
                      </div>

                      {/* Cold Email Cadence 2 */}
                      <div className="bg-white border border-slate-200/80 rounded-xl p-4 relative text-left shadow-xs">
                        <button
                          onClick={() => handleCopyToClipboard(currentBlueprint.outreachTemplates.emailSequence2, "email-2")}
                          className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-100 p-1 rounded transition-all"
                          title="Copy email to clipboard"
                        >
                          {copiedTextId === "email-2" ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        
                        <span className="text-[9px] font-mono text-indigo-500 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 uppercase font-black tracking-wider">
                          Outbound Sequence Email #2 &mdash; Authority Walkthrough
                        </span>

                        <p className="text-xs font-semibold tracking-wider text-slate-600 mt-3 leading-relaxed pr-6 whitespace-pre-wrap font-mono">
                          {currentBlueprint.outreachTemplates.emailSequence2}
                        </p>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* TAB 5: Airtable Database Schema (SLA Metrics & Scoring Engines) */}
              {activeTab === "airtable" && (
                <div className="space-y-6 animate-fade-in text-slate-800">
                  
                  {/* Section 1: Lead Health Formula Simulator */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
                      <div>
                        <span className="text-xs font-semibold tracking-wider font-mono text-indigo-500 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 font-bold uppercase tracking-wider">
                          Interactive Simulator
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">
                          🚦 Lead Health & SLA Priority Calculator
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Test how the Airtable formula rates incoming prospects based on enrichment attributes and response speed.
                        </p>
                      </div>
                      
                      {/* Score representation */}
                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-xs shrink-0 w-full md:w-auto">
                        <div className="relative w-16 h-16 flex items-center justify-center bg-slate-100 border border-slate-200 rounded-full text-lg font-black shrink-0">
                          <span className="text-slate-900">{Math.min(100, Math.max(0, 
                            (simCompanySize === "1-10" ? 10 : simCompanySize === "11-50" ? 25 : simCompanySize === "51-200" ? 50 : 30) + 
                            (simTechStack === "complete-match" ? 30 : simTechStack === "partial-match" ? 15 : 0) + 
                            (simResponseHours < 1 ? 20 : simResponseHours <= 4 ? 10 : simResponseHours > 24 ? -15 : 0)
                          ))}</span>
                          <span className="text-[9px] text-slate-400 absolute bottom-1.5 font-mono">/100</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold tracking-wider font-mono font-bold uppercase text-slate-400 block tracking-wider">Computed Rating</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                            (() => {
                              const score = Math.min(100, Math.max(0, 
                                (simCompanySize === "1-10" ? 10 : simCompanySize === "11-50" ? 25 : simCompanySize === "51-200" ? 50 : 30) + 
                                (simTechStack === "complete-match" ? 30 : simTechStack === "partial-match" ? 15 : 0) + 
                                (simResponseHours < 1 ? 20 : simResponseHours <= 4 ? 10 : simResponseHours > 24 ? -15 : 0)
                              ));
                              if (score >= 80) return "text-rose-700 bg-rose-50 border-rose-200";
                              if (score >= 55) return "text-indigo-700 bg-indigo-50 border-indigo-200";
                              if (score >= 30) return "text-slate-700 bg-slate-100 border-slate-200";
                              return "text-amber-700 bg-amber-50 border-amber-200";
                            })()
                          }`}>
                            {(() => {
                              const score = Math.min(100, Math.max(0, 
                                (simCompanySize === "1-10" ? 10 : simCompanySize === "11-50" ? 25 : simCompanySize === "51-200" ? 50 : 30) + 
                                (simTechStack === "complete-match" ? 30 : simTechStack === "partial-match" ? 15 : 0) + 
                                (simResponseHours < 1 ? 20 : simResponseHours <= 4 ? 10 : simResponseHours > 24 ? -15 : 0)
                              ));
                              if (score >= 80) return "🔥 CRITICAL HOT LEAD";
                              if (score >= 55) return "⚡ HIGH VALUE TARGET";
                              if (score >= 30) return "🟢 MEDIUM RELEVANCE";
                              return "⚠️ SLA BREACH / LOW PR";
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Input variables */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300 mb-1.5">
                            Company Size Parameter (Headcount)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "1-10 (+10 pts)", val: "1-10" },
                              { label: "11-50 (+25 pts)", val: "11-50" },
                              { label: "51-200 (+50 pts)", val: "51-200" },
                              { label: "200+ (+30 pts)", val: "200+" }
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => setSimCompanySize(opt.val)}
                                className={`text-xs font-semibold py-2 px-3 rounded-lg border text-center transition-all ${
                                  simCompanySize === opt.val
                                    ? "bg-slate-900 border-slate-950 text-white shadow-xs"
                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300 mb-1.5">
                            Technographic Relevance Matching
                          </label>
                          <div className="flex flex-col gap-2">
                            {[
                              { label: "Complete Relevance Match (+30 pts)", val: "complete-match", desc: "CRM identified, uses premium outbound tools, clear tech leverage" },
                              { label: "Partial Relevance Match (+15 pts)", val: "partial-match", desc: "Basic landing page and CMS, standard contact fields" },
                              { label: "No Matching Tech stack (+0 pts)", val: "no-match", desc: "No relevant advertising pixels, missing operational suite" }
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => setSimTechStack(opt.val)}
                                className={`text-left text-xs p-3 rounded-lg border transition-all ${
                                  simTechStack === opt.val
                                    ? "bg-slate-900 border-slate-950 text-white shadow-xs"
                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                <div className="font-bold">{opt.label}</div>
                                <div className={`text-xs font-semibold tracking-wider ${simTechStack === opt.val ? "text-slate-300" : "text-slate-300"} mt-0.5`}>{opt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-semibold font-mono uppercase font-bold text-slate-300">
                              SLA Hours Elapsed Since Submission
                            </label>
                            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {simResponseHours} hr{simResponseHours !== 1 && 's'}
                            </span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="48"
                            step="1"
                            value={simResponseHours}
                            onChange={(e) => setSimResponseHours(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-xs font-semibold tracking-wider text-slate-450 font-mono mt-1">
                            <span>0h (Instant Submission)</span>
                            <span>4h (SLA window)</span>
                            <span>24h (Sale threshold)</span>
                            <span>48h (Stale)</span>
                          </div>
                        </div>
                      </div>

                      {/* Operational feedback & dynamic formula */}
                      <div className="bg-slate-50 rounded-xl border border-slate-250 p-5 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 mb-2">
                            Playbook SLA Response Guideline
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-light">
                            {(() => {
                              const score = Math.min(100, Math.max(0, 
                                (simCompanySize === "1-10" ? 10 : simCompanySize === "11-50" ? 25 : simCompanySize === "51-200" ? 50 : 30) + 
                                (simTechStack === "complete-match" ? 30 : simTechStack === "partial-match" ? 15 : 0) + 
                                (simResponseHours < 1 ? 20 : simResponseHours <= 4 ? 10 : simResponseHours > 24 ? -15 : 0)
                              ));
                              if (score >= 80) return "CRITICAL OUTBOUND ACTION REQUIRED: Assign manual dial to Lead Rep instantly. SLA priority score above 80 triggers Slack emergency pings & automatic custom enrichment feeds.";
                              if (score >= 55) return "HIGH VALUE TARGET PIPELINE: Standard outbound target sequence. Deploy personalized Loom introduction, custom tech-compliance walkthrough, and client calendar slots.";
                              if (score >= 30) return "MEDIUM RELEVANCE SEQUENCING: Basic target profile fit. Enqueue on standard client acquisition sequences with multi-step educational threads over 14 days.";
                              return "SLA TIME EXCEEDED OR ICP MISMATCH: Transfer records to low-frequency email updates and custom newsletter lists to preserve deliverability of your high-ticket servers.";
                            })()}
                          </p>

                          <div className="mt-5 pt-4 border-t border-slate-200">
                            <span className="text-xs font-semibold tracking-wider font-mono text-slate-400 uppercase tracking-widest block font-bold mb-1">
                              Simulated Real-time Point Weights:
                            </span>
                            <ul className="text-xs space-y-2 mt-2">
                              <li className="flex justify-between p-1.5 rounded bg-white">
                                <span className="text-slate-300">Employee Range Weight ({simCompanySize}):</span>
                                <span className="font-mono font-bold text-slate-950">+{simCompanySize === "1-10" ? 10 : simCompanySize === "11-50" ? 25 : simCompanySize === "51-200" ? 50 : 30} pts</span>
                              </li>
                              <li className="flex justify-between p-1.5 rounded bg-white">
                                <span className="text-slate-300">Technology Match Relevance:</span>
                                <span className="font-mono font-bold text-slate-950">+{simTechStack === "complete-match" ? 30 : simTechStack === "partial-match" ? 15 : 0} pts</span>
                              </li>
                              <li className="flex justify-between p-1.5 rounded bg-white">
                                <span className="text-slate-300">SLA Response Velocity Value:</span>
                                <span className="font-mono font-bold text-slate-950">
                                  {simResponseHours < 1 ? "+20" : simResponseHours <= 4 ? "+10" : simResponseHours > 24 ? "-15" : "0"} pts
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200 relative">
                          <span className="text-xs font-semibold tracking-wider font-mono text-indigo-600 font-bold uppercase tracking-wider block mb-2">
                            Master Airtable Formula Code
                          </span>
                          <div className="bg-slate-950 text-indigo-400 p-3 rounded-lg text-xs font-semibold tracking-wider font-mono leading-relaxed overflow-x-auto select-all max-h-36 relative whitespace-pre scrollbar-thin">
{`IF(
  AND({Lead Status} = "Prospect", {Contacted} = FALSE),
  MIN(100, MAX(0,
    IF({Headcount Range} = "1-10", 10, IF({Headcount Range} = "11-50", 25, IF({Headcount Range} = "51-200", 50, 30))) +
    IF({Tech Relevance} = "Complete Match", 30, IF({Tech Relevance} = "Partial Match", 15, 0)) +
    IF({SLA Elapsed Hours} < 1, 20, IF({SLA Elapsed Hours} <= 4, 10, IF({SLA Elapsed Hours} > 24, -15, 0)))
  )),
  BLANK()
)`}
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(`IF(AND({Lead Status} = "Prospect", {Contacted} = FALSE), MIN(100, MAX(0, IF({Headcount Range} = "1-10", 10, IF({Headcount Range} = "11-50", 25, IF({Headcount Range} = "51-200", 50, 30))) + IF({Tech Relevance} = "Complete Match", 30, IF({Tech Relevance} = "Partial Match", 15, 0)) + IF({SLA Elapsed Hours} < 1, 20, IF({SLA Elapsed Hours} <= 4, 10, IF({SLA Elapsed Hours} > 24, -15, 0))))), BLANK())`, "formula-copy")}
                              className="absolute top-2.5 right-2 sm:right-3 p-1.5 bg-slate-800 border border-slate-700/60 rounded text-slate-300 hover:text-white transition-colors"
                              title="Copy Formula to Clipboard"
                            >
                              {copiedTextId === "formula-copy" ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Complete Leads Schema */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
                      🗄️ Primary 'Prospects/Leads' Database Fields Definition
                    </h3>
                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                      This single highly structured clearinghouse table handles automated data validation, webhook parsing, dynamic scoring, and rep task triggers. Use these exact structures inside your Airtable setup:
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-slate-300 font-mono text-xs font-semibold tracking-wider uppercase font-bold">
                            <th className="p-3">Field Name</th>
                            <th className="p-3">Airtable Type</th>
                            <th className="p-3">Description & Blueprint Formulas</th>
                            <th className="p-3">RevOps Enrichment Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            { name: "Record ID", type: "Formula", desc: "RECORD_ID()", source: "Airtable Native (Key)" },
                            { name: "Company Name", type: "Single Line Text", desc: "The legal or commercial entity name of the lead", source: "Make Webhook / Form Ingestion URL" },
                            { name: "Domain Name", type: "URL", desc: "Corporate URL used for tech enrichment lookups", source: "Apollo / Lusha / Organic Form Input" },
                            { name: "Lead Full Name", type: "Single Line Text", desc: "The core decision-maker or key contact's full name", source: "Inbound form or enriched LinkedIn scrapers" },
                            { name: "Lead Email Address", type: "Email", desc: "Valid corporate email address", source: "Cleaned and verified email validator" },
                            { name: "Lead Status", type: "Single Select", desc: "Options: Prospect, Inbound Enrichment, Rep Assigned, Active Nurture, Closed Won, Lost Opportunity", source: "SDR Team / Automation routers" },
                            { name: "Headcount Range", type: "Single Select", desc: "Options: '1-10', '11-50', '51-200', '200+'", source: "Clay / BuiltWith Enrichment lookup" },
                            { name: "Tech Stack Matches", type: "Multiple Select", desc: "Tools detected on corporate domain (e.g. HubSpot, Salesforce, Stripe)", source: "BuiltWith API Webhook lookup" },
                            { name: "Tech Relevance", type: "Single Select", desc: "Options: 'Complete Match', 'Partial Match', 'No Match'", source: "RevOps Scoring system lookup" },
                            { name: "Inquiry Submit Date", type: "Date & Time", desc: "Exact epoch time of initial webhook capture", source: "System Inbound Timestamp" },
                            { name: "SLA Elapsed Hours", type: "Formula", desc: "DATETIME_DIFF(NOW(), {Inquiry Submit Date}, 'hours')", source: "Real-time calculation" },
                            { name: "Contacted Status", type: "Checkbox", desc: "Manual check field flagged true when response emails are routed", source: "Sales Agent manual validation" },
                            { name: "Lead Health Score", type: "Formula", desc: "Outputs numeric (0 - 100) based on scorecard rules listed above", source: "Automated nested IF calculation module" }
                          ].map((field, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3 font-semibold text-slate-900 border-r border-slate-50/50 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {field.name}
                              </td>
                              <td className="p-3 border-r border-slate-50/50">
                                <span className="px-2 py-0.5 rounded bg-slate-150 text-slate-650 font-mono text-xs font-semibold tracking-wider">
                                  {field.type}
                                </span>
                              </td>
                              <td className="p-3 border-r border-slate-50/50 text-slate-600 font-light max-w-sm whitespace-normal">
                                {field.desc}
                              </td>
                              <td className="p-3 font-mono text-xs font-semibold tracking-wider text-slate-550">
                                {field.source}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 3: Pre-configured Premium Views */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
                      📶 High-Value Pre-configured Database Views
                    </h3>
                    <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                      To make a $350 Airtable template look and execute like premium B2B software, you must guide your buyers to structure these specific pre-saved views inside their Airtable space:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          title: "🚦 Kanban Deal Pipeline View",
                          description: "Columns grouped strictly by {Lead Status}. Enables frictionless card drags, providing real-time team feedback. Displays headcount, tech match logos, and SLA status indicators.",
                          rule: "Group: Lead Status (Prospect -> Enrichment -> Rep Assigned -> Won/Lost)"
                        },
                        {
                          title: "⚡ Hot Lead Immediate SLA Queue",
                          description: "A customized grid layout prioritizing hot corporate acquisitions for your SDR reps. Filters out contacted prospects so attention stays focused entirely on the highest closing potential.",
                          rule: "Filters: {Contacted Status} = FALSE AND {Lead Health Score} >= 55. Sorted by {Lead Health Score} DESC."
                        },
                        {
                          title: "🔍 Data Enrichment Validation Grid",
                          description: "Specially designed for manual auditing of automated enrichment pipelines checking API synchronization. Highlighting records missing crucial corporate attributes.",
                          rule: "Filters: {Headcount Range} = BLANK() OR {Tech Stack Matches} = BLANK()."
                        },
                        {
                          title: "🚨 SLA Breach & At-Risk Ledger",
                          description: "An emergency dashboard isolating active inquiries where response limits are violated. Triggers urgent action prompts or automated notification alerts.",
                          rule: "Filters: {SLA Elapsed Hours} > 4 AND {Contacted Status} = FALSE AND {Lead Status} = 'Prospect'."
                        }
                      ].map((view, idx) => (
                        <div key={idx} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                              {view.title}
                            </h4>
                            <p className="text-xs font-semibold text-slate-300 mt-2 leading-relaxed font-light">
                              {view.description}
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-xs font-semibold tracking-wider font-mono">
                            <span className="text-slate-400 font-light">View Config Rule:</span>
                            <span className="text-indigo-600 font-semibold">{view.rule}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Interactive Relational Schema Explorer */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <span className="text-xs font-semibold tracking-wider font-mono text-purple-650 bg-purple-50 px-2.5 py-1 rounded border border-purple-150 font-bold uppercase tracking-wider">
                        Relational Database Architecture
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-2">
                        🔗 Supporting Tables & Cross-Link Schema
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        A raw B2B lead list is a commodity. A connected CRM ecosystem tracking interactions, SDR velocity, and revenue attribution is a $350 operational engine.
                      </p>
                    </div>

                    {/* Table Selectors */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[
                        { id: "analytics", label: "📊 Performance Analytics Dashboard", color: "border-indigo-600 text-indigo-805 bg-indigo-50/60" },
                        { id: "interactions", label: "💬 Interactions & Touchpoints", color: "border-indigo-500 text-indigo-700 bg-indigo-50/50" },
                        { id: "reps", label: "👥 Team / Reps & Routing", color: "border-emerald-500 text-emerald-700 bg-emerald-50/50" },
                        { id: "revenue", label: "💰 Revenue & Attribution", color: "border-rose-500 text-rose-700 bg-rose-50/50" }
                      ].map((tbl) => (
                        <button
                          key={tbl.id}
                          onClick={() => setActiveRelationalDetail(tbl.id as any)}
                          className={`px-4 py-2 hover:scale-[1.01] active:scale-[0.99] text-xs font-mono font-bold border rounded-lg transition-all whitespace-nowrap ${
                            activeRelationalDetail === tbl.id
                              ? `${tbl.color} border-2`
                              : "border-slate-200 text-slate-300 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          {tbl.label}
                        </button>
                      ))}
                    </div>

                    {/* Specific Selected Detail Panel */}
                    {activeRelationalDetail === "analytics" && (
                      <div className="space-y-6 animate-fade-in animate-duration-150">
                        {/* Summary Block */}
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-150 text-left">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                            Table Description: 'Performance Analytics & Reporting Dashboard' (Executive Summary Aggregate)
                          </h4>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-light">
                            Aggregates raw system operational metrics into real-time, founder-ready KPIs. By configuring cross-table rollups, lookup variables, and mathematical ratios across the Leads, Reps, and Revenue logs, you construct an immutable performance dashboard that justifies your premium agency prices.
                          </p>
                        </div>

                        {/* Interactive Executive Metric Grid */}
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block text-left">
                            👑 Live Executive Interface Designer Mockup
                          </span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            
                            {/* KPI 1 */}
                            <div className="p-5 bg-slate-950 text-white rounded-2xl border border-slate-800/80 shadow-md relative overflow-hidden group text-left">
                              <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Avg Speed-To-Lead</span>
                              <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-2xl font-black text-white font-sans tracking-tight">14.2 Mins</span>
                                <span className="text-xs font-semibold tracking-wider text-emerald-400 font-mono font-bold"> Slashed 88%</span>
                              </div>
                              <p className="text-xs font-semibold tracking-wider text-slate-400 font-light mt-1.5">Target Response Window: &lt; 240 mins (4 hours)</p>
                              <div className="absolute top-4 right-4 text-slate-700 group-hover:text-indigo-400 transition-colors">
                                <Clock className="w-4 h-4" />
                              </div>
                            </div>

                            {/* KPI 2 */}
                            <div className="p-5 bg-slate-950 text-white rounded-2xl border border-slate-800/80 shadow-md relative overflow-hidden group text-left">
                              <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">SLA Compliance Rate</span>
                              <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-2xl font-black text-white font-sans tracking-tight">96.4%</span>
                                <span className="text-xs font-semibold tracking-wider text-emerald-400 font-mono font-bold">▲ Target Meta</span>
                              </div>
                              <p className="text-xs font-semibold tracking-wider text-slate-400 font-light mt-1.5">Only 2 critical breaches over 45 total listings</p>
                              <div className="absolute top-4 right-4 text-slate-700 group-hover:text-indigo-400 transition-colors">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                            </div>

                            {/* KPI 3 */}
                            <div className="p-5 bg-slate-950 text-white rounded-2xl border border-slate-800/80 shadow-md relative overflow-hidden group text-left">
                              <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Conversion Funnel Yield</span>
                              <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-2xl font-black text-white font-sans tracking-tight">28.4% ➔ 42.1%</span>
                              </div>
                              <p className="text-xs font-semibold tracking-wider text-slate-400 font-light mt-1.5">Inbound-to-Scheduled | Booked-to-Won Ratio</p>
                              <div className="absolute top-4 right-4 text-slate-700 group-hover:text-indigo-400 transition-colors">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>

                            {/* KPI 4 */}
                            <div className="p-5 bg-slate-950 text-white rounded-2xl border border-slate-800/80 shadow-md relative overflow-hidden group text-left">
                              <span className="text-[9px] font-mono text-rose-455 font-bold uppercase tracking-wider block">Pipeline Asset Mapping</span>
                              <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-2xl font-black text-white font-sans tracking-tight">$412,500</span>
                                <span className="text-xs font-semibold tracking-wider text-emerald-400 font-mono font-bold"> $182K Won</span>
                              </div>
                              <p className="text-xs font-semibold tracking-wider text-slate-400 font-light mt-1.5">Calculated as dynamic weighted contract scopes</p>
                              <div className="absolute top-4 right-4 text-slate-700 group-hover:text-indigo-400 transition-colors">
                                <DollarSign className="w-4 h-4" />
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Relational Schema Fields List */}
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block text-left">
                            📋 Dashboard Relational Schema & Rollup Formulas
                          </span>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 bg-slate-50 text-slate-300 font-mono text-xs font-semibold tracking-wider uppercase font-bold">
                                  <th className="p-2.5">KPI Reporting Field</th>
                                  <th className="p-2.5">Airtable Field Type</th>
                                  <th className="p-2.5 font-bold text-indigo-650">Required Rollup Configurations & Math Formulas</th>
                                  <th className="p-2.5">Purpose on Dashboard</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                
                                <tr className="hover:bg-slate-50/40 transition-colors text-left">
                                  <td className="p-2.5 font-semibold text-slate-900">Reporting Month ID</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Single Line Text (Key)</span></td>
                                  <td className="p-2.5 text-slate-300 italic">E.g., "MONTH - May 2026"</td>
                                  <td className="p-2.5 text-slate-550 font-light">Sets the temporal scope for rollup filters</td>
                                </tr>

                                <tr className="hover:bg-slate-50/40 transition-colors text-left">
                                  <td className="p-2.5 font-semibold text-slate-900">Leads Connection</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-805 border border-indigo-105 font-mono text-xs font-semibold tracking-wider">Linked Record</span></td>
                                  <td className="p-2.5 font-semibold text-slate-900">Link to: 'Leads' (One-to-Many Link)</td>
                                  <td className="p-2.5 text-slate-550 font-light">Draws in all prospective submissions registered for the target month</td>
                                </tr>

                                <tr className="hover:bg-slate-50/40 transition-colors text-left">
                                  <td className="p-2.5 font-semibold text-slate-900">Average Speed-to-Lead</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Rollup</span></td>
                                  <td className="p-2.5 font-mono text-indigo-600 text-xs font-semibold tracking-wider">
                                    <div className="font-bold text-slate-800">Target: {`{Leads}`} ➔ Field: {`{First Touch Speed (Mins)}`}</div>
                                    <div className="bg-slate-50 border p-1 rounded mt-1 text-slate-700 whitespace-pre">AVERAGE(values)</div>
                                  </td>
                                  <td className="p-2.5 text-slate-550 font-light">Calculates overall speed response; first touch timestamp minus submission date</td>
                                </tr>

                                <tr className="hover:bg-slate-50/40 transition-colors text-left">
                                  <td className="p-2.5 font-semibold text-slate-900">SLA Compliance Rate</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Rollup</span></td>
                                  <td className="p-2.5 font-mono text-indigo-600 text-xs font-semibold tracking-wider">
                                    <div className="font-bold text-slate-800">Target: {`{Leads}`} ➔ Field: {`{Inside 4h SLA Check}`}</div>
                                    <div className="bg-slate-50 border p-1 rounded mt-1 text-slate-700 whitespace-pre">SUM(values) / COUNTA(values)</div>
                                  </td>
                                  <td className="p-2.5 text-slate-550 font-light font-sans text-xs">Exposes the percentage of prospects contacted within the 4-hour limit</td>
                                </tr>

                                <tr className="hover:bg-slate-50/40 transition-colors text-left">
                                  <td className="p-2.5 font-semibold text-slate-900">Inbound to Meeting Rate</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-105 font-mono text-xs font-semibold tracking-wider">Rollup</span></td>
                                  <td className="p-2.5 font-mono text-indigo-600 text-xs font-semibold tracking-wider">
                                    <div className="font-bold text-slate-800">Target: {`{Leads}`} ➔ Field: {`{Booking Registered Flag}`}</div>
                                    <div className="bg-slate-50 border p-1 rounded mt-1 text-slate-700 whitespace-pre">SUM(values) / COUNTA(values)</div>
                                  </td>
                                  <td className="p-2.5 text-slate-55o text-xs font-semibold font-sans font-light">Measures how many cold lead submissions successfully log a booking call</td>
                                </tr>

                                <tr className="hover:bg-slate-50/40 transition-colors text-left">
                                  <td className="p-2.5 font-semibold text-slate-900">Booking to Won Rate</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Rollup</span></td>
                                  <td className="p-2.5 font-mono text-indigo-600 text-xs font-semibold tracking-wider">
                                    <div className="font-bold text-slate-800">Target: {`{Leads}`} ➔ Field: {`{Closed Won Confirmation}`}</div>
                                    <div className="bg-slate-50 border p-1 rounded mt-1 text-slate-700 whitespace-pre">SUM(values) / SUMMARY_COUNT_FILTERED(values)</div>
                                  </td>
                                  <td className="p-2.5 text-slate-550 font-light font-sans">Measures closing yield; actual signed contracts versus total booked sessions</td>
                                </tr>

                                <tr className="hover:bg-slate-50/40 transition-colors text-left">
                                  <td className="p-2.5 font-semibold text-slate-900">Total Opportunity Pipeline</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Rollup</span></td>
                                  <td className="p-2.5 font-mono text-indigo-600 text-xs font-semibold tracking-wider">
                                    <div className="font-bold text-slate-800">Target: {`{Leads}`} ➔ Field: {`{Inbound Estimated Budget}`}</div>
                                    <div className="bg-slate-50 border p-1 rounded mt-1 text-slate-700 whitespace-pre">SUM(values)</div>
                                  </td>
                                  <td className="p-2.5 text-slate-550 font-light font-sans">Aggregates prospective financial deals active across all pipeline stages</td>
                                </tr>

                                <tr className="hover:bg-slate-50/40 transition-colors text-left">
                                  <td className="p-2.5 font-semibold text-slate-900">Total Realized Revenue</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Rollup</span></td>
                                  <td className="p-2.5 font-mono text-indigo-600 text-xs font-semibold tracking-wider">
                                    <div className="font-bold text-slate-800">Target: {`{Leads}`} ➔ Field: {`{Total Sales Lifetime Value}`}</div>
                                    <div className="bg-slate-50 border p-1 rounded mt-1 text-slate-700 whitespace-pre">SUM(values)</div>
                                  </td>
                                  <td className="p-2.5 text-slate-550 font-light font-sans">Calculates real cash-won bank balances mapped directly from your Stripe files</td>
                                </tr>

                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Airtable Interface designer architecture guide */}
                        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-slate-150 text-left">
                          <h4 className="text-white font-bold text-xs font-sans flex items-center gap-1.5">
                            👑 Airtable Interface Designer: Premium Visual Configuration
                          </h4>
                          <p className="text-xs font-semibold text-slate-400 font-light mt-1">
                            Do not settle for default grids. Share these exact interface configuration steps with high-ticket buyers to lay out an elite performance command cockpit inside Airtable:
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-sans text-xs">
                            <div className="space-y-2.5">
                              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                                <span className="font-mono text-[9px] font-black branding-chip px-1.5 py-0.5 rounded border border-indigo-500 bg-indigo-500/15 text-indigo-305 block w-max uppercase mb-1.5">
                                  01 &bull; Executive Filter Panel
                                </span>
                                <p className="text-slate-300 leading-relaxed font-light">
                                  Place a responsive <strong>Filter Component</strong> horizontally across the interface header. Wire it to target your global Month ID field. This lets executives slice whole-dashboard statistics by month, sales representative assigned, or original paid campaign.
                                </p>
                              </div>
                              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                                <span className="font-mono text-[9px] font-black branding-chip px-1.5 py-0.5 rounded border border-emerald-500 bg-emerald-500/15 text-emerald-305 block w-max uppercase mb-1.5">
                                  02 &bull; Visual KPI Number Grid
                                </span>
                                <p className="text-slate-300 leading-relaxed font-light">
                                  Lay out your rollup metrics using Airtable's <strong>Number Elements</strong>. Customize with soft colored circles (emerald for compliance, indigo for Speed-To-Lead) and dynamic range checks (e.g., color warning red if compliance drops below 90%).
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                                <span className="font-mono text-[9px] font-black branding-chip px-1.5 py-0.5 rounded border border-rose-500 bg-rose-500/15 text-rose-300 block w-max uppercase mb-1.5">
                                  03 &bull; Dynamic Funnel Chart Layout
                                </span>
                                <p className="text-slate-300 leading-relaxed font-light">
                                  Drag a <strong>Bar Chart or Custom Funnel Component</strong> onto the interface canvas. Set category X-axis to {`{Lead Status}`} and Y-axis to aggregates. This renders real-time client flows and shows deal allocations relative to rep loads.
                                </p>
                              </div>
                              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                                <span className="font-mono text-[9px] font-black branding-chip px-1.5 py-0.5 rounded border border-amber-500 bg-amber-500/15 text-amber-305 block w-max uppercase mb-1.5">
                                  04 &bull; Rep SLA & Booking Leaderboard
                                </span>
                                <p className="text-slate-300 leading-relaxed font-light">
                                  Place an <strong>Interface Grid List</strong> grouped by representative on the bottom drawer. Sorting by closed contracts and average speed response allows managers to immediately spot underperforming active rep lines.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {activeRelationalDetail === "interactions" && (
                      <div className="space-y-4 animate-fade-in animate-duration-150">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-150">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                            Table Description: 'Interactions & Touchpoints' (One-to-Many)
                          </h4>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-light">
                            Logs every single outreach attempt, Loom presentation, call, or Slack alert related to a lead. Integrates directly via Apollo/Smartlead webhooks or SDR manual entries, preventing critical sales SLA drop-offs and maintaining complete audit trails.
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50 text-slate-300 font-mono text-xs font-semibold tracking-wider uppercase font-bold">
                                <th className="p-2.5">Field Name</th>
                                <th className="p-2.5">Airtable Type</th>
                                <th className="p-2.5 font-bold text-indigo-600">Cross-Link relation (Exact configuration)</th>
                                <th className="p-2.5">Source / Purpose</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Interaction ID</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Formula</span></td>
                                <td className="p-2.5 font-mono text-indigo-500 text-xs font-semibold tracking-wider">CONCATENATE({`{Type}`}, " - ", DATETIME_FORMAT({`{Log Date}`}, 'MM/DD/YY'))</td>
                                <td className="p-2.5 text-slate-550">Autogenerated distinctive database primary record key</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Lead Registry</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-105 font-mono text-xs font-semibold tracking-wider">Linked Record</span></td>
                                <td className="p-2.5 font-semibold text-slate-900">Link to: 'Leads' (Many-to-One)</td>
                                <td className="p-2.5 text-slate-550">Resolves exact corporate record being targeted</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Interaction Type</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Single Select</span></td>
                                <td className="p-2.5 text-slate-300">Options: Outbound Email, LinkedIn Touch, Intro Loom, Discovery Call, SLA Emergency Alert</td>
                                <td className="p-2.5 text-slate-550 font-light">Determines step inside the client acquisition flow</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Log Date</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Date & Time</span></td>
                                <td className="p-2.5 text-slate-400">Defaults to CREATED_TIME()</td>
                                <td className="p-2.5 text-slate-550">Captures response speed and timestamp parameters</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">SDR Owner Link</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-100 font-mono text-xs font-semibold tracking-wider">Linked Record</span></td>
                                <td className="p-2.5 font-semibold text-slate-900">Link to: 'Team/Reps' (Many-to-One)</td>
                                <td className="p-2.5 text-slate-550 font-sans font-light text-xs">Assigns attribution for manual emails or phone tasks</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Log Notes</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Long Text</span></td>
                                <td className="p-2.5 text-slate-400">N/A</td>
                                <td className="p-2.5 text-slate-555 font-light">Stores sequence emails, links to custom Loom assets, or call summaries</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 font-mono text-xs font-semibold text-indigo-950 space-y-1">
                          <span className="font-bold text-xs uppercase block text-indigo-900 mb-2">🔄 Rollups triggered on parent 'Leads' table:</span>
                          <div>• <span className="font-bold">Total Attempts</span>: Rollup on <span className="text-indigo-600">Interactions</span> with type: <span className="px-1.5 py-0.5 bg-indigo-100 rounded font-semibold">COUNTA(Type)</span>. Keeps SDR volume fully visible.</div>
                          <div>• <span className="font-bold">Last Dynamic Contact Date</span>: Rollup with type: <span className="px-1.5 py-0.5 bg-indigo-100 rounded font-semibold">MAX(Log Date)</span>. Keeps the pipeline current and SLA alarms aligned.</div>
                        </div>
                      </div>
                    )}

                    {activeRelationalDetail === "reps" && (
                      <div className="space-y-4 animate-fade-in animate-duration-150">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-150">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            Table Description: 'Team/Reps' & Automated Routing
                          </h4>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-light">
                            Represents your internal SDR and Account Executive sales roster. Connects to automatic load counters to feed the round-robin distribution formula, maintaining exact work balance and preventing leads from turning cold.
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50 text-slate-300 font-mono text-xs font-semibold tracking-wider uppercase font-bold">
                                <th className="p-2.5">Field Name</th>
                                <th className="p-2.5">Airtable Type</th>
                                <th className="p-2.5 font-bold text-emerald-600">Cross-Link relation (Exact configuration)</th>
                                <th className="p-2.5">Source / Purpose</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Rep Name</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Single Line Text</span></td>
                                <td className="p-2.5 text-slate-400">Primary Key</td>
                                <td className="p-2.5 text-slate-550 font-light">SDR or Account Executive full identity</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Rep Status</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Single Select</span></td>
                                <td className="p-2.5 text-slate-300">Options: Active & Accepting Leads, On Break, Offline</td>
                                <td className="p-2.5 text-slate-550">Used as routing filters in Zapier / Make.com distribution rules</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Assigned Inbound Leads</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 font-mono text-xs font-semibold tracking-wider">Linked Record</span></td>
                                <td className="p-2.5 font-semibold text-slate-900">Link to: 'Leads' (One-to-Many backlink)</td>
                                <td className="p-2.5 text-slate-550 font-light">Collection of prospects handled by this sales advisor</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Won Opportunities Registry</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-80 border border-emerald-100 font-mono text-xs font-semibold tracking-wider">Linked Record</span></td>
                                <td className="p-2.5 font-semibold text-slate-900">Link to: 'Revenue & Attribution' (One-to-Many)</td>
                                <td className="p-2.5 text-slate-555 font-light animate-fade-in bg-slate-50/10">Direct closed-won deal contracts credited to this rep</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Conversion Rate</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Formula</span></td>
                                <td className="p-2.5 font-mono text-emerald-600 text-xs font-semibold tracking-wider">{`{Total Won Deals Rollup} / {Total Opportunities Assigned Rollup}`}</td>
                                <td className="p-2.5 text-slate-550">Displays individual rep converting yield metrics</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 font-mono text-xs font-semibold text-emerald-950 space-y-1">
                          <span className="font-bold text-xs uppercase block text-emerald-900 mb-2">🔄 Rollups triggered on this 'Team/Reps' table:</span>
                          <div>• <span className="font-bold">Total Opportunities Assigned Rollup</span>: Rollup on <span className="text-emerald-600">Assigned Inbound Leads</span> with type: <span className="px-1.5 py-0.5 bg-emerald-100 rounded font-semibold font-mono">COUNTA(Record ID)</span>. Tracks overall workload.</div>
                          <div>• <span className="font-bold">Total Won Deals Rollup</span>: Rollup on <span className="text-emerald-600">Won Opportunities Registry</span> with type: <span className="px-1.5 py-0.5 bg-emerald-100 rounded font-semibold font-mono">COUNTA(Deal Contract ID)</span>. Measures closed deal volume.</div>
                          <div>• <span className="font-bold">Contract Value Generated</span>: Rollup on <span className="text-emerald-600">Won Opportunities Registry</span> with type: <span className="px-1.5 py-0.5 bg-emerald-100 rounded font-semibold font-mono font-bold">SUM(Contract Value)</span>. Evaluates financial efficacy of the rep.</div>
                        </div>
                      </div>
                    )}

                    {activeRelationalDetail === "revenue" && (
                      <div className="space-y-4 animate-fade-in animate-duration-150">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-150">
                          <h4 className="text-xs font-bold text-slate-90 & flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                            Table Description: 'Revenue & Attribution Ledger'
                          </h4>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-light">
                            Tracks every closed contract, dollar value, payment model, and origin source (UTM channel/Ad campaign). Auto-calculates accurate client acquisition cost metrics and provides immediate business health insights.
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50 text-slate-300 font-mono text-xs font-semibold tracking-wider uppercase font-bold">
                                <th className="p-2.5">Field Name</th>
                                <th className="p-2.5">Airtable Type</th>
                                <th className="p-2.5 font-bold text-rose-600">Cross-Link relation (Exact configuration)</th>
                                <th className="p-2.5">Source / Purpose</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Deal Contract ID</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-105 font-mono text-xs font-semibold tracking-wider">Formula</span></td>
                                <td className="p-2.5 font-mono text-rose-500 text-xs font-semibold tracking-wider">CONCATENATE("DEAL - ", {`{Company Lookup}`}, " [$", {`{Contract Value}`}, " - ", {`{Pricing Tier}`} , "]")</td>
                                <td className="p-2.5 text-slate-550">Legal transaction code primary key Signature</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Lead Record ID</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-100 font-mono text-xs font-semibold tracking-wider">Linked Record</span></td>
                                <td className="p-2.5 font-semibold text-slate-900">Link to: 'Leads' (One-to-One / Many-to-One)</td>
                                <td className="p-2.5 text-slate-550">Anchors the transaction back to the validated lead registry</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Contract Value</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Currency</span></td>
                                <td className="p-2.5 text-slate-400">Precision: $1.00</td>
                                <td className="p-2.5 text-slate-550">Financial value of this specific conversion deal</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Pricing Tier</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Single Select</span></td>
                                <td className="p-2.5 text-slate-300">Options: Base Asset ($350), High-Ticket custom ($3,500), Annual Enterprise Retention ($10,000+)</td>
                                <td className="p-2.5 text-slate-550">Differentiates product margins and upsell successes</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">SDR Credited Representative</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-100 font-mono text-xs font-semibold tracking-wider">Linked Record</span></td>
                                <td className="p-2.5 font-semibold text-slate-900">Link to: 'Team/Reps' (Many-to-One)</td>
                                <td className="p-2.5 text-slate-550">Tracks rep commission splits and close efficacy values</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-2.5 font-semibold text-slate-900">Origin Attribution Source</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold tracking-wider">Single Line Text</span></td>
                                <td className="p-2.5 text-slate-400">Linked to UTM campaign parameters</td>
                                <td className="p-2.5 text-slate-550">Direct marketing attribution (e.g. LinkedIn Mailout, cold sequence #2, VSL Video embed)</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-rose-50/50 border border-rose-105 rounded-lg p-4 font-mono text-xs font-semibold text-rose-950 space-y-1">
                          <span className="font-bold text-xs uppercase block text-rose-900 mb-2">🔄 Rollups triggered on 'Leads' (to display total transactional life-value):</span>
                          <div>• <span className="font-bold">Total Sales Lifetime Value</span>: Rollup on <span className="text-rose-600">Client Revenue Ledger</span> with type: <span className="px-1.5 py-0.5 bg-rose-100 rounded font-semibold font-mono">SUM(Contract Value)</span>. Immediately presents total lifetime value of each enterprise client.</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 5: Real-time Database Routing & Workload Simulator */}
                  <div className="bg-slate-900 text-slate-100 border border-slate-950 rounded-xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-6 gap-4">
                      <div>
                        <span className="text-xs font-semibold tracking-wider font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 font-bold uppercase tracking-wider">
                          RevOps Automated Performance Engine
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">
                          👥 Automatic Round-Robin Routing & Rollup Simulator
                        </h3>
                        <p className="text-xs text-slate-350 mt-1 font-light">
                          Simulate how incoming enriched leads are routed to agents based on real-time RevOps workload parameters.
                        </p>
                      </div>
                      
                      <div className="mt-4 md:mt-0 flex gap-2 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={handleRouteLead}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-semibold min-h-[44px] font-bold font-mono px-5 py-3 min-h-[44px] rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] w-full justify-center md:w-auto shrink-0 cursor-pointer"
                        >
                          ⚡ Route Inbound Lead
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Interactive incoming lead payload */}
                      <div className="bg-slate-955 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold tracking-wider font-mono text-slate-400 uppercase tracking-widest block font-bold mb-3">
                            📥 Incoming Lead Payload (Make.com Automation)
                          </span>
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-semibold tracking-wider text-slate-400 font-mono">Company Name:</div>
                              <div className="text-xs font-bold text-white font-mono">{simulatedIncomingLead.company}</div>
                            </div>
                            <div className="flex justify-between gap-4">
                              <div>
                                <div className="text-xs font-semibold tracking-wider text-slate-400 font-mono">Size Fit:</div>
                                <div className="text-xs font-bold text-white font-mono">{simulatedIncomingLead.size} headcount</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold tracking-wider text-slate-400 font-mono">Tech Stack:</div>
                                <div className="text-xs font-bold text-white font-mono">{simulatedIncomingLead.tech}</div>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold tracking-wider text-slate-400 font-mono font-medium">Estimated Contract:</div>
                              <div className="text-xs font-bold text-emerald-400 font-mono">${simulatedIncomingLead.value.toLocaleString()} USD</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800">
                          <span className="text-xs font-semibold tracking-wider font-mono text-indigo-400 font-bold block mb-1">
                            Airtable Routing Rules Applied:
                          </span>
                          <p className="text-xs font-semibold tracking-wider text-slate-400 leading-relaxed font-light">
                            Filters reps with status = <strong>"Active"</strong>, selects the matching record with the lowest lead count, and triggers an instant Slack alert with the custom email copywriting script.
                          </p>
                        </div>
                      </div>

                      {/* Reps dynamic list showing live work allocation rollups */}
                      <div className="md:col-span-2 space-y-3">
                        <span className="text-xs font-semibold tracking-wider font-mono text-slate-400 uppercase tracking-widest block font-bold">
                          📈 Live SDR Rep Workloads & Rolled Up Revenue Metrics
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {sdrReps.map((rep) => {
                            const conversionRate = rep.assignedLeads > 0 
                              ? Math.round((rep.closedWon / rep.assignedLeads) * 100) 
                              : 0;
                            return (
                              <div 
                                key={rep.id} 
                                className={`border p-4 rounded-xl transition-all ${
                                  rep.status === "On Break" 
                                    ? "bg-slate-900 border-slate-800 text-slate-300 opacity-60"
                                    : "bg-slate-950 border-slate-800 text-slate-105 hover:border-slate-700 hover:bg-slate-950/90"
                                }`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-white flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${rep.status === "On Break" ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
                                    {rep.name}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold uppercase bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                    {rep.status === "On Break" ? "Offline" : "Accepting Leads"}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-left mt-3 pt-2 border-t border-slate-900 font-mono">
                                  <div>
                                    <span className="text-[8px] text-slate-300 uppercase block leading-none">Load Volume:</span>
                                    <span className="text-xs font-semibold font-bold text-white">{rep.assignedLeads} Assigned</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-300 uppercase block leading-none">Yield Conversion:</span>
                                    <span className="text-xs font-semibold font-bold text-emerald-400">{conversionRate}% Close</span>
                                  </div>
                                  <div className="col-span-2 mt-1">
                                    <span className="text-[8px] text-slate-300 uppercase block leading-none">Rolled Up Value (SUM Rollup):</span>
                                    <span className="text-xs font-bold text-indigo-400">${rep.totalRevenue.toLocaleString()} USD</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Simulation Routing Logs Console */}
                    <div className="mt-5 pt-4 border-t border-slate-800">
                      <span className="text-xs font-semibold tracking-wider font-mono text-emerald-400 uppercase tracking-widest block font-bold mb-2">
                        💻 Real-time Automation Console Logs:
                      </span>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-semibold tracking-wider font-mono space-y-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                        {routingLogs.map((log, idx) => (
                          <div key={idx} className="flex gap-2 text-slate-300 line-clamp-1">
                            <span className="text-indigo-400 shrink-0">►</span>
                            <span className="font-light">{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Relational Database Architecture Diagram */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
                      🗺️ Absolute Ecosystem Data Flow Topology
                    </h3>
                    <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                      This simplified relational mapping blueprints exactly how database inputs, rollups, and primary keys connect bidirectionally across the tables:
                    </p>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 relative overflow-hidden font-mono text-xs font-semibold">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-center shadow-xs">
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase block mb-2 font-mono">TABLE 1: LEADS</span>
                          <div className="text-slate-900 font-bold mb-1 font-sans">Company Profile</div>
                          <div className="text-xs font-semibold tracking-wider text-slate-400 font-sm">Primary ICP Registry with computed Health Scores</div>
                          <div className="text-[9px] text-slate-300 border-t border-slate-100 mt-2 pt-2">
                            Key: Record ID
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center text-slate-400 py-2">
                          <div className="hidden md:block text-slate-300 font-bold">◄ One-to-Many ►</div>
                          <div className="md:hidden text-slate-300 font-bold font-sans">▲ One-to-Many ▼</div>
                          <div className="text-[9px] text-slate-400 mt-1 text-center font-sans">Linked on Record ID</div>
                        </div>

                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-center shadow-xs">
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase block mb-2">TABLE 2: TEAM / REPS</span>
                          <div className="text-slate-900 font-bold mb-1 font-sans">Sales Roster</div>
                          <div className="text-xs font-semibold tracking-wider text-slate-400">Workload, round-robin ranks, and aggregate performance</div>
                          <div className="text-[9px] text-slate-300 border-t border-slate-100 mt-2 pt-2">
                            Key: Rep Name
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-center shadow-xs">
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase block mb-2">TABLE 3: REVENUE</span>
                          <div className="text-slate-900 font-bold mb-1 font-sans">Ledger Deals</div>
                          <div className="text-xs font-semibold tracking-wider text-slate-400 font-sans font-light">Attributing closed contracts to source channels</div>
                          <div className="text-[9px] text-slate-300 border-t border-slate-100 mt-2 pt-2">
                            SUM Rollups triggered
                          </div>
                        </div>

                      </div>

                      <div className="bg-slate-250/20 p-3 rounded-lg border border-slate-350/20 text-xs font-semibold tracking-wider text-slate-300 leading-relaxed font-sans font-light mt-5">
                        💡 <strong>RevOps Professional Pro-Tip:</strong> Set the link directionality of your <strong>Touchpoints Table</strong> so that SDR agents can see the complete outreach trajectory inside the side-card of the main Leads workspace. This avoids dashboard tab clutter and boosts overall close speeds.
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "integrations" && (
                <div className="space-y-6">
                  {/* Strategic Value Proposition Intro */}
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex gap-4 items-start">
                      <div className="p-3 bg-amber-100/80 text-amber-800 rounded-lg shrink-0 border border-amber-200">
                        <Zap className="w-6 h-6 text-amber-600 animate-pulse" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold tracking-wider font-mono tracking-widest font-bold text-amber-800 bg-amber-100/80 border border-amber-200 uppercase px-2.5 py-1 rounded">
                          RevOps High-Value Automation Blueprints
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2.5">
                          ⚡ Converting {pricePoint || "$350"} Assets into {upsellPricePoint || "$3,500"} Setup Services
                        </h3>
                        <p className="text-xs text-slate-650 leading-relaxed mt-1.5 font-light">
                          A high-converting B2B CRM is <strong>defined by its plumbing</strong>, not just its tables. By demonstrating the exact webhook triggers, enrichment search protocols, and response timers below, you provide a clear roadmap for buyers who would rather pay your <strong>Custom Setup Service ({upsellPricePoint || "$3,500"}+)</strong> than spend dozens of manual hours configuring this logic flow themselves.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Scenario Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveScenario("ingestion")}
                      className={`py-3 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        activeScenario === "ingestion"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                          : "text-slate-300 hover:text-slate-650"
                      }`}
                    >
                      <Workflow className="w-4 h-4 text-indigo-500" />
                      <span>1. Inbound Ingestion & Enrichment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveScenario("sla")}
                      className={`py-3 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        activeScenario === "sla"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                          : "text-slate-300 hover:text-slate-650"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span>2. SLA Breach Alerts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveScenario("daily_snapshot")}
                      className={`py-3 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        activeScenario === "daily_snapshot"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                          : "text-slate-300 hover:text-slate-650"
                      }`}
                    >
                      <ClipboardList className="w-4 h-4 text-emerald-500" />
                      <span>3. Daily Performance Snapshots</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveScenario("roi_trigger")}
                      className={`py-3 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        activeScenario === "roi_trigger"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                          : "text-slate-300 hover:text-slate-650"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      <span>4. Closed-Won ROI Trigger</span>
                    </button>
                  </div>

                  {/* Scenario 1: Inbound Enrichment */}
                  {activeScenario === "ingestion" && (
                    <div className="space-y-6">
                      
                      {/* Step Visualizer */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-left">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                          🔗 Interactive Scenario Flow Visualizer
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch pt-2">
                          {[
                            { step: "Trigger", title: "Instant Webhook", desc: "Form Submit (Framer/Apollo)", badge: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
                            { step: "Step 02", title: "API Lookup", desc: "Clearbit/BuiltWith Enrichment", badge: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                            { step: "Step 03", title: "Audit Search", desc: "Find Existing Lead in Airtable", badge: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                            { step: "Step 04", title: "Route / Filter", desc: "Check Client Exists Router", badge: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                            { step: "Step 05", title: "Write Back", desc: "Insert or Update Airtable Record", badge: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
                          ].map((nd, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between text-center relative hover:scale-[1.01] transition-transform">
                              {idx < 4 && (
                                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border border-slate-200 z-15 text-slate-400">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-block mb-3 ${nd.badge}`}>
                                  {nd.step}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                  {nd.title}
                                </h5>
                                <p className="text-xs font-semibold tracking-wider text-slate-405 mt-1.5 leading-snug font-light">
                                  {nd.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical Detail Cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Technical Blueprint Guide (8 cols) */}
                        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 text-left">
                          <div>
                            <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase border border-indigo-150">
                              Module Configuration Specs
                            </span>
                            <h4 className="text-base font-bold text-slate-900 mt-2">
                              🛠️ Trigger-to-Action Blueprint & API Mapping
                            </h4>
                          </div>

                          <div className="space-y-4 text-xs text-slate-650 leading-relaxed">
                            
                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
                                TRIGGER: Custom Webhook Listener (Make.com Custom Webhook)
                              </div>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Trigger Module:</strong> Webhook {"->"} Custom Webhook (triggered instantly when payload arrives).</li>
                                <li><strong>Input Payload Fields (Expected):</strong> <span className="font-mono bg-slate-150 px-1 py-0.5 rounded text-xs font-semibold tracking-wider">email</span> (String), <span className="font-mono bg-slate-150 px-1 py-0.5 rounded text-xs font-semibold tracking-wider">fullName</span> (String), <span className="font-mono bg-slate-150 px-1 py-0.5 rounded text-xs font-semibold tracking-wider">company</span> (String), <span className="font-mono bg-slate-150 px-1 py-0.5 rounded text-xs font-semibold tracking-wider">message</span> (String).</li>
                                <li><strong>Webhook URL Integration:</strong> Provide the webhook URI to client webform endpoints (such as Framer native form webhook, Elementor forms, or Typeform webhook integration) to trigger the Make flow.</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">2</span>
                                ACTION: API Enrichment Lookup (Clearbit, Clay, or Apollo)
                              </div>
                              <p className="font-light text-slate-600">
                                Feed the inbound corporate email or domain name into the enrichment service to fetch crucial firmographic attributes.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-650">
                                <li><strong>Endpoint:</strong> <span className="font-mono text-indigo-500 bg-slate-100 px-1 py-0.5 rounded text-xs font-semibold tracking-wider">POST https://api.apollo.io/v1/people/match</span> (or relevant clay endpoint)</li>
                                <li><strong>Headers:</strong> Mapped with authentication Bearer token and Content-Type definitions.</li>
                                <li><strong>Body Parameters:</strong> <span className="font-mono text-xs font-semibold tracking-wider">{`{"email": "{{1.email}}", "company_name": "{{1.company}}"}`}</span></li>
                                <li><strong>Key Variables Extracted:</strong> Organization Headcount (<span className="font-mono text-xs font-semibold tracking-wider">{`{{organization_employees}}`}</span>), Corporate Revenue Tier (<span className="font-mono text-xs font-semibold tracking-wider">{`{{organization_estimated_num_employees}}`}</span>), Technologies used (<span className="font-mono text-xs font-semibold tracking-wider">{`{{organization_technological_tags}}`}</span>).</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">3</span>
                                ACTION: Airtable Duplicate Search & Resolution
                              </div>
                              <p className="font-light text-slate-600">
                                Checks whether the incoming lead already exists in your active Airtable CRM to avoid rep-assignment conflicts or double outreaches.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-655">
                                <li><strong>Target Table:</strong> 'Leads'</li>
                                <li><strong>Formula Filter Rule:</strong> <span className="font-mono text-xs font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold border border-indigo-150">{"AND({Corporate Email} = '{{1.email}}', {Lead Status} != 'Archived')"}</span></li>
                                <li><strong>Fetch Limits:</strong> Limit records fetched to 1 to save processing bandwidth.</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">4</span>
                                LOGICAL FILTER ROUTER (Scenario Split Logic)
                              </div>
                              <p className="font-light text-slate-600">
                                Set up a conditional Router block in Make.com pointing to two dedicated operational execution paths:
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 pt-1">
                                <div className="p-3.5 bg-white border border-dashed border-slate-200 rounded text-left">
                                  <span className="font-bold text-slate-750 block text-[10.5px] font-mono text-indigo-600">ROUTE A (Match Found)</span>
                                  <p className="text-xs font-semibold tracking-wider text-slate-550 font-light mt-1">
                                    <strong>Filter Condition:</strong> Record ID <em>Exists</em>.<br />
                                    <strong>Action:</strong> Trigger an active update module. Set Lead Status = 'Re-Activated Inbound', append the new contact message to the Touchpoints history, and bump the Last Contact Timer.
                                  </p>
                                </div>
                                <div className="p-3.5 bg-white border border-dashed border-slate-200 rounded text-left">
                                  <span className="font-bold text-slate-750 block text-[10.5px] font-mono text-emerald-600">ROUTE B (No Match)</span>
                                  <p className="text-xs font-semibold tracking-wider text-slate-550 font-light mt-1">
                                    <strong>Filter Condition:</strong> Record ID <em>Does NOT Exist</em>.<br />
                                    <strong>Action:</strong> Trigger an Airtable "Create Record" module. Write all parsed demographic attributes, set Status = 'Prospect', assign to the active Round-Robin Rep, and set {`{SLA Response Countdown}`} = <span className="font-mono">NOW()</span> to initiate the 4-hour countdown.
                                  </p>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Interactive Inbound Payload Board (4 cols) */}
                        <div className="lg:col-span-4 space-y-6 text-left">
                          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-950 shadow-md">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-semibold tracking-wider font-mono text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Sliders className="w-3 h-3" />
                                Form Webhook Payload (JSON)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(
                                  JSON.stringify({
                                    event: "submission",
                                    source: "Framer Lead Form",
                                    timestamp: new Date().toISOString(),
                                    data: {
                                      email: "executive@vortexanalytics.com",
                                      fullName: "Elizabeth Vance",
                                      company: "Vortex Flow Analytics",
                                      message: "Interested in automating our outreach reps pipeline."
                                    }
                                  }, null, 2),
                                  "payload-enrich"
                                )}
                                className="text-xs font-semibold tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono px-2 py-1 rounded select-none cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                {copiedState === "payload-enrich" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy JSON</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-xs font-semibold tracking-wider text-slate-400 leading-relaxed font-light mb-4">
                              Deploy this exact data payload into your web scraper / webhook listener to auto-trigger scenarios:
                            </p>

                            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-semibold tracking-wider font-mono text-emerald-400 border border-slate-800 overflow-x-auto">
{`{
  "event": "submission",
  "source": "Framer Lead Form",
  "data": {
    "email": "executive@vortexanalytics.com",
    "fullName": "Elizabeth Vance",
    "company": "Vortex Flow Analytics",
    "message": "Outreach pipeline"
  }
}`}
                            </pre>

                            <div className="border-t border-slate-850 mt-5 pt-4 font-mono text-xs font-semibold tracking-wider text-slate-400">
                              <div className="text-xs font-semibold tracking-wider font-mono uppercase font-bold text-slate-400">Database Schema Target Mappings:</div>
                              <div className="mt-2.5 space-y-2">
                                <div className="flex justify-between border-b border-slate-950 pb-1.5 leading-none">
                                  <span className="text-slate-300 font-light">Lead Rep Name:</span>
                                  <span className="text-slate-305 font-medium">fullName</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-950 pb-1.5 leading-none">
                                  <span className="text-slate-300 font-light">Lead Company:</span>
                                  <span className="text-slate-305 font-medium">company</span>
                                </div>
                                <div className="flex justify-between leading-none">
                                  <span className="text-slate-300 font-light">Initial Stage:</span>
                                  <span className="text-emerald-400 font-bold font-mono">Default Status</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-150 p-5 rounded-xl space-y-2.5">
                            <h5 className="text-xs font-semibold font-mono font-bold text-indigo-900 uppercase tracking-wide">
                              💡 Strategy Insight for Agency Founders
                            </h5>
                            <p className="text-xs font-semibold text-slate-650 leading-relaxed font-light">
                              Manual B2B data logging leaks critical margins. Demonstrating raw API schemas to buyers proves complete system authority, converting template sales into high-ticket execution retainers with structural onboarding maps.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Scenario 2: SLA Breach alerts */}
                  {activeScenario === "sla" && (
                    <div className="space-y-6">
                      
                      {/* Step Visualizer */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-left">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest font-sans">
                          🚨 SLA Alert Scenario Flow Visualizer
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch pt-2">
                          {[
                            { step: "Trigger", title: "Airtable view Alert", desc: "Monitors 'Prospect SLA Breached' Filtered View", badge: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
                            { step: "Step 02", title: "Get SDR Owner", desc: "Resolves Assigned SDR Team Member Info", badge: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                            { step: "Step 03", title: "Inject copywriting", desc: "Generates custom Slack Rich Blocks payload", badge: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
                            { step: "Step 04", title: "Emergency Slack Notifier", desc: "Dispatches Urgent Ping to Assigned SDR Agent Channel", badge: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                          ].map((nd, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between text-center relative hover:scale-[1.01] transition-transform">
                              {idx < 3 && (
                                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border border-slate-200 z-15 text-slate-400">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-block mb-3 ${nd.badge}`}>
                                  {nd.step}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                  {nd.title}
                                </h5>
                                <p className="text-xs font-semibold tracking-wider text-slate-400 mt-1.5 leading-snug font-light">
                                  {nd.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical Detail Cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Technical Blueprint Guide (8 cols) */}
                        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 text-left">
                          <div>
                            <span className="text-[9px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold uppercase border border-rose-150">
                              Breach Engine Config Specifications
                            </span>
                            <h4 className="text-base font-bold text-slate-900 mt-2">
                              🛠️ Step-by-Step SLA Dispatch Setup
                            </h4>
                          </div>

                          <div className="space-y-4 text-xs text-slate-650 leading-relaxed text-left">
                            
                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-850 flex items-center gap-1.5 font-mono text-slate-900">
                                <span className="bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
                                TRIGGER: Airtable - Watch Records in View (Zapier / Make.com)
                              </div>
                              <p className="font-light text-slate-600 leading-relaxed">
                                Avoid complex server schedulers or scripting timers. Create a dedicated database view inside Airtable named <strong>"🚨 At Risk - SLA Violations"</strong>.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Airtable Trigger View Filters:</strong>
                                  <ul className="list-disc pl-5 mt-1 text-slate-550 text-xs font-semibold">
                                    <li>Filter 1: <span className="font-mono">{`{Contacted Status} = FALSE`}</span></li>
                                    <li>Filter 2: <span className="font-mono">{`{Lead Status} = 'Prospect'`}</span></li>
                                    <li>Filter 3: <span className="font-mono bg-slate-100 px-1 py-0.2 px-1 rounded">{`{SLA Elapsed Hours} > 4.00`}</span></li>
                                  </ul>
                                </li>
                                <li><strong>Scenario Module:</strong> Bind the Make / Zapier module directly to "Watch Records in View". Each time a record breaches and moves into this view, the automation is immediately kicked off.</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">2</span>
                                ACTION: Airtable - Get Record (Assigned SDR Team Lookup)
                              </div>
                              <p className="font-light text-slate-600">
                                Fetches the metadata profile belonging to the assigned company sales manager from the linked <strong>'Team/Reps'</strong> table.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Target Table:</strong> 'Team / Reps'</li>
                                <li><strong>Record ID Target:</strong> <span className="font-mono">{`{{1.SDR_Owner_Link[0]}}`}</span> (the matching row created during round-robin lead allocation).</li>
                                <li><strong>Properties Retrieved:</strong> <span className="font-mono text-xs font-semibold tracking-wider bg-slate-100 px-1">Rep Name</span>, <span className="font-mono text-xs font-semibold tracking-wider bg-slate-100 px-1">Slack User ID</span>, <span className="font-mono text-xs font-semibold tracking-wider bg-slate-100 px-1">Active Status Check</span>.</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">3</span>
                                METHOD: Format Emergency Alert & Embed Agency Copywriting
                              </div>
                              <p className="font-light text-slate-600 font-sans">
                                Automatically formats the alert, retrieving the deterministic production-engineered copywriting message sequence blocks and injecting variables.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Dynamic Copy Mappers:</strong> Swaps out variables like <span className="font-mono text-xs font-semibold tracking-wider bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{`{{1.Company}}`}</span> and <span className="font-mono text-xs font-semibold tracking-wider bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{`{{1.Contact_First_Name}}`}</span>.</li>
                                <li>Ensures the sales agent receives a pre-baked pitch template ready to dispatch.</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">4</span>
                                ACTION: Slack API - Post Message (Block Kit Structure)
                              </div>
                              <p className="font-light text-slate-600">
                                Dispatches a beautiful interactive card straight to Slack, tagging the specific representative user to trigger visual alerts on their workstation.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Receiver User Tag:</strong> Dynamic format <span className="font-mono text-xs font-semibold tracking-wider bg-slate-100 px-1 py-0.5 rounded text-rose-600">{`<@{{2.Slack_User_ID}}>`}</span> alerts the explicit rep.</li>
                                <li><strong>Action Buttons:</strong> Injects interactive Slack action buttons with links to open the Airtable Lead details directly in the browser.</li>
                              </ul>
                            </div>

                          </div>
                        </div>

                        {/* Interactive Slack payload Board (4 cols) */}
                        <div className="lg:col-span-4 space-y-6 text-left">
                          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-950 shadow-md">
                            <div className="flex justify-between items-center mb-4 font-mono text-[10.5px]">
                              <span className="text-xs font-semibold tracking-wider font-mono text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Sliders className="w-3 h-3" />
                                Slack Block Kit Response Payload (JSON)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(
                                  JSON.stringify({
                                    text: "🚨 SLA BREACH AT-RISK LEAD ALERT",
                                    blocks: [
                                      {
                                        type: "header",
                                        text: {
                                          type: "plain_text",
                                          text: "🚨 Under-4hr SLA Breach"
                                        }
                                      },
                                      {
                                        type: "section",
                                        fields: [
                                          { "type": "mrkdwn", "text": "*Company:* Vortex Flow Analytics" },
                                          { "type": "mrkdwn", "text": "*Assigned Rep:* Alex Mercer" },
                                          { "type": "mrkdwn", "text": "*SLA Hours Elapsed:* 4.2 Hours" },
                                          { "type": "mrkdwn", "text": "*ICP Health Score:* 86" }
                                        ]
                                      },
                                      {
                                        type: "actions",
                                        elements: [
                                          {
                                            type: "button",
                                            text: { "type": "plain_text", "text": "⚡ Review in Airtable" },
                                            url: "https://airtable.com"
                                          }
                                        ]
                                      }
                                    ]
                                  }, null, 2),
                                  "payload-slack"
                                )}
                                className="text-xs font-semibold tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono px-2 py-1 rounded select-none cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                {copiedState === "payload-slack" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy JSON</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-xs font-semibold tracking-wider text-slate-400 leading-relaxed font-light mb-4 text-left">
                              This raw payload compiles a perfect interactive Rich notification directly in Slack:
                            </p>

                            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-semibold tracking-wider font-mono text-rose-450 border border-slate-800 overflow-x-auto max-h-56">
{`{
  "text": "🚨 SLA BREACH",
  "blocks": [
    {
      "type": "header",
      "text": {
        "text": "🚨 SLA Breach Warning"
      }
    },
    {
      "type": "section",
      "fields": [
        { "text": "*Company:* Vortex" },
        { "text": "*Rep:* Alex Mercer" },
        { "text": "*Elapsed:* 4.2 Hours" }
      ]
    }
  ]
}`}
                            </pre>

                            <div className="border-t border-slate-850 mt-5 pt-4">
                              <span className="text-xs font-semibold tracking-wider font-mono uppercase font-bold text-slate-400 block mb-1">Slack Channel Endpoint:</span>
                              <p className="text-xs font-semibold tracking-wider text-slate-400 leading-normal font-light">
                                Setup a private channel (e.g. <strong>#sales-sla-alerts</strong>) with Slack incoming webhook permissions to receive these pushes.
                              </p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-150 p-5 rounded-xl space-y-2.5">
                            <h5 className="text-xs font-semibold font-mono font-bold text-rose-900 uppercase tracking-wide">
                              ⚠️ The Enterprise Operational Leak
                            </h5>
                            <p className="text-xs font-semibold text-slate-650 leading-relaxed font-light font-sans">
                              For high-volume growth firms, leads left uncontacted past <strong>4 hours decay in closing capacity by 80%</strong>. This SLA notify engine guarantees perfect rep accountability, serving as an outstanding B2B Ops upgrade pitch to justify your custom retainer.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Scenario 3: Daily Analytics Snapshots */}
                  {activeScenario === "daily_snapshot" && (
                    <div className="space-y-6">
                      
                      {/* Step Visualizer */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-left">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest font-sans">
                          📊 Daily Analytics Ledger Scenario Flow Visualizer (Make.com)
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch pt-2">
                          {[
                            { step: "Trigger", title: "Daily Scheduler", desc: "Fires exact daily snapshot at 11:59 PM (UTC)", badge: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
                            { step: "Step 02", title: "Search Open Leads", desc: "Returns total count of current active prospects", badge: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                            { step: "Step 03", title: "Search SLA status", desc: "Filters down leads with critical breach flags active", badge: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
                            { step: "Step 04", title: "Log Snapshot Log", desc: "Overwrites daily metrics row into Analytics Ledger", badge: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                          ].map((nd, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between text-center relative hover:scale-[1.01] transition-transform">
                              {idx < 3 && (
                                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border border-slate-200 z-15 text-slate-400">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-block mb-3 ${nd.badge}`}>
                                  {nd.step}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 leading-tight font-sans">
                                  {nd.title}
                                </h5>
                                <p className="text-xs font-semibold tracking-wider text-slate-400 mt-1.5 leading-snug font-light">
                                  {nd.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical Detail Cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Technical Blueprint Guide (8 cols) */}
                        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 text-left">
                          <div>
                            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase border border-emerald-150">
                              Performance Snapshot Setup Config
                            </span>
                            <h4 className="text-base font-bold text-slate-900 mt-2">
                              📊 Step-by-Step Daily Performance Analytics Blueprint
                            </h4>
                          </div>

                          <div className="space-y-4 text-xs text-slate-650 leading-relaxed text-left font-sans">
                            
                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-850 flex items-center gap-1.5 font-mono text-slate-900">
                                <span className="bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
                                TRIGGER: Schedule Module (Make.com Timer Clock)
                              </div>
                              <p className="font-light text-slate-600 leading-relaxed">
                                Sets the evaluation timeline for historical trends. Select standard scheduling with the global run interval set to <strong>"Every Day"</strong>.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Target Execution Time:</strong> Set clock value to <span className="font-mono bg-slate-100 px-1 rounded">23:59</span> hours to capture full-day performance.</li>
                                <li><strong>Buffer Mode:</strong> Set execution logs to preserve past historic days to audit discrepancies or sync failures.</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">2</span>
                                ACTION 01 & 02: Airtable Search (Retrieve Open Leads & SLA Breaches)
                              </div>
                              <p className="font-light text-slate-600">
                                Executes dual lookup sweeps across your active <strong>'Leads'</strong> listings for live operational metrics.
                              </p>
                              <ul className="list-disc pl-5 space-y-2 font-light text-slate-600">
                                <li>
                                  <strong className="text-slate-800">Operational Open Formula:</strong>
                                  <div className="font-mono text-xs font-semibold tracking-wider bg-slate-100 p-1 rounded mt-1 overflow-x-auto font-mono">AND(&#123;Lead Stage&#125; != 'Closed-Won', &#123;Lead Stage&#125; != 'Archived')</div>
                                </li>
                                <li>
                                  <strong className="text-slate-800">Critical SLA Breaches Checks Formula:</strong>
                                  <div className="font-mono text-xs font-semibold tracking-wider bg-slate-100 p-1 rounded mt-1 overflow-x-auto font-mono">AND(&#123;Contacted&#125; = FALSE, &#123;SLA Elapsed Hours&#125; &gt; 4.00)</div>
                                </li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/55 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">3</span>
                                ACTION 03: Airtable Search (Summarize Booked Sessions)
                              </div>
                              <p className="font-light text-slate-600 font-sans">
                                Queries your linked <strong>'Interactions & Touchpoints'</strong> logs to calculate scheduled executive sales briefings.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Filtering Target:</strong> Filter interactions logging meetings on the calendar today.</li>
                                <li><strong>Formula Logic:</strong>
                                  <div className="font-mono text-xs font-semibold tracking-wider bg-slate-100 p-1 rounded mt-1 overflow-x-auto font-mono">AND(&#123;Interaction Type&#125; = 'Meeting Scheduled', IS_SAME(&#123;Logged Timestamp&#125;, TODAY()))</div>
                                </li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">4</span>
                                ACTION 04: Airtable Create Record (Daily Ledger Insert)
                              </div>
                              <p className="font-light text-slate-650">
                                Instantiates a historic trend snapshot inside the <strong>'Daily Analytics Ledger'</strong> table.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600 col-span-3">
                                <li><strong>Active Open Leads Variable:</strong> <span className="font-mono text-[10.5px] bg-slate-105 border px-1">{"{{2.total_count}}"}</span></li>
                                <li><strong>SLA Critical Breaches:</strong> <span className="font-mono text-[10.5px] bg-slate-105 border px-1">{"{{3.total_count}}"}</span></li>
                                <li><strong>Today's Booked Meetings:</strong> <span className="font-mono text-[10.5px] bg-slate-105 border px-1">{"{{4.total_count}}"}</span></li>
                              </ul>
                            </div>

                          </div>
                        </div>

                        {/* Interactive Blueprint payload Board (4 cols) */}
                        <div className="lg:col-span-4 space-y-6 text-left font-sans">
                          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-950 shadow-md">
                            <div className="flex justify-between items-center mb-4 font-mono text-[10.5px]">
                              <span className="text-xs font-semibold tracking-wider font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 font-sans">
                                <Sliders className="w-3 h-3" />
                                Make.com Blueprint JSON Schema
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(
                                  JSON.stringify({
                                    schedule: { type: "daily", time: "23:59" },
                                    modules: [
                                      { name: "Search - Count Open Leads", action: "Airtable_Search", formula: "AND({Lead Stage} != 'Closed-Won')" },
                                      { name: "Search - SLA Breached", action: "Airtable_Search", formula: "AND({Contacted} = FALSE, {SLA Elapsed Hours} > 4.00)" },
                                      { name: "Search - Booked Meetings", action: "Airtable_Search", formula: "AND({Interaction Type} = 'Meeting Scheduled')" },
                                      { name: "Create Record - Log Metrics", action: "Airtable_Create", table: "Daily Analytics Ledger" }
                                    ]
                                  }, null, 2),
                                  "payload-daily-snapshot"
                                )}
                                className="text-xs font-semibold tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono px-2 py-1 rounded select-none cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                {copiedState === "payload-daily-snapshot" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy JSON Blueprint</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-xs font-semibold tracking-wider text-slate-400 leading-relaxed font-light mb-4 text-left font-sans">
                              This blueprint executes daily performance reports and loads variables seamlessly to prevent operational table degradation:
                            </p>

                            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-semibold tracking-wider font-mono text-emerald-350 border border-slate-800 overflow-x-auto max-h-56 font-mono">
{"{\n  \"schedule\": {\n    \"type\": \"daily\",\n    \"time\": \"23:59\"\n  },\n  \"modules\": [\n    {\n      \"name\": \"Audit_Open_Leads_Volume\",\n      \"action\": \"Airtable_Search\"\n    },\n    {\n      \"name\": \"Trace_SLA_Exposed_Breaches\",\n      \"action\": \"Airtable_Search\"\n    }\n  ]\n}"}
                            </pre>

                            <div className="border-t border-slate-850 mt-5 pt-4 text-left font-sans">
                              <span className="text-xs font-semibold tracking-wider font-mono uppercase font-bold text-slate-400 block mb-1">Audit Ledger Goal:</span>
                              <p className="text-xs font-semibold tracking-wider text-slate-400 leading-normal font-light">
                                Connect this module directly to a dedicated Airtable historical data summary record sheet to calculate rolling 7-day or 30-day performance averages.
                              </p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-150 p-5 rounded-xl space-y-2.5 text-left">
                            <h5 className="text-xs font-semibold font-mono font-bold text-emerald-950 uppercase tracking-wide">
                              🟢 Justifying High Tier Prices
                            </h5>
                            <p className="text-xs font-semibold text-slate-650 leading-relaxed font-light font-sans">
                              Automated daily performance snapshots provide empirical audit trials to prove your system speeds, justifying custom implementation setups priced upwards of <strong>$3,500</strong>.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Scenario 4: Closed-Won ROI Trigger */}
                  {activeScenario === "roi_trigger" && (
                    <div className="space-y-6">
                      
                      {/* Step Visualizer */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-left font-sans">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest font-sans">
                          💰 Closed-Won ROI Attribution Flow Visualizer
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch pt-2">
                          {[
                            { step: "Trigger", title: "Lead Won", desc: "Monitors status change to 'Closed-Won' instantly", badge: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
                            { step: "Step 02", title: "Parse UTM/Source", desc: "Extracts original lead campaign parameters", badge: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
                            { step: "Step 03", title: "Retrieve Spend", desc: "Lookup ad spends dynamically from Ledger", badge: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                            { step: "Step 04", title: "Map ROI Yield", desc: "Writes LTV-to-CAC ratios back to Dashboard", badge: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
                          ].map((nd, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between text-center relative hover:scale-[1.01] transition-transform font-sans">
                              {idx < 3 && (
                                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border border-slate-200 z-15 text-slate-400">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-block mb-3 ${nd.badge}`}>
                                  {nd.step}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 leading-tight font-sans">
                                  {nd.title}
                                </h5>
                                <p className="text-xs font-semibold tracking-wider text-slate-400 mt-1.5 leading-snug font-light">
                                  {nd.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical Detail Cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Technical Blueprint Guide (8 cols) */}
                        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 text-left font-sans">
                          <div>
                            <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase border border-indigo-150">
                              Cohort CAC & ROI Engine Config
                            </span>
                            <h4 className="text-base font-bold text-slate-900 mt-2 font-sans font-sans">
                              💰 Step-by-Step Closed-Won ROI Trigger Mechanics
                            </h4>
                          </div>

                          <div className="space-y-4 text-xs text-slate-650 leading-relaxed text-left font-sans animate-fade-in font-sans">
                            
                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-850 flex items-center gap-1.5 font-mono text-slate-900">
                                <span className="bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
                                TRIGGER: Airtable - Watch Records (Conversion Trigger Segment)
                              </div>
                              <p className="font-light text-slate-600 leading-relaxed">
                                Evaluates newly acquired revenue immediately. Establish a filter condition rule in your Zapier or Make configuration:
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Target Event Rule:</strong> Record moves into view <strong>"💰 Closed Deals Log"</strong>.</li>
                                <li><strong>Filter Criterion:</strong> <span className="font-mono bg-slate-105 px-1 font-sans text-slate-800">&#123;Lead Stage&#125; = 'Closed-Won'</span> with a non-empty Contract Volume.</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">2</span>
                                ACTION 01 & 02: Identify UTM & Retrieve Ad Spent
                              </div>
                              <p className="font-light text-slate-600 font-sans">
                                Locates the original client source tag and queries paid costs corresponding to the source from the <strong>'Revenue & Attribution'</strong> ledger.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Key Lookup Mapper Lookup ID:</strong> <span className="font-mono">{"{{1.Ad_Campaign_Source}}"}</span> (e.g. Meta Ads, Google Outbound).</li>
                                <li><strong>Return Properties:</strong> Returns campaign target variables: <span className="font-mono font-bold bg-slate-100 px-1 font-sans text-slate-800">Total Adspend Spent</span>, <span className="font-mono font-bold bg-slate-100 px-1 font-sans text-slate-800">Average Cost Per Lead (CPL)</span>.</li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono text-left">
                                <span className="bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">3</span>
                                ACTION 03: Run Dynamic Mathematical Calculations (ROI Ratio)
                              </div>
                              <p className="font-light text-slate-600 font-sans">
                                Computes cohort metrics inside the automation parser step using standard math variables:
                              </p>
                              <ul className="list-disc pl-5 space-y-1.5 font-light text-slate-600 font-sans">
                                <li><strong>Deal ROI Multiplier Formula:</strong> <span className="font-mono bg-slate-100 p-1 text-xs font-semibold rounded inline-block text-indigo-700">{"{{trigger_record.Contract_LTV}} / {{campaign_record.CPL}}"}</span></li>
                                <li><strong>Weighted Cohort CAC:</strong> Calculates the upgraded Customer Acquisition Cost as total cohort spent divided by updated total win count:
                                  <div className="font-mono text-xs font-semibold tracking-wider bg-slate-100 p-1 rounded mt-1 overflow-x-auto">(&#123;&#123;campaign_record.Total_Spend&#125;&#125; + &#123;&#123;trigger_record.Internal_Labor&#125;&#125;) / (&#123;&#123;campaign_record.Total_Bookings&#125;&#125;)</div>
                                </li>
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                                <span className="bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">4</span>
                                ACTION 04: Airtable - Update Record in Global Analytics Dashboard
                              </div>
                              <p className="font-light text-slate-600">
                                Transmits computed performance ratios back to update your Month ID record inside the global <strong>'Performance Analytics Dashboard'</strong>.
                              </p>
                              <ul className="list-disc pl-5 space-y-1 font-light text-slate-600">
                                <li><strong>Target Table:</strong> 'Performance Analytics Dashboard'</li>
                                <li><strong>Mapped Fields updated:</strong> Cumulative Won LTV, Weighted ROI Metric, Cohort CAC Yield.</li>
                              </ul>
                            </div>

                          </div>
                        </div>

                        {/* Interactive Blueprint payload Board (4 cols) */}
                        <div className="lg:col-span-4 space-y-6 text-left">
                          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-950 shadow-md">
                            <div className="flex justify-between items-center mb-4 font-mono text-[10.5px]">
                              <span className="text-xs font-semibold tracking-wider font-mono text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1 font-sans">
                                <Sliders className="w-3 h-3" />
                                Trigger & ROI Scheme JSON (Make.com)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(
                                  JSON.stringify({
                                    trigger: { action: "Airtable_Watch_Won_Lead", Filter: "{Lead Stage} = 'Closed-Won'" },
                                    actions: [
                                      { name: "Parse Traffic Source", query: "{{utm_source}}" },
                                      { name: "Lookup Campaign Records", action: "Airtable_Search", formula: "{Cohort Campaign Source} = '{{utm_source}}'" },
                                      { name: "Execute Math ROI Parser", formula: "Cohort_CAC_Calc", yield: "{{LTV}} / {{CAC}}" },
                                      { name: "Update Dashboard Analytics", action: "Airtable_Update", target: "Performance Analytics Dashboard" }
                                    ]
                                  }, null, 2),
                                  "payload-roi-trigger"
                                )}
                                className="text-xs font-semibold tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono px-2 py-1 rounded select-none cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                {copiedState === "payload-roi-trigger" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy JSON Blueprint</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-xs font-semibold tracking-wider text-slate-400 leading-relaxed font-light mb-4 text-left font-sans">
                              This webhook action fires instantly on winning high-ticket agency operations to map revenue metrics mathematically:
                            </p>

                            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-semibold tracking-wider font-mono text-indigo-350 border border-slate-800 overflow-x-auto max-h-56 font-mono">
{"{\n  \"trigger\": {\n    \"action\": \"Watch_Won_Status_Record\"\n  },\n  \"compute_step\": {\n    \"deal_roi\": \"{{Contract}} / {{CAC}}\"\n  }\n}"}
                            </pre>

                            <div className="border-t border-slate-850 mt-5 pt-4 text-left font-sans font-sans">
                              <span className="text-xs font-semibold tracking-wider font-mono uppercase font-bold text-slate-400 block mb-1">Adspend Realization:</span>
                              <p className="text-xs font-semibold tracking-wider text-slate-400 leading-normal font-light">
                                Automatically links campaigns parsed from Google, Youtube, and Meta Ads into calculated real business metrics.
                              </p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-150 p-5 rounded-xl space-y-2.5 text-left">
                            <h5 className="text-xs font-semibold font-mono font-bold text-indigo-950 uppercase tracking-wide">
                              🛡️ Seamless CAC Tracking
                            </h5>
                            <p className="text-xs font-semibold text-slate-650 leading-relaxed font-light font-sans">
                              Attributing exact cost requirements per lead source is key to achieving optimal LTV-to-CAC ratios and scaling agency profits.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Consulting Delivery Map Archive */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-left">
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
                      📋 Make.com Automated Blueprints Ready-To-Import (.json)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {[
                        { title: "📥 Raw Webhook Sourcing Router", file: "webhook_ingest_parser.json", lines: "1,200 configuration lines" },
                        { title: "🚨 Sub-4hr SLA Countdown Engine", file: "sla_countdown_timer.json", lines: "840 configuration lines" },
                        { title: "💳 Closed Won Attribution Ledger", file: "revenue_stripe_rollup.json", lines: "950 configuration lines" }
                      ].map((item, id) => (
                        <div key={id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-mono text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded font-bold border border-indigo-100">BUNDLE ARCHIVE</span>
                            <h5 className="text-xs font-bold text-slate-900 mt-2 font-sans">{item.title}</h5>
                            <p className="text-xs font-semibold tracking-wider text-slate-400 mt-1 font-mono">{item.file}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-xs font-semibold tracking-wider text-slate-300 font-mono font-mono">
                            <span>Blueprint File size:</span>
                            <span className="font-semibold text-slate-700">{item.lines}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "deployment" && (
                <div className="space-y-8 animate-fade-in text-left">
                  
                  {/* Strategic Operational Intro */}
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-950 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex gap-4 items-start relative z-10 font-sans">
                      <div className="p-3 bg-teal-500/10 text-teal-400 rounded-lg shrink-0 border border-teal-500/20">
                        <ClipboardList className="w-6 h-6 text-teal-400" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold tracking-wider font-mono tracking-widest font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 uppercase px-2.5 py-1 rounded">
                          RevOps Deployment Suite
                        </span>
                        <h3 className="text-xl font-bold text-white mt-2.5">
                          💼 Ready-to-Deploy Operational Assets
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1.5 font-light">
                          Ensure flawless hand-off execution. Turn your high-converting product blueprint into an out-of-the-box system engine with our 7-Day sequence map, troubleshooting sandbox, and team standard operating procedures (SOPs).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left Column: 1. 7-Day Implementation Path (7 Cols) */}
                    <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                              OPERATIONS GUIDEBOOK
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1.5 font-sans">
                              📅 The 7-Day Implementation Checklist
                            </h4>
                          </div>
                          {/* Completion Ratio Badge */}
                          <div className="text-right">
                            <span className="text-xs font-semibold tracking-wider font-mono text-slate-400 block uppercase">Completion Gauge</span>
                            <span className="text-xs font-mono font-bold text-teal-600 animate-scale-in">
                              {Math.round((checkedSubtasks.length / 21) * 100)}% Tasks Done
                            </span>
                          </div>
                        </div>

                        {/* Interactive Step-by-Step Stepper Tabs */}
                        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-slate-50">
                          {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                            const isSelected = activeDay === dayNum;
                            // Check if all subtasks for this day (3 per day) are completed
                            const dayTaskIds = ["day-" + dayNum + "-t1", "day-" + dayNum + "-t2", "day-" + dayNum + "-t3"];
                            const isAllDone = dayTaskIds.every(id => checkedSubtasks.includes(id));
                            return (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => setActiveDay(dayNum)}
                                className={`px-3 py-2 text-xs font-mono rounded-lg border font-bold flex flex-col items-center gap-0.5 min-w-[55px] cursor-pointer transition ${
                                  isSelected 
                                    ? "bg-slate-900 text-slate-100 border-slate-950 shadow-xs" 
                                    : isAllDone
                                      ? "bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100"
                                      : "bg-slate-50 text-slate-300 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <span>Day</span>
                                <span className="text-base font-extrabold">{dayNum}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Stepper Details */}
                        <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 text-xs">
                          {activeDay === 1 && (
                            <div className="space-y-4 animate-fade-in text-left">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Day 01 Objective</span>
                                <h5 className="font-bold text-slate-900 text-sm">🗂️ Airtable Master Database Setup</h5>
                                <p className="text-slate-300 mt-1 leading-relaxed font-light font-sans">
                                  Duplicate the core database structures. Set up tables, automated formulas, and user roles to align with active client acquisition flows.
                                </p>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                {[
                                  { id: "day-1-t1", text: "Download the complete standard DB ledger and click 'Duplicate Base'." },
                                  { id: "day-1-t2", text: "Map relational tables: Leads, SDR Workspace, and Attribution Balance." },
                                  { id: "day-1-t3", text: "Configure custom fields (e.g., Enterprise budget sizing, technographics match score)." }
                                ].map((task) => (
                                  <label key={task.id} className="flex gap-2.5 items-start p-2.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checkedSubtasks.includes(task.id)}
                                      onChange={() => {
                                        if (checkedSubtasks.includes(task.id)) {
                                          setCheckedSubtasks(checkedSubtasks.filter(t => t !== task.id));
                                        } else {
                                          setCheckedSubtasks([...checkedSubtasks, task.id]);
                                        }
                                      }}
                                      className="accent-teal-650 mt-0.5 cursor-pointer rounded"
                                    />
                                    <span className={`text-slate-700 select-none cursor-pointer font-sans leading-relaxed ${checkedSubtasks.includes(task.id) ? 'line-through text-slate-400' : ''}`}>
                                      {task.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeDay === 2 && (
                            <div className="space-y-4 animate-fade-in text-left">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Day 02 Objective</span>
                                <h5 className="font-bold text-slate-900 text-sm">⚡ Webhook Trigger Integration</h5>
                                <p className="text-slate-300 mt-1 leading-relaxed font-light font-sans">
                                  Establish standard webhooks mapping inputs (from site webforms, Typeforms, or Landing Pages) directly as incoming triggers into Make.com/Zapier.
                                </p>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                {[
                                  { id: "day-2-t1", text: "Generate standard webhook URLs in Make inside 'Web Hook Custom Inbound' module." },
                                  { id: "day-2-t2", text: "Bind domain forms (Framer, Wix, or custom Form) to post payload upon submission." },
                                  { id: "day-2-t3", text: "Initiate dummy posts to confirm raw webhook catches names, messages and core credentials." }
                                ].map((task) => (
                                  <label key={task.id} className="flex gap-2.5 items-start p-2.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checkedSubtasks.includes(task.id)}
                                      onChange={() => {
                                        if (checkedSubtasks.includes(task.id)) {
                                          setCheckedSubtasks(checkedSubtasks.filter(t => t !== task.id));
                                        } else {
                                          setCheckedSubtasks([...checkedSubtasks, task.id]);
                                        }
                                      }}
                                      className="accent-teal-650 mt-0.5 cursor-pointer rounded"
                                    />
                                    <span className={`text-slate-700 select-none cursor-pointer font-sans leading-relaxed ${checkedSubtasks.includes(task.id) ? 'line-through text-slate-400' : ''}`}>
                                      {task.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeDay === 3 && (
                            <div className="space-y-4 animate-fade-in text-left">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Day 03 Objective</span>
                                <h5 className="font-bold text-slate-900 text-sm">🔍 Automated Enrichment Setup</h5>
                                <p className="text-slate-300 mt-1 leading-relaxed font-light font-sans">
                                  Bridge corporate enrichment APIs (Clearbit, Apollo or Clay API) into the data intake flow to automatically classify deal size.
                                </p>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                {[
                                  { id: "day-3-t1", text: "Configure Auth keys inside HTTP Make routers looking up domain parameters." },
                                  { id: "day-3-t2", text: "Map JSON response nodes containing 'employees', 'revenue', and 'tech_stack'." },
                                  { id: "day-3-t3", text: "Deploy fallback default paths for local clients or files lacking premium API hits." }
                                ].map((task) => (
                                  <label key={task.id} className="flex gap-2.5 items-start p-2.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checkedSubtasks.includes(task.id)}
                                      onChange={() => {
                                        if (checkedSubtasks.includes(task.id)) {
                                          setCheckedSubtasks(checkedSubtasks.filter(t => t !== task.id));
                                        } else {
                                          setCheckedSubtasks([...checkedSubtasks, task.id]);
                                        }
                                      }}
                                      className="accent-teal-650 mt-0.5 cursor-pointer rounded"
                                    />
                                    <span className={`text-slate-700 select-none cursor-pointer font-sans leading-relaxed ${checkedSubtasks.includes(task.id) ? 'line-through text-slate-400' : ''}`}>
                                      {task.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeDay === 4 && (
                            <div className="space-y-4 animate-fade-in text-left">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Day 04 Objective</span>
                                <h5 className="font-bold text-slate-900 text-sm">🚨 Sub-4hr SLA Logic Setup</h5>
                                <p className="text-slate-300 mt-1 leading-relaxed font-light font-sans">
                                  Deploy automated timestamps and countdown schedules checking in real-time whether assigned leads have hovered un-contacted.
                                </p>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                {[
                                  { id: "day-4-t1", text: "Build conditional logic matching if status remains 'Review' past 240 mins." },
                                  { id: "day-4-t2", text: "Establish countdown tasks checking timezone matching indexes safely." },
                                  { id: "day-4-t3", text: "Construct dynamic, clickable Slack JSON payload cards with mobile hotlinks." }
                                ].map((task) => (
                                  <label key={task.id} className="flex gap-2.5 items-start p-2.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checkedSubtasks.includes(task.id)}
                                      onChange={() => {
                                        if (checkedSubtasks.includes(task.id)) {
                                          setCheckedSubtasks(checkedSubtasks.filter(t => t !== task.id));
                                        } else {
                                          setCheckedSubtasks([...checkedSubtasks, task.id]);
                                        }
                                      }}
                                      className="accent-teal-650 mt-0.5 cursor-pointer rounded"
                                    />
                                    <span className={`text-slate-700 select-none cursor-pointer font-sans leading-relaxed ${checkedSubtasks.includes(task.id) ? 'line-through text-slate-400' : ''}`}>
                                      {task.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeDay === 5 && (
                            <div className="space-y-4 animate-fade-in text-left">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Day 05 Objective</span>
                                <h5 className="font-bold text-slate-900 text-sm">💬 Team Routing & Slack Enforcer</h5>
                                <p className="text-slate-300 mt-1 leading-relaxed font-light font-sans">
                                  Unify slack incoming integrations with automatic rep dispatch metrics to optimize incoming assignments.
                                </p>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                {[
                                  { id: "day-5-t1", text: "Establish webhook verification logs inside your private team Slack channel." },
                                  { id: "day-5-t2", text: "Configure active Round-robin formulas mapping lowest-workload reps first." },
                                  { id: "day-5-t3", text: "Trigger dynamic mobile mock alerts verifying rep alerts display layout in under 120s." }
                                ].map((task) => (
                                  <label key={task.id} className="flex gap-2.5 items-start p-2.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checkedSubtasks.includes(task.id)}
                                      onChange={() => {
                                        if (checkedSubtasks.includes(task.id)) {
                                          setCheckedSubtasks(checkedSubtasks.filter(t => t !== task.id));
                                        } else {
                                          setCheckedSubtasks([...checkedSubtasks, task.id]);
                                        }
                                      }}
                                      className="accent-teal-650 mt-0.5 cursor-pointer rounded"
                                    />
                                    <span className={`text-slate-700 select-none cursor-pointer font-sans leading-relaxed ${checkedSubtasks.includes(task.id) ? 'line-through text-slate-400' : ''}`}>
                                      {task.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeDay === 6 && (
                            <div className="space-y-4 animate-fade-in text-left">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Day 06 Objective</span>
                                <h5 className="font-bold text-slate-900 text-sm">💳 Closed Won Stripe Ledger Sync</h5>
                                <p className="text-slate-300 mt-1 leading-relaxed font-light font-sans">
                                  Establish Stripe webhooks linking custom purchases back to Airtable client files for automatic attribution tracking.
                                </p>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                {[
                                  { id: "day-6-t1", text: "Enable Stripe 'checkout.session.completed' incoming webhooks in platform settings." },
                                  { id: "day-6-t2", text: "Sync payment email hashes directly back to your existing Leads Airtable row." },
                                  { id: "day-6-t3", text: "Verify real-time CAC, CPL and executive ROAS ledger dashboards refresh perfectly." }
                                ].map((task) => (
                                  <label key={task.id} className="flex gap-2.5 items-start p-2.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checkedSubtasks.includes(task.id)}
                                      onChange={() => {
                                        if (checkedSubtasks.includes(task.id)) {
                                          setCheckedSubtasks(checkedSubtasks.filter(t => t !== task.id));
                                        } else {
                                          setCheckedSubtasks([...checkedSubtasks, task.id]);
                                        }
                                      }}
                                      className="accent-teal-650 mt-0.5 cursor-pointer rounded"
                                    />
                                    <span className={`text-slate-700 select-none cursor-pointer font-sans leading-relaxed ${checkedSubtasks.includes(task.id) ? 'line-through text-slate-400' : ''}`}>
                                      {task.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeDay === 7 && (
                            <div className="space-y-4 animate-fade-in text-left">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Day 07 Objective</span>
                                <h5 className="font-bold text-slate-900 text-sm">🚀 Ecosystem Hand-off & Live Traffic</h5>
                                <p className="text-slate-300 mt-1 leading-relaxed font-light font-sans">
                                  Audit active pipeline operations, prepare team managers, declare spreadsheet logs obsolete, and open live webhook routers.
                                </p>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                {[
                                  { id: "day-7-t1", text: "Hand-off Lead Triage & SLA Protocols documentation to reps and founders." },
                                  { id: "day-7-t2", text: "Lock write properties for base grids, permitting access to SDR fields only." },
                                  { id: "day-7-t3", text: "Switch active automation pipelines to 'ON' and monitor first-lead responses!" }
                                ].map((task) => (
                                  <label key={task.id} className="flex gap-2.5 items-start p-2.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checkedSubtasks.includes(task.id)}
                                      onChange={() => {
                                        if (checkedSubtasks.includes(task.id)) {
                                          setCheckedSubtasks(checkedSubtasks.filter(t => t !== task.id));
                                        } else {
                                          setCheckedSubtasks([...checkedSubtasks, task.id]);
                                        }
                                      }}
                                      className="accent-teal-650 mt-0.5 cursor-pointer rounded"
                                    />
                                    <span className={`text-slate-700 select-none cursor-pointer font-sans leading-relaxed ${checkedSubtasks.includes(task.id) ? 'line-through text-slate-400' : ''}`}>
                                      {task.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Milestone Checkpoint Card */}
                      <div className="mt-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl relative overflow-hidden">
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                          <CheckSquare className="w-16 h-16 text-emerald-800" />
                        </div>
                        <div className="text-left relative z-10">
                          <h5 className="font-bold text-emerald-950 text-xs font-mono uppercase tracking-wide flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            RevOps Deployment Verification
                          </h5>
                          <p className="text-xs font-semibold text-slate-650 leading-relaxed font-light mt-1 w-11/12 font-sans">
                            Check off your daily configurations live! This checklist enforces standard B2B automation procedures so that clients experience absolute zero tech delivery friction upon deployment.
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: 2. First Automation Test Guide + Sandbox Terminal (5 Cols) */}
                    <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-xl border border-slate-950 p-6 flex flex-col justify-between relative shadow-lg">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded animate-pulse">
                              SANDBOX TESTING TERMINAL
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1.5 font-sans">
                              🧪 Run First Automation Test
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(simulationPayload, "raw-payload")}
                            className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono px-2 py-1 rounded border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedState === "raw-payload" ? <Check className="w-3 h-3 text-emerald-450" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedState === "raw-payload" ? "Copied" : "Copy JSON"}</span>
                          </button>
                        </div>

                        <p className="text-xs font-semibold text-slate-300 leading-normal font-light text-left font-sans">
                          Verify data matching. Enter custom dummy lead metrics into the JSON sandbox window below, and fire the test trigger simulator to witness dynamic RevOps matching live in console outputs!
                        </p>

                        {/* Interactive JSON Sandbox Window */}
                        <div className="space-y-1 text-left font-mono">
                          <label className="text-sm font-semibold tracking-wider text-zinc-400 uppercase tracking-widest font-bold">
                            Interactive JSON Payload Data
                          </label>
                          <textarea
                            value={simulationPayload}
                            onChange={(e) => setSimulationPayload(e.target.value)}
                            disabled={isSimulatingTest}
                            rows={8}
                            className="w-full text-xs font-semibold font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-emerald-400 focus:outline-none focus:border-emerald-600 transition disabled:opacity-50 select-text resize-none"
                            placeholder="Type valid JSON payload..."
                          />
                        </div>

                        {/* Simulate execution action button */}
                        <button
                          type="button"
                          onClick={runSimulationTest}
                          disabled={isSimulatingTest}
                          className="w-full bg-teal-550 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-lg text-base font-semibold min-h-[44px] font-mono tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSimulatingTest ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-slate-950" />
                              <span>Enenriching Leads Mapping...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 shrink-0 text-slate-950" />
                              <span>Execute Test Trigger Simulation</span>
                            </>
                          )}
                        </button>

                        {/* Sandbox Console Output logs */}
                        <div className="space-y-1.5 text-left font-mono">
                          <h5 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase font-bold tracking-widest">
                            Live Troubleshooting Console Outputs
                          </h5>
                          <div className="bg-slate-950/80 rounded-xl border border-slate-850 p-3 max-h-56 min-h-[148px] overflow-y-auto space-y-1 block leading-normal text-left shadow-inner">
                            {simulationLogs.length === 0 ? (
                              <div className="text-xs font-semibold tracking-wider text-slate-300 p-4 text-center font-sans">
                                Console clean. Click button above to execute simulation run trace...
                              </div>
                            ) : (
                              simulationLogs.map((log, lIdx) => {
                                const isErr = log.includes("[ERROR]");
                                const isSuccess = log.includes("completed successfully") || log.includes("OK") || log.includes("success");
                                return (
                                  <div 
                                    key={lIdx} 
                                    className={`text-[9.5px] whitespace-pre-wrap ${
                                      isErr 
                                        ? "text-rose-400 font-bold" 
                                        : isSuccess 
                                          ? "text-emerald-400 font-bold" 
                                          : "text-slate-350 font-light"
                                    }`}
                                  >
                                    {log}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* 3. Core Team SOPs (Standard Operating Procedures) Footer Block */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-left space-y-6">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                        STANDARD OPERATING PROCEDURES (SOPs)
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1.5 font-sans">
                        📝 Core Team SOPs (Copy & Paste Frameworks)
                      </h4>
                      <p className="text-xs text-slate-300 font-light mt-1 font-sans">
                        Equip your sales team with brief, battle-tested operational rules. These clear procedures guarantee zero dropped threads and maximize outbound-to-close metrics.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* SOP 1: Lead Triage & Enrichment Review */}
                      <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all space-y-4 flex flex-col justify-between text-left">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border font-semibold bg-indigo-50 text-indigo-700 border-indigo-100 uppercase">
                              SALES-SOP-01: Ingestion Audit
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const text = `SALES-SOP-01: LEAD TRIAGE & ENRICHMENT REVIEW\n\n1. REVEAL ALERT: When a lead triggers in Slack, open the dynamic Airtable URL instantly.\n2. SCREEN FIRMOGRAPHICS: Confirm the automated technographics tags accurately match high-value boutique profiles (budget scope / tech parameters).\n3. PREPARE EMAIL: Customize outbound email openers using the dynamic templates generated for their specific target platform.\n4. OUTREACH CADENCE: Dispatch first-touch messages within 4 hours. Record outreach activity directly in the SDR Lead database status column.`;
                                handleCopyText(text, "sop1-copy");
                              }}
                              className="text-xs font-semibold tracking-wider bg-white border border-slate-200 hover:bg-slate-50 text-slate-300 hover:text-slate-900 px-2.5 py-1 rounded flex items-center gap-1 font-mono hover:shadow-xs transition cursor-pointer"
                            >
                              {copiedState === "sop1-copy" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale-in" />
                                  <span className="text-emerald-600 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="text-slate-400 w-3 h-3" />
                                  <span>Copy SOP Text</span>
                                </>
                              )}
                            </button>
                          </div>

                          <h5 className="font-bold text-slate-900 text-sm font-sans font-sans">
                            🔍 Lead Triage & Enrichment Review SOP
                          </h5>
                          
                          <ol className="space-y-2.5 text-xs text-slate-600 font-light mt-4 list-decimal pl-4.5 font-sans leading-relaxed">
                            <li>
                              <strong>Slack Ingestion Match:</strong> Reclaim high-intent leads instantly. Upon receipt of Slack channel notification alerts, SDRs must open the Airtable Lead record link in under 2 minutes.
                            </li>
                            <li>
                              <strong>Enrichment Field Verification:</strong> Review the automated firmographics (corporate headcount values, Apollo and Clay tech fields). Double-verify database matching criteria before assigning deal stages.
                            </li>
                            <li>
                              <strong>Tailored Outreach Draft:</strong> Retrieve custom email/LinkedIn openers personalized to the prospect's tech stack directly from the outreach sequencer page.
                            </li>
                            <li>
                              <strong>Logging SLAs:</strong> Dispatch openers and switch the active status checkbox to "Outreach Dispatched" to lock in response time and cease countdown monitoring.
                            </li>
                          </ol>
                        </div>
                        
                        <div className="pt-3.5 border-t border-slate-200/50 text-xs font-semibold tracking-wider font-mono text-indigo-650 flex items-center gap-1.5 font-mono">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Standard Operating Protocol &bull; Lead Audit Enforcer</span>
                        </div>
                      </div>

                      {/* SOP 2: SLA Breach Response Protocol */}
                      <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all space-y-4 flex flex-col justify-between text-left">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border font-semibold bg-rose-50 text-rose-700 border-rose-100 uppercase">
                              REVOPS-SOP-02: Recovery Protocol
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const text = `REVOPS-SOP-02: SLA BREACH RESPONSE PROTOCOL\n\n1. BREACH RECOGNITION: Immediate escalation occurs if a lead sits in 'Review' status for 4+ hours, firing the 🚨 CRITICAL BREACH Discord/Slack notification.\n2. TEAM REDIRECT: Team managers or senior executives must instantly assume temporary ownership of the breached lead file.\n3. EXPRESS OUTREACH: Execute direct-call or prioritized outreach in under 10 minutes from breach alert trigger.\n4. ROOT-CAUSE AUDIT: File a brief operational log note explaining the rep dispatch delay to guide routine staffing reviews.`;
                                handleCopyText(text, "sop2-copy");
                              }}
                              className="text-xs font-semibold tracking-wider bg-white border border-slate-200 hover:bg-slate-50 text-slate-300 hover:text-slate-900 px-2.5 py-1 rounded flex items-center gap-1 font-mono hover:shadow-xs transition cursor-pointer"
                            >
                              {copiedState === "sop2-copy" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale-in" />
                                  <span className="text-emerald-600 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="text-slate-400 w-3 h-3" />
                                  <span>Copy SOP Text</span>
                                </>
                              )}
                            </button>
                          </div>

                          <h5 className="font-bold text-slate-900 text-sm font-sans">
                            🚨 SLA Breach Response Protocol
                          </h5>
                          
                          <ol className="space-y-2.5 text-xs text-slate-600 font-light mt-4 list-decimal pl-4.5 font-sans leading-relaxed">
                            <li>
                              <strong>Escalation Awareness:</strong> If any target lead stays unassigned in "Review" or "Pending" stages for more than 4 hours, the Airtable countdown trigger automatically fires the '🚨 CRITICAL BREACH' alert.
                            </li>
                            <li>
                              <strong>Executive Ownership Override:</strong> The sales manager or senior operations executive must instantly override assignment logs, claiming direct stewardship over the raw lead card.
                            </li>
                            <li>
                              <strong>Emergency Rapid Response:</strong> Disconnect sluggish outbound sequence threads. Contact the lead directly via high-priority call and prioritized custom messages within 10 minutes.
                            </li>
                            <li>
                              <strong>Delay Diagnostic Logging:</strong> Submit a quick diagnostic reason note (e.g. rep on-break, timezone mismatch, database lockout) to correct staff deployment scheduling metrics.
                            </li>
                          </ol>
                        </div>
                        
                        <div className="pt-3.5 border-t border-slate-200/50 text-xs font-semibold tracking-wider font-mono text-rose-750 flex items-center gap-1.5 font-mono">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                          <span>Emergency Protocol &bull; Pipeline Recovery Safeguard</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Custom Interactive Workflow Flowchart */}
            <div className="border-t border-slate-200/80 bg-slate-50/60 p-6 flex flex-col gap-4">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                Ecosystem Operational Flow Visualizer
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-stretch">
                <div className="bg-white border border-slate-200 p-3.5 rounded-lg text-center flex flex-col justify-center">
                  <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-300 px-1.5 py-0.5 rounded-sm inline-block mx-auto mb-1">Inbound Asset</span>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Gumroad Template Sale</div>
                  <div className="text-xs font-semibold tracking-wider text-slate-400 mt-1 font-mono">{pricePoint || "$350"} Standard Retainer License</div>
                </div>
                
                <div className="bg-white border border-slate-200 p-3.5 rounded-lg text-center flex flex-col justify-center items-center relative">
                  <div className="hidden sm:block absolute -left-1.5 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border border-slate-200 z-10 text-slate-400">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-sm inline-block mb-1">Action Bridge</span>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Targeted SLA Setup Pitch</div>
                  <div className="text-xs font-semibold tracking-wider text-indigo-500 mt-1 font-mono">Outbound Sequence Trigger</div>
                  <div className="hidden sm:block absolute -right-1.5 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border border-slate-200 z-10 text-slate-400">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-lg text-center flex flex-col justify-center">
                  <span className="text-[9px] font-mono uppercase bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-sm inline-block mx-auto mb-1">Enterprise Upsell</span>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Bespoke Enterprise Implementation</div>
                  <div className="text-xs font-semibold tracking-wider text-slate-400 mt-1 font-mono">{upsellPricePoint || "$3,500"}+ Retainer Contract</div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Strategy Advisor Footer Card */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="bg-slate-900 text-slate-100 rounded-3xl p-8 border border-slate-950 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="md:col-span-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 text-xs font-semibold tracking-wider font-mono font-bold uppercase tracking-wider px-2 py-1 rounded">
                Executive Playbook Strategy
              </span>
              <h3 className="text-2xl font-black text-white mt-4 tracking-tight leading-none">
                How to Leverage a $350 Product into a $3,500+ Retainer
              </h3>
              <p className="text-sm text-slate-300/90 font-light mt-3 leading-relaxed">
                Most agencies fail because their upfront pitch is too heavy, requiring intense client trust immediately. By selling a fully-designed modular CRM template for <span className="text-white font-medium">$350</span>, you demonstrate pristine technical mastery, eliminate buying friction, and align yourself with their active internal operations. Once they import the asset, target them instantly with outbound conversion hooks offering legacy system cleanup, automated webhook configurations, and personalized team support models.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-3.5 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">
                Strategic Consulting Checkpoints
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2 text-slate-350">
                  <Check className="w-4 h-4 text-indigo-400" />
                  <span>Eliminate mock content blocks</span>
                </li>
                <li className="flex items-center gap-2 text-slate-350">
                  <Check className="w-4 h-4 text-indigo-400" />
                  <span>Enforce clear pricing leverage logic</span>
                </li>
                <li className="flex items-center gap-2 text-slate-350">
                  <Check className="w-4 h-4 text-indigo-400" />
                  <span>Deploy standard B2B automation</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
