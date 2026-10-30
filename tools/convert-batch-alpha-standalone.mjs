import fs from 'fs';
import path from 'path';

const ALPHA_UNITS = [
  { dir: '01-apex-telemetry', title: 'APEX-TELEMETRY // Track 2 Hypercar Flagship Cockpit', component: 'ApexTelemetryCockpit' },
  { dir: '02-vault-guard', title: 'VAULT-GUARD // Track 2 Hypercar Flagship Cockpit', component: 'VaultGuardCockpit' },
  { dir: '03-orbit-pipeline', title: 'ORBIT-PIPELINE // Track 2 Hypercar Flagship Cockpit', component: 'OrbitPipelineCockpit' },
  { dir: '04-chrono-pulse', title: 'CHRONO-PULSE // Track 2 Hypercar Flagship Cockpit', component: 'ChronoPulseCockpit' },
  { dir: '05-synapse-audit', title: 'SYNAPSE-AUDIT // Track 2 Hypercar Flagship Cockpit', component: 'SynapseAuditCockpit' }
];

const ROOT_DIR = process.cwd();
const COCKPITS_DIR = path.join(ROOT_DIR, 'cockpits');

for (const unit of ALPHA_UNITS) {
  const unitDir = path.join(COCKPITS_DIR, unit.dir);
  const appJsxPath = path.join(unitDir, 'src', 'App.jsx');
  const indexHtmlPath = path.join(unitDir, 'index.html');

  if (!fs.existsSync(appJsxPath)) {
    console.error(`Missing App.jsx in ${unit.dir}`);
    continue;
  }

  let appCode = fs.readFileSync(appJsxPath, 'utf8');

  // Strip `import React...` and `export default`
  appCode = appCode.replace(/import\s+React[^\n]*\n/g, '');
  appCode = appCode.replace(/export\s+default\s+function/g, 'function');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${unit.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #05070B; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19",
        "react-dom/client": "https://esm.sh/react-dom@19/client"
      }
    }
  </script>
</head>
<body class="bg-[#05070B] text-slate-100 antialiased">
  <div id="root"></div>

  <script type="text/babel" data-type="module">
    import React, { useState, useEffect, useRef } from 'react';
    import ReactDOM from 'react-dom/client';

${appCode}

    ReactDOM.createRoot(document.getElementById('root')).render(<${unit.component} />);
  </script>
</body>
</html>`;

  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log(`✓ Converted ${unit.dir}/index.html to standalone Babel+React19 ESM`);
}
