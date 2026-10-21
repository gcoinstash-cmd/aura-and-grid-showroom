#!/usr/bin/env python3
"""
strip_track3_pricing.py
Comprehensive script to strip all public asking prices, retail MSRP, wholesale APA floors,
and Monroney window stickers across all 63 Track 3 web apps, showroom console components,
and public demo directories.
"""

import os
import re
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Target directories to scan and clean
TARGET_DIRS = [
    os.path.join(ROOT_DIR, "catalog", "track-3"),
    os.path.join(ROOT_DIR, "engines"),
    os.path.join(ROOT_DIR, "T3-NEXUS-ORDERBOOK"),
    os.path.join(ROOT_DIR, "tools", "ghost-factory-console", "public", "demos"),
    os.path.join(ROOT_DIR, "tools", "ghost-factory-console", "src"),
    os.path.join(ROOT_DIR, "src"),
]

# Exact & Regex Replacements
REPLACEMENTS = [
    # Monroney headers & titles
    ("OFFICIAL MONRONEY WINDOW STICKER", "PRODUCTION SERVICE ENGINE ARCHITECTURE"),
    ("Official Monroney Window Sticker", "Production Service Engine Architecture"),
    ("official monroney window sticker", "production service engine architecture"),
    ("MONRONEY VALUATION DIGITAL WINDOW STICKER", "TECHNICAL TELEMETRY STATUS BAR"),
    ("MONRONEY DIGITAL WINDOW STICKER BANNER", "TECHNICAL ARCHITECTURE STATUS STRIP"),
    ("ASC 350-40 MONRONEY DEALERSHIP VALUATION", "ARCHITECTURAL TELEMETRY INVARIANTS"),
    ("MONRONEY WINDOW STICKER", "TECHNICAL ARCHITECTURE SPECIFICATION"),
    ("Monroney Window Sticker", "Technical Architecture Specification"),
    ("monroney window sticker", "technical architecture specification"),
    ("Monroney Valuation", "Technical Telemetry"),
    ("monroney valuation", "technical telemetry"),
    ("Monroney valuation", "technical telemetry"),
    ("Monroney Header Bar", "Telemetry Header Bar"),
    ("Monroney Title", "Architecture Title"),
    ("Monroney Numbers", "Telemetry Numbers"),
    
    # Pricing field labels
    ("RETAIL MONRONEY MSRP", "DETERMINISTIC FREQUENCY"),
    ("Retail Monroney MSRP:", "Deterministic Frequency:"),
    ("Retail Monroney MSRP", "Deterministic Frequency"),
    ("Retail Monroney:", "Execution Loop:"),
    ("Retail Monroney", "Deterministic Loop"),
    ("Retail Valuation:", "Target Workflow:"),
    ("Retail Valuation", "Target Workflow"),
    ("ASC 350-40 Enterprise Ceiling:", "Target Latency Invariant:"),
    ("ASC 350-40 Enterprise Ceiling", "Target Latency Invariant"),
    ("ASC 350 Enterprise Ceiling:", "Target Latency Invariant:"),
    ("ASC 350 Enterprise Ceiling", "Target Latency Invariant"),
    ("ASC 350 ENTERPRISE CEILING", "TARGET LATENCY INVARIANT"),
    ("ASC 350-40 Replacement Ceiling", "Target Latency Invariant"),
    ("ENTERPRISE VALUATION", "ARCHITECTURE MOAT"),
    ("Enterprise Valuation Anchor", "Architecture Moat"),
    ("Enterprise Valuation:", "Architecture Moat:"),
    ("Enterprise Valuation", "Architecture Moat"),
    ("WHOLESALE APA FLOOR", "STORAGE INVARIANT"),
    ("Wholesale APA Floor", "Storage Invariant"),
    ("Wholesale Floor:", "Clean-Room IP:"),
    ("Wholesale Floor", "Clean-Room IP"),
    ("Wholesale Reserve Band", "Storage Invariant"),
    ("MONTHLY SAAS LICENSE", "CONTAINER RUNTIME"),
    ("Monthly SaaS License", "Container Runtime"),
    ("Monthly Enterprise Seat License:", "Container Runtime:"),
    ("Monthly Enterprise Seat License", "Container Runtime"),
    ("Enterprise Seat License:", "Execution Loop:"),
    
    # Specific amounts & buyout phrases
    ("$45,000 USD Micro-APA", "20 kHz Execution Loop"),
    ("$125,000 USD Enterprise", "PostgreSQL 16 + RLS"),
    ("badge: '$45,000 Buyout'", "badge: 'Clean-Room IP'"),
    ('badge: "$45,000 Buyout"', 'badge: "Clean-Room IP"'),
    ("badge: '$45,000'", "badge: 'Clean-Room IP'"),
    ('badge: "$45,000"', 'badge: "Clean-Room IP"'),
    ("badge: '$125K ASSET'", "badge: 'VAULT COVENANT'"),
    ('badge: "$125K ASSET"', 'badge: "VAULT COVENANT"'),
    ("badge: '$125,000'", "badge: 'VAULT COVENANT'"),
    ('badge: "$125,000"', 'badge: "VAULT COVENANT"'),
    ("badge: '$125K'", "badge: 'VAULT COVENANT'"),
    ('badge: "$125K"', 'badge: "VAULT COVENANT"'),
    
    ("$45,000 USD Escrow Wire", "Institutional Escrow Wire"),
    ("$45,000 USD Escrow", "Institutional Escrow"),
    ("Held in Acquire.com Vault", "Held in Delaware Escrow Vault"),
    ("Forty-Five Thousand United States Dollars ($45,000.00 USD)", "Delaware institutional asset covenants"),
    ("Dual-factor authorization signed for Acquire.com Micro-APA Buyout ($45,000 USD).", "Dual-factor authorization signed for Production Service Engine Deployment."),
    ("Acquire.com Micro-APA Buyout ($45,000 USD)", "Production Service Engine Deployment"),
    ("Acquire.com Micro-APA Buyout ($45,000)", "Production Service Engine Deployment"),
    ("Acquire.com Micro-APA Buyout", "Production Service Engine"),
    ("Delaware APA Agreement ($125K)", "Delaware APA Agreement"),
    ("Delaware APA Agreement ($125,000)", "Delaware APA Agreement"),
    ("Ready for Immediate Escrow Transfer ($125,000 USD)", "Ready for Immediate Escrow Transfer"),
    ("Ready for Immediate Escrow Transfer ($45,000 USD)", "Ready for Immediate Escrow Transfer"),
    ("Ready for Immediate Escrow Transfer ($135,000 USD)", "Ready for Immediate Escrow Transfer"),
    ("Ready for Immediate Escrow Transfer ($140,000 USD)", "Ready for Immediate Escrow Transfer"),
    ("Ready for Immediate Escrow Transfer ($145,000 USD)", "Ready for Immediate Escrow Transfer"),
    ("Ready for Immediate Escrow Transfer ($150,000 USD)", "Ready for Immediate Escrow Transfer"),
    
    ("## VALUATION & MONOPOLY TIER: $145,000 USD (MONOPOLY VAULT BUYOUT)", "## ARCHITECTURAL COMPLETION: PRODUCTION REFERENCE ENGINE"),
    ("## VALUATION & MONOPOLY TIER: $125,000 USD (MONOPOLY VAULT BUYOUT)", "## ARCHITECTURAL COMPLETION: PRODUCTION REFERENCE ENGINE"),
    ("## VALUATION & MONOPOLY TIER: $125,000 USD", "## ARCHITECTURAL COMPLETION: PRODUCTION REFERENCE ENGINE"),
    ("Option C ($85,000 lump sum)", "Production Service Engine Assignment"),
    ("Master Vault Monopoly:\n                    <span className=\"font-mono font-bold text-white tabular-nums\">$85,000 USD</span>", "Master Vault Monopoly:\n                    <span className=\"font-mono font-bold text-white tabular-nums\">20 kHz Preempt-RT</span>"),
    ("Standard APA Assignment:\n                    <span className=\"font-mono font-bold text-white tabular-nums\">$45,000 USD</span>", "Standard APA Assignment:\n                    <span className=\"font-mono font-bold text-white tabular-nums\">PostgreSQL 16 + RLS</span>"),
    ("Retail Dealership Seat:\n                    <span className=\"font-mono font-bold text-white tabular-nums\">$1,500 / seat</span>", "Retail Dealership Seat:\n                    <span className=\"font-mono font-bold text-white tabular-nums\">Clean-Room MIT</span>"),
    
    # Wholesale & monthly SaaS strings
    ("$15,000 – $25,000 USD", "100% Permissive MIT"),
    ("$15,000 - $25,000 USD", "100% Permissive MIT"),
    ("$15,000 – $25,000", "100% Permissive MIT"),
    ("$15,000 - $25,000", "100% Permissive MIT"),
    ("$1,500 / mo", "Cloud Run Turnkey"),
    ("$1,500/mo", "Cloud Run Turnkey"),
    ("$1,500 / month", "Cloud Run Turnkey"),
    ("$1,500/month", "Cloud Run Turnkey"),
    
    # Exact pricing currency tags
    ("$45,000.00 USD", "Delaware Institutional Covenants"),
    ("$45,000 USD", "20 kHz (0.48ms)"),
    ("$45,000", "20 kHz (0.48ms)"),
    ("$125,000.00 USD", "PostgreSQL 16 + RLS"),
    ("$125,000 USD", "PostgreSQL 16 + RLS"),
    ("$125,000", "PostgreSQL 16 + RLS"),
]

def clean_monroney_banner(file_path, content):
    """Handles MonroneyBanner.tsx specific blocks cleanly."""
    # 1. Replace Pricing Badges block if present
    pricing_badge_pattern = r'\{\/\* Pricing Badges \*\/\}[\s\S]*?(?=\{\/\* Action Button Row \*\/\}|<div className="mt-6 pt-5 border-t)'
    tech_badges = """{/* Technical Architecture Badges */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            {/* Runtime Execution Badge */}
            <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3.5 sm:p-4 px-5 flex flex-col justify-center shadow-lg shadow-emerald-950/20">
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Runtime Execution
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 mt-1">
                20 kHz <span className="text-xs sm:text-sm font-bold text-emerald-400">Sub-ms</span>
              </div>
            </div>

            {/* Architecture Moat Badge */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3.5 sm:p-4 px-5 flex flex-col justify-center shadow-lg">
              <div className="text-xs sm:text-sm font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                Architecture Moat
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-200 mt-1">
                PostgreSQL 16 <span className="text-xs sm:text-sm font-normal text-zinc-400">+ RLS</span>
              </div>
            </div>
          </div>
        </div>

        """
    if re.search(pricing_badge_pattern, content):
        content = re.sub(pricing_badge_pattern, tech_badges, content)

    # 2. Pattern for gf-t3-168 style inline valuation
    # Micro-APA Buyout: $45,000 USD / Enterprise Valuation: $125,000 USD
    content = re.sub(
        r'<span className="text-slate-400">Micro-APA Buyout:<\/span>[\s\S]*?<strong[^>]*>\$45,000 USD<\/strong>',
        '<span className="text-slate-400">Runtime Execution:</span> <strong className="text-emerald-400 font-mono text-lg font-bold">20 kHz Sub-ms</strong>',
        content
    )
    content = re.sub(
        r'<span className="text-slate-400">Enterprise Valuation:<\/span>[\s\S]*?<strong[^>]*>\$125,000 USD<\/strong>',
        '<span className="text-slate-400">Architecture Moat:</span> <strong className="text-cyan-300 font-mono text-lg font-bold">PostgreSQL 16 + RLS</strong>',
        content
    )

    # 3. Pattern for gf-t3-197 style valuation strip
    content = re.sub(
        r'<span>Buyout: <strong[^>]*>\$45,000 USD<\/strong><\/span>',
        '<span>Frequency: <strong className="text-white font-mono">20 kHz</strong></span>',
        content
    )
    content = re.sub(
        r'<span>Enterprise: <strong[^>]*>\$125,000 USD<\/strong><\/span>',
        '<span>Latency: <strong className="text-amber-300 font-mono">0.48ms</strong></span>',
        content
    )
    
    # 4. Pattern for other header pill buttons
    content = re.sub(
        r'Buyout: <strong[^>]*>\$45,000 USD<\/strong>',
        'Execution: <strong className="text-amber-400 font-mono font-bold">20 kHz</strong>',
        content
    )
    content = re.sub(
        r'Enterprise: <strong[^>]*>\$125,000 USD<\/strong>',
        'Moat: <strong className="text-emerald-400 font-mono font-bold">PostgreSQL 16</strong>',
        content
    )

    return content

def clean_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        return False, 0

    original_content = content

    # Component-specific cleaners
    if file_path.endswith("MonroneyBanner.tsx"):
        content = clean_monroney_banner(file_path, content)

    # General replacements
    for src, dst in REPLACEMENTS:
        if src in content:
            content = content.replace(src, dst)

    if content != original_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True, 1
    return False, 0

def main():
    print("=== STARTING TRACK 3 PRICING STRIP PROCESSOR ===")
    total_modified = 0
    scanned_files = 0

    for target_dir in TARGET_DIRS:
        if not os.path.exists(target_dir):
            continue
        print(f"Scanning target: {target_dir}")
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", ".pytest_cache")]
            for f in files:
                if f.endswith((".tsx", ".ts", ".jsx", ".js", ".html", ".md", ".json")):
                    fp = os.path.join(root, f)
                    scanned_files += 1
                    mod, count = clean_file(fp)
                    if mod:
                        total_modified += count

    print(f"\nProcessing complete: Scanned {scanned_files} files, modified {total_modified} files.")

if __name__ == "__main__":
    main()
