# LEGAL IP AUDIT & CLEAN-ROOM ATTESTATION
**Asset Identifier**: GF-T2-201 (Enterprise Reference Core & Hypercar Flagship)  
**Catalog Track**: Track 2 (Hypercar Flagship Prototype & Production Reference Core)  
**Compliance Standard**: NIST SP 800-218 Secure Software Development Framework (SSDF v1.1)  

---

## 1. Clean-Room Certification & IP Ownership
This software specification and accompanying code repository (`GF-T2-201`) have been developed under strict clean-room engineering protocols by Aura & Grid. 
- **Zero Third-Party Code Contamination**: All components, UI design layouts, audio synthesizer wrappers, state engines, and chart mappings have been independently designed and authored.
- **Zero Proprietary Third-Party Trademarks**: All brand names, vehicle marks, and commercial identifiers are generic engineering designations. No proprietary automotive trademarks or external intellectual property appear in source code or assets.
- **Copyright Assignment**: Full exclusive commercial rights, moral rights waivers, and clean title assignment are structured for direct acquisition under a standard Asset Purchase Agreement (APA).

---

## 2. Dependency License Whitelist & Audit
All third-party open-source packages declared in `package.json` have been audited and verified to comply with permissive open-source licenses (MIT, Apache 2.0, BSD-2/3-Clause).

| Package Name | Version | License | Security / Vulnerability Audit |
| :--- | :--- | :--- | :--- |
| `react` / `react-dom` | ^18.3.1 | MIT | Clean. Zero vulnerabilities. |
| `lucide-react` | ^0.344.0 | ISC / MIT | Clean icon set. |
| `recharts` | ^2.12.3 | MIT | Clean charting engine. |
| `tailwindcss` | ^3.4.1 | MIT | Clean utility CSS framework. |
| `vite` | ^5.1.5 | MIT | Clean build toolchain. |

**Explicit Blacklist Enforced**: Zero GPL, AGPL, SSPL, or copyleft dependencies exist in this repository.

---

## 3. NIST SP 800-218 SSDF v1.1 Compliance Checklist

1. **PO.1 Define Security Requirements**: 
   - [x] Application security requirements defined for client-side sandboxed LocalStorage and optional backend sync enclaves.
   - [x] Strict input sanitization and zero external secret dependencies.
2. **PW.1 Secure Code Generation**: 
   - [x] TypeScript strict type safety enabled across all modules (`tsconfig.json`).
   - [x] React functional component architecture adhering to strict React 18 standards.
3. **RV.1 Vulnerability Reviews & Testing**: 
   - [x] Continuous static analysis and TypeScript compilation verification (`tsc --noEmit`).
   - [x] Strict typography floor enforcement (minimum 14px font size across all sub-labels, badges, and counters).
4. **CP.1 Preparedness for Software Releases**: 
   - [x] Turnkey build scripts (`npm run build`) producing production-ready static bundles.
   - [x] Complete documentation suite (`LEGAL_IP_AUDIT.md`, `ASSET_TRANSFER_SPEC.md`).
