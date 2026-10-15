#!/usr/bin/env python3
"""
inject_typography_boost.py
Injects the global typography scale into Track 2 demo applications (GF-T2-086 through GF-T2-137).
"""

import os
import glob

STYLE_BLOCK = """  <style id="gf-typography-boost">
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

TARGET_DIRS = [
    "tools/ghost-factory-console/public/demos",
    "catalog/track-2"
]

patched_in_console = 0
patched_in_catalog = 0

for base_dir in TARGET_DIRS:
    for slot in range(86, 138):
        unit_id = f"gf-t2-{slot:03d}"
        file_path = os.path.join(base_dir, unit_id, "index.html")
        
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} does not exist!")
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        if 'id="gf-typography-boost"' in content:
            print(f"Already present in {file_path}, skipping.")
            continue
            
        if "</head>" not in content:
            print(f"Warning: No </head> tag found in {file_path}!")
            continue
            
        new_content = content.replace("</head>", STYLE_BLOCK + "</head>")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
            
        if "tools/ghost-factory-console" in base_dir:
            patched_in_console += 1
        else:
            patched_in_catalog += 1

print(f"Successfully patched in tools/ghost-factory-console/public/demos: {patched_in_console} files")
print(f"Successfully patched in catalog/track-2: {patched_in_catalog} files")
