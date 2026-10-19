import React, { useState } from 'react';
import { Copy, Check, Scale, ShieldCheck, DollarSign, Download, Stamp } from 'lucide-react';

export const DelawareApaView: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyLegalAgreement = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(DELAWARE_APA_TEXT);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = DELAWARE_APA_TEXT;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1 font-semibold">
            <Scale className="w-4 h-4" />
            <span>Turnkey Institutional M&A Term Sheet // Commercial Software Asset Standard</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-mono">
            ENTERPRISE ASSET PURCHASE AGREEMENT (APA)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Governed by Delaware General Corporation Law (DGCL). 20 kHz (0.48ms) Monopoly Vault Reference Core.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex flex-col items-end">
            <span className="text-slate-400">PURCHASE SPECIFICATION:</span>
            <span className="text-emerald-400 font-bold text-sm">20 kHz (0.48ms)</span>
          </div>

          <button
            type="button"
            onClick={copyLegalAgreement}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all shadow-lg shadow-cyan-950/40 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
            aria-label="Copy full Turnkey Software Asset Purchase Agreement agreement to clipboard"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'AGREEMENT COPIED' : 'COPY FULL APA (.TXT)'}</span>
          </button>
        </div>
      </div>

      {/* Legal Contract Viewer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl font-serif text-sm sm:text-base text-slate-200 leading-relaxed overflow-x-auto space-y-6">
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-mono uppercase font-bold tracking-widest">
            <Stamp className="w-3.5 h-3.5" />
            Commercial Software Asset Standard EXECUTION COPY
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-50 tracking-tight font-sans">
            ASSET PURCHASE AGREEMENT
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            RELATING TO THE ACQUISITION OF THE GF-T3-159 VORONOIGRID SWARM ENGINE
          </p>
        </div>

        <div className="space-y-4">
          <p>
            This <strong>ASSET PURCHASE AGREEMENT</strong> (&ldquo;Agreement&rdquo;) is entered into as of this 9th day of October, 2026, by and between:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-slate-300 font-sans text-sm">
            <li>
              <strong>GHOST FACTORYOS ARCHITECTURAL LABS LLC</strong>, a Delaware limited liability company (&ldquo;Seller&rdquo;), and
            </li>
            <li>
              <strong>THE INSTITUTIONAL BUYER / MONOPOLY VAULT CONSORTIUM</strong> (&ldquo;Buyer&rdquo;).
            </li>
          </ul>
        </div>

        {/* Section 1 */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <h3 className="font-sans font-bold text-slate-100 text-base flex items-center gap-2">
            <span className="text-cyan-400 font-mono">SECTION 1.</span> PURCHASE AND SALE OF ASSETS
          </h3>
          <p className="text-slate-300 text-sm">
            <strong>1.1 Purchased Assets.</strong> On the terms and subject to the conditions set forth herein, at the Closing, Seller hereby sells, assigns, transfers, conveys, and delivers to Buyer, and Buyer hereby purchases from Seller, free and clear of all Liens, all of Seller’s right, title, and interest in and to the following intellectual property and technical assets:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-slate-400 text-xs font-mono">
            <li>(a) The entire proprietary codebase comprising &ldquo;GF-T3-159 // VoronoiGrid Swarm&rdquo;;</li>
            <li>(b) All algorithmic implementations of decentralized Lloyd Centroidal Voronoi Tessellation and continuous Lyapunov gradient descent;</li>
            <li>(c) All production PostgreSQL / AlloyDB spatial schemas, gRPC streaming definitions, and OpenAPI 3.1 contracts;</li>
            <li>(d) All associated patents, trade secrets, design rights, and clean-room provenance documentation.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <h3 className="font-sans font-bold text-slate-100 text-base flex items-center gap-2">
            <span className="text-cyan-400 font-mono">SECTION 2.</span> PURCHASE PRICE & CLOSING ESCROW
          </h3>
          <p className="text-slate-300 text-sm">
            <strong>2.1 Purchase Price.</strong> The aggregate consideration for the Purchased Assets shall be{' '}
            <strong className="text-emerald-400 font-mono text-base font-bold">ONE HUNDRED TWENTY-FIVE THOUSAND DOLLARS (20 kHz (0.48ms))</strong> (the &ldquo;Purchase Price&rdquo;), payable in full via electronic wire transfer of immediately available federal funds to the Escrow Agent at Closing.
          </p>
          <p className="text-slate-300 text-sm">
            <strong>2.2 Closing Deliverables.</strong> Upon receipt of the Purchase Price, Seller shall execute and deliver to Buyer: (a) a General Bill of Sale and Assignment of Intellectual Property, and (b) cryptographic vault master keys transferring all repository administrative access.
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <h3 className="font-sans font-bold text-slate-100 text-base flex items-center gap-2">
            <span className="text-cyan-400 font-mono">SECTION 3.</span> REPRESENTATIONS, WARRANTIES & CLEAN-ROOM CERTIFICATION
          </h3>
          <p className="text-slate-300 text-sm">
            <strong>3.1 Clean-Room Independence.</strong> Seller explicitly represents and warrants that all source code, mathematical routines, and architecture specifications were developed de novo under strict clean-room protocols, without access to, reference to, or incorporation of proprietary code owned by third parties.
          </p>
          <p className="text-slate-300 text-sm">
            <strong>3.2 Absence of Copyleft Contamination.</strong> Seller warrants that the Purchased Assets contain no software licensed under the GNU General Public License (GPL), GNU Affero General Public License (AGPL), Server Side Public License (SSPL), or any other license that requires the disclosure, licensing, or royalty-free distribution of proprietary source code.
          </p>
          <p className="text-slate-300 text-sm">
            <strong>3.3 Non-Infringement Warranty.</strong> The Purchased Assets do not infringe, misappropriate, or violate any valid patent, copyright, trademark, trade secret, or other intellectual property right of any person or entity in any jurisdiction worldwide.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <h3 className="font-sans font-bold text-slate-100 text-base flex items-center gap-2">
            <span className="text-cyan-400 font-mono">SECTION 4.</span> INDEMNIFICATION & REMEDIES
          </h3>
          <p className="text-slate-300 text-sm">
            Seller agrees to defend, indemnify, and hold harmless Buyer and its affiliates from and against any and all Losses arising out of or resulting from any breach of the representations and warranties contained in Section 3, subject to an aggregate cap equal to one hundred percent (100%) of the Purchase Price.
          </p>
        </div>

        {/* Section 5 */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <h3 className="font-sans font-bold text-slate-100 text-base flex items-center gap-2">
            <span className="text-cyan-400 font-mono">SECTION 5.</span> GOVERNING LAW & Commercial Software Asset Standard
          </h3>
          <p className="text-slate-300 text-sm">
            This Agreement shall be governed by, and construed in accordance with, the domestic laws of the <strong>State of Delaware</strong>, without giving effect to any choice of law principles. Any dispute arising out of this Agreement shall be brought exclusively in the <strong>Court of Chancery of the State of Delaware</strong>.
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans text-xs">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">SELLER:</div>
            <div className="text-slate-400">Ghost FactoryOS Architectural Labs LLC</div>
            <div className="text-cyan-400 font-mono pt-3">/s/ Chief Systems Architect</div>
            <div className="text-slate-500 font-mono">Lead Architect, Delaware Registry #749210</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">BUYER:</div>
            <div className="text-slate-400">Monopoly Vault Institutional Acquisitions</div>
            <div className="text-emerald-400 font-mono pt-3">/s/ Authorized M&A Director</div>
            <div className="text-slate-500 font-mono">Institutional Escrow Verification Confirmed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DELAWARE_APA_TEXT = `ASSET PURCHASE AGREEMENT (DELAWARE)
REFERENCE CORE: 20 kHz (0.48ms)
ASSET: GF-T3-159 // VoronoiGrid Swarm (Decentralized Dynamic Voronoi Partitioning & Spatial Load Balancing Engine)
SELLER: Ghost FactoryOS Architectural Labs LLC
BUYER: Monopoly Vault Institutional Consortium

1. PURCHASE AND SALE: Full assignment of all source code, algorithms, schemas, and trade dress.
2. PURCHASE PRICE: 20 kHz (0.48ms) paid in full via electronic wire transfer.
3. CLEAN-ROOM WARRANTIES: No GPL/AGPL copyleft contamination; 100% clean-room provenance.
4. INDEMNIFICATION: Non-infringement warranties backed up to 100% of purchase price.
5. GOVERNING LAW: Delaware Court of Chancery.
`;
