import React, { useState } from "react";
import { Copy, Download, Check, Sparkles, X, FileCode } from "lucide-react";
import { generateTemplateHtml } from "../templateHtml";
import { VenueContent } from "../types";

interface CodeExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContent: VenueContent;
  activeTheme: "theme-neon-velvet" | "theme-gold-noir" | "theme-emerald-dark";
}

export default function CodeExporterModal({
  isOpen,
  onClose,
  activeContent,
  activeTheme
}: CodeExporterModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "instructions">("code");

  if (!isOpen) return null;

  const htmlCode = generateTemplateHtml(activeContent, activeTheme);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeContent.id}-${activeTheme.replace("theme-", "")}-template.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="exporter-dialog"
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Glamour Header glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-60"></div>
        
        {/* Premium Title bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-rose-500/10 text-rose-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wider text-neutral-100 upper">
                TEMPLATE EXPORT HUB
              </h3>
              <p className="text-xs text-neutral-400 font-sans">
                Ready-to-resell premium single-file HTML5 template
              </p>
            </div>
          </div>
          <button 
            id="close-exporter"
            onClick={onClose} 
            className="text-neutral-400 hover:text-neutral-100 p-1 hover:bg-neutral-800 rounded transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-neutral-950/50 border-b border-neutral-800 px-6 gap-4">
          <button
            id="tab-code"
            onClick={() => setActiveTab("code")}
            className={`py-3 text-xs font-display font-medium tracking-widest border-b-2 transition-all cursor-pointer ${
              activeTab === "code" 
                ? "border-rose-500 text-rose-400" 
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            GENERATED SOURCE
          </button>
          <button
            id="tab-instructions"
            onClick={() => setActiveTab("instructions")}
            className={`py-3 text-xs font-display font-medium tracking-widest border-b-2 transition-all cursor-pointer ${
              activeTab === "instructions" 
                ? "border-rose-500 text-rose-400" 
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            BUYER CUSTOMIZATION SYSTEM
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 font-sans">
          {activeTab === "code" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 bg-neutral-950 px-4 py-2 rounded-lg border border-neutral-800/80">
                <span className="font-mono text-xs font-semibold tracking-wider">
                  Filesize: ~{(htmlCode.length / 1024).toFixed(1)} KB • Self-contained production build (Pure vanilla markup & CSS)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    id="copy-code-btn"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 hover:text-neutral-100 transition-colors uppercase font-display text-base font-semibold min-h-[44px] font-semibold tracking-wider tracking-wider font-semibold cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  <span className="text-neutral-700">|</span>
                  <button
                    id="download-code-btn"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 hover:text-neutral-100 transition-colors uppercase font-display text-base font-semibold min-h-[44px] font-semibold tracking-wider tracking-wider font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .html</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-lg border border-neutral-800 overflow-hidden bg-neutral-950 max-h-[460px] flex">
                <textarea
                  id="source-code-textarea"
                  readOnly
                  value={htmlCode}
                  className="w-full h-[400px] p-4 font-mono text-base min-h-[44px] font-semibold leading-relaxed bg-neutral-950 text-neutral-300 select-all focus:outline-none overflow-y-auto resize-none whitespace-pre"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
              <div>
                <h4 className="font-display text-xs font-bold tracking-widest text-neutral-100 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  VALUED AT $85 — $129 FOR GUMROAD VENUES
                </h4>
                <p className="text-neutral-400 text-xs">
                  This template includes a robust set of modular tags and layout blocks engineered for 9.5/10 sellability. Because it runs on pure responsive, high-salinity vanilla HTML/CSS/JS without React frameworks, any bartender, restaurant owner, or beginner developer can deploy it to their custom domain via Netlify or GitHub Pages in under five minutes.
                </p>
              </div>

              <div className="border-t border-neutral-800/80 pt-4">
                <h5 className="font-display text-xs font-semibold font-bold tracking-wider text-rose-400 mb-3">
                  HOW TO SWAP PRESET THEMES (IN SECONDS)
                </h5>
                <p className="text-neutral-400 text-xs mb-3">
                  The client template has 3 complete, professionally colored CSS design systems built into the bottom of the style section. A buyer can swap the theme instantly by modifying the class name on the core body markup tag:
                </p>
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800 font-mono text-xs text-neutral-300 space-y-1">
                  <div><span className="text-rose-500">&lt;!-- For romantic Rose & Neon vibes --&gt;</span></div>
                  <div>&lt;<span className="text-blue-400">body</span> <span className="text-amber-400">class</span>=<span className="text-emerald-400">"theme-neon-velvet"</span>&gt;</div>
                  <div className="pt-2"><span className="text-rose-500">&lt;!-- For warm executive champagne gold --&gt;</span></div>
                  <div>&lt;<span className="text-blue-400">body</span> <span className="text-amber-400">class</span>=<span className="text-emerald-400">"theme-gold-noir"</span>&gt;</div>
                  <div className="pt-2"><span className="text-rose-500">&lt;!-- For moody craft-bites and high-salinity racing green --&gt;</span></div>
                  <div>&lt;<span className="text-blue-400">body</span> <span className="text-amber-400">class</span>=<span className="text-emerald-400">"theme-emerald-dark"</span>&gt;</div>
                </div>
              </div>

              <div className="border-t border-neutral-800/80 pt-4">
                <h5 className="font-display text-xs font-semibold font-bold tracking-wider text-rose-400 mb-2">
                  EASY-EDIT COMMENT REGISTRIES
                </h5>
                <p className="text-neutral-400 text-xs mb-3">
                  We have labeled every key editable copy and design block inside the source file with prominent block capital labels so non-coders can easily navigate the document using simple <kbd className="bg-neutral-800 px-1 py-0.5 text-xs font-semibold tracking-wider rounded border border-neutral-700">Cmd / Ctrl + F</kbd> search:
                </p>
                <ul className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-400 pl-4 list-disc">
                  <li>EDIT BRAND NAME HERE</li>
                  <li>EDIT HERO HEADLINE HERE</li>
                  <li>EDIT MENU ITEMS HERE</li>
                  <li>EDIT EVENTS HERE</li>
                  <li>EDIT TESTIMONIALS HERE</li>
                  <li>EDIT CONTACT INFO HERE</li>
                  <li>EDIT COLORS HERE</li>
                  <li>EDIT CTA LINKS HERE</li>
                </ul>
              </div>

              <div className="border-t border-neutral-800/80 pt-4 flex justify-between items-center bg-neutral-950 p-4 rounded-lg">
                <div>
                  <h6 className="font-display text-xs font-semibold tracking-wider tracking-wider font-semibold text-neutral-100">
                    SEO & CONVERSION OPTIMIZED
                  </h6>
                  <p className="text-xs font-semibold text-neutral-400">
                    Includes valid JSON-LD structured schema block, Open Graph, preconnect headers, and accessible labels out of the box.
                  </p>
                </div>
                <button
                  id="tab-instruction-download"
                  onClick={handleDownload}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-display text-base font-semibold min-h-[44px] font-semibold tracking-wider font-bold px-5 py-3 min-h-[44px] tracking-widest transition-all hover:scale-105 cursor-pointer"
                >
                  DOWNLOAD ZIP PACKAGE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action footer bar */}
        <div className="bg-neutral-950 px-6 py-4 flex items-center justify-between border-t border-neutral-800">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Commercial Single-Developer Lifetime License Active</span>
          </div>
          <div className="flex gap-3">
            <button
              id="footer-close-btn"
              onClick={onClose}
              className="px-5 py-3 min-h-[44px] border border-neutral-800 rounded bg-neutral-900 text-neutral-300 font-display text-base font-semibold min-h-[44px] font-semibold tracking-wider font-semibold hover:text-white hover:bg-neutral-800 transition-colors tracking-widest cursor-pointer"
            >
              Back to Preview
            </button>
            <button
              id="footer-download-btn"
              onClick={handleDownload}
              className="px-5 py-3 min-h-[44px] rounded bg-rose-600 text-white font-display text-base font-semibold min-h-[44px] font-semibold tracking-wider font-bold hover:bg-rose-500 transition-transform tracking-widest cursor-pointer"
            >
              Export Template File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
