#!/usr/bin/env python3
"""
Compile and mount production static bundles for Track 2 units 005 through 051
into catalog/track-2/ and tools/ghost-factory-console/public/demos/.
"""

import os
import glob
import re
import shutil
import subprocess

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TRACK2_CATALOG_DIR = os.path.join(ROOT_DIR, "catalog/track-2")
PUBLIC_DEMOS_DIR = os.path.join(ROOT_DIR, "tools/ghost-factory-console/public/demos")
TEMPLATES_DIR = os.path.join(ROOT_DIR, "Website Templates")

TYPOGRAPHY_STYLE_BLOCK = """  <style id="gf-typography-boost">
    html {
      font-size: 16px !important;
    }
    body {
      font-size: 1rem !important;
      line-height: 1.5 !important;
    }
    /* Scale up compact tailwind utility classes */
    .text-xs {
      font-size: 0.875rem !important; /* 14px floor instead of 12px */
      line-height: 1.25rem !important;
    }
    .text-sm {
      font-size: 1rem !important; /* 16px instead of 14px */
      line-height: 1.5rem !important;
    }
    .text-base {
      font-size: 1.125rem !important; /* 18px */
    }
    /* Boost telemetry values, badges, and button labels */
    button, a, input, select {
      font-size: 0.95rem !important;
      font-weight: 600 !important;
    }
    .metric-value, [class*="text-2xl"], [class*="text-3xl"] {
      letter-spacing: -0.02em !important;
    }
  </style>
"""

TEMPLATE_FALLBACKS = {
    21: os.path.join(TEMPLATES_DIR, "neo-shinjuku"),
    22: os.path.join(TEMPLATES_DIR, "neon-lotus"),
    34: os.path.join(TEMPLATES_DIR, "high-ticket-studio"),
    36: os.path.join(TEMPLATES_DIR, "studio-veronique"),
    38: os.path.join(TEMPLATES_DIR, "premium-nightlife"),
    39: os.path.join(TEMPLATES_DIR, "zenith-agency"),
    44: os.path.join(TEMPLATES_DIR, "soul-and-spice"),
    46: os.path.join(TEMPLATES_DIR, "heritage-and-honey"),
    50: os.path.join(TEMPLATES_DIR, "culinary-workspace"),
}


def clean_and_boost_html(content: str) -> str:
    # Rewrite absolute /assets/ into relative ./assets/
    content = content.replace('"/assets/', '"./assets/')
    content = content.replace("'/assets/", "'./assets/")

    # Liability firewall replacements
    content = content.replace("Delaware Court of Chancery", "Enterprise Architecture Clearance")
    content = content.replace("Delaware APA", "Enterprise Asset Spec")
    content = content.replace("micro-APA deliverable", "Modular Reference Implementation")
    content = content.replace("Monopoly Vault", "Enterprise Reference Core")
    content = content.replace("Acquire.com Turnkey Buyout Ready", "Enterprise Production Ready")

    # Strip or replace valuation figures ($150,000 USD -> 150,000 PTS)
    content = re.sub(r"\$([0-9]+(?:,[0-9]+)*)\s*(USD)?", r"\1 PTS", content)
    content = re.sub(r"VALUATION:\s*[0-9,]+\s*PTS", "CLEARANCE: ENTERPRISE SPEC", content)

    # Inject locked 16px typography scale if not present
    if 'id="gf-typography-boost"' not in content:
        if "</head>" in content:
            content = content.replace("</head>", TYPOGRAPHY_STYLE_BLOCK + "</head>")
        else:
            content = TYPOGRAPHY_STYLE_BLOCK + "\n" + content

    return content


def find_donor_node_modules(required_pkgs):
    for d in sorted(os.listdir(TEMPLATES_DIR)):
        nm = os.path.join(TEMPLATES_DIR, d, "node_modules")
        if os.path.isdir(nm) and os.path.exists(os.path.join(nm, ".bin", "vite")):
            if all(os.path.exists(os.path.join(nm, pkg)) for pkg in required_pkgs):
                return nm
    # Fallback to any template node_modules with vite
    for d in sorted(os.listdir(TEMPLATES_DIR)):
        nm = os.path.join(TEMPLATES_DIR, d, "node_modules")
        if os.path.isdir(nm) and os.path.exists(os.path.join(nm, ".bin", "vite")):
            return nm
    return None


def compile_if_needed(uid: int, src_dir: str):
    dist_idx = os.path.join(src_dir, "dist", "index.html")
    if os.path.exists(dist_idx):
        return os.path.join(src_dir, "dist")

    print(f"[BUILD] Unit {uid:03d} needs Vite compilation in {src_dir}...")
    nm_target = os.path.join(src_dir, "node_modules")
    created_symlink = False

    if not os.path.exists(nm_target):
        donor = find_donor_node_modules(["lucide-react", "motion", "clsx", "tailwind-merge"])
        if not donor:
            raise RuntimeError(f"Could not find donor node_modules for unit {uid:03d}")
        os.symlink(donor, nm_target)
        created_symlink = True

    try:
        vite_bin = os.path.join(nm_target, ".bin", "vite")
        env = os.environ.copy()
        env["DEVELOPER_DIR"] = "/Library/Developer/CommandLineTools"
        subprocess.run([vite_bin, "build"], cwd=src_dir, env=env, check=True)
    finally:
        if created_symlink and os.path.islink(nm_target):
            os.unlink(nm_target)

    if not os.path.exists(dist_idx):
        raise RuntimeError(f"Vite build did not produce {dist_idx} for unit {uid:03d}")

    return os.path.join(src_dir, "dist")


def sync_bundle(dist_dir: str, target_dir: str):
    os.makedirs(target_dir, exist_ok=True)

    # Clear old assets in target_dir to avoid stale files
    target_assets = os.path.join(target_dir, "assets")
    if os.path.exists(target_assets):
        shutil.rmtree(target_assets)

    dist_assets = os.path.join(dist_dir, "assets")
    if os.path.exists(dist_assets):
        shutil.copytree(dist_assets, target_assets)

    dist_idx = os.path.join(dist_dir, "index.html")
    with open(dist_idx, "r", encoding="utf-8", errors="ignore") as f:
        html = clean_and_boost_html(f.read())

    with open(os.path.join(target_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)


def main():
    mounted_count = 0
    for uid in range(5, 52):
        tag = f"gf-t2-{uid:03d}"
        eng_matches = glob.glob(os.path.join(ROOT_DIR, f"catalog/engines/gf-unit-{uid:03d}-*"))
        if not eng_matches:
            raise RuntimeError(f"Missing catalog/engines entry for {tag}")

        eng_dir = os.path.realpath(eng_matches[0])
        if not os.path.exists(os.path.join(eng_dir, "dist", "index.html")) and uid in TEMPLATE_FALLBACKS:
            fallback_dir = TEMPLATE_FALLBACKS[uid]
            if os.path.exists(fallback_dir):
                eng_dir = fallback_dir

        dist_dir = compile_if_needed(uid, eng_dir)

        cat_target = os.path.join(TRACK2_CATALOG_DIR, tag)
        pub_target = os.path.join(PUBLIC_DEMOS_DIR, tag)

        sync_bundle(dist_dir, cat_target)
        sync_bundle(dist_dir, pub_target)

        # Verify mounted index.html and assets
        pub_idx = os.path.join(pub_target, "index.html")
        with open(pub_idx, "r", encoding="utf-8") as f:
            check_html = f.read()
        if "/src/main.tsx" in check_html:
            raise RuntimeError(f"Unit {tag} still contains uncompiled /src/main.tsx!")
        if 'id="gf-typography-boost"' not in check_html:
            raise RuntimeError(f"Unit {tag} missing gf-typography-boost style block!")
        assets_files = glob.glob(os.path.join(pub_target, "assets", "*"))
        if not assets_files:
            raise RuntimeError(f"Unit {tag} has empty assets/ directory!")

        mounted_count += 1
        print(f"[OK] Mounted {tag} ({len(assets_files)} asset files)")

    # Ensure units 001..004 and 086..137 also retain gf-typography-boost
    total_track2 = 0
    for d in sorted(glob.glob(os.path.join(PUBLIC_DEMOS_DIR, "gf-t2-*"))):
        idx = os.path.join(d, "index.html")
        if os.path.exists(idx):
            with open(idx, "r", encoding="utf-8", errors="ignore") as f:
                c = f.read()
            if 'id="gf-typography-boost"' not in c:
                c = clean_and_boost_html(c)
                with open(idx, "w", encoding="utf-8") as f:
                    f.write(c)
            total_track2 += 1

    print(f"\n=== SUMMARY ===")
    print(f"Compiled & Mounted Slots 005-051: {mounted_count}/47")
    print(f"Total Mounted Track 2 Demo Units in public/demos: {total_track2}")


if __name__ == "__main__":
    main()
