/**
 * SEMS — Suryadhi Education Management System
 * Brand Configuration File
 *
 * ⚡ IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all branding.
 * Edit values here and the entire application updates automatically.
 * No other files should hard-code brand names.
 */

// ─── Logo asset imports ───────────────────────────────────────────────────────
// Main Brand Logo — Suryadhi Learning Private Limited
import suryadhiMainLogo from '@/assets/logos/suryadhi-main.png';
// Sub-Brand 1 — Unix Global Pre School
import unixGlobalPreschoolLogo from '@/assets/logos/unix-global-preschool.png';
// Sub-Brand 2 — Utopia World Pre School
import utopiaWorldPreschoolLogo from '@/assets/logos/utopia-world-preschool.png';
// Sub-Brand 3 — Utopia Global School
import utopiaGlobalSchoolLogo from '@/assets/logos/utopia-global-school.png';

// ─── Brand Config ─────────────────────────────────────────────────────────────
export const BRAND = {
  /** Short system name displayed on login, sidebar, header badge */
  systemAbbr: 'SEMS',

  /** Full system name */
  systemName: 'Suryadhi Education Management System',

  /** Login page sub-tagline */
  systemTagline: 'SEMS — Suryadhi Education Management System',

  /** Parent company legal name */
  companyName: 'Suryadhi Learning Pvt. Ltd.',

  /** Short company reference */
  companyShort: 'Suryadhi',

  /** Suryadhi Group umbrella name */
  groupName: 'Suryadhi Group',

  /** Default franchise details */
  franchiseCode: 'SNK-Dhule-Deopur',
  franchiseName: 'SNK - Dhule - Deopur',

  /** System version tag shown in sidebar */
  version: 'SEMS v2.0',

  /** Copyright footer line */
  copyright: '© 2026 Suryadhi Learning Pvt. Ltd.',

  /** White-label powered-by footer */
  poweredBy: 'Powered by SEMS — Suryadhi Learning Pvt. Ltd.',

  /** Tagline */
  tagline: 'Meditate · Innovate · Educate',

  // ─── Main Logo ──────────────────────────────────────────────────────────────
  /** Main circular/icon brand mark */
  iconSrc: suryadhiMainLogo,

  /** Main full brand logo: SURYADHI LEARNING PRIVATE LIMITED */
  logoSrc: suryadhiMainLogo,

  /** Tagline wordmark */
  taglineLogoSrc: suryadhiMainLogo,

  /** SEMS badge logo */
  semsBadgeSrc: suryadhiMainLogo,

  // ─── 3 Sub-Brands ───────────────────────────────────────────────────────────
  subBrands: [
    {
      id: 'UNIX',
      name: 'Unix Global Pre School',
      shortName: 'Unix Global',
      fullName: 'Unix Global Pre School',
      desc: 'Pre-School & Early Childhood Center',
      code: 'UGPS',
      color: 'blue',
      logoSrc: unixGlobalPreschoolLogo,
    },
    {
      id: 'UTOPIA_WORLD',
      name: 'Utopia World Pre School',
      shortName: 'Utopia World',
      fullName: 'Utopia World Pre School',
      desc: 'World Pre-School & Day Care Network',
      code: 'UWPS',
      color: 'teal',
      logoSrc: utopiaWorldPreschoolLogo,
    },
    {
      id: 'UTOPIA_GLOBAL',
      name: 'Utopia Global School',
      shortName: 'Utopia Global',
      fullName: 'Utopia Global School',
      desc: 'K-12 & Global Foundation School',
      code: 'UGS',
      color: 'indigo',
      logoSrc: utopiaGlobalSchoolLogo,
    },
  ],

  // ─── Applications / Sub-Brand Portals ──────────────────────────────────────
  portals: [
    {
      name: 'Unix Global Pre School',
      fullName: 'Unix Global Pre School',
      desc: 'Pre-School Franchise & Fee Management',
      color: 'blue',
      logoSrc: unixGlobalPreschoolLogo,
    },
    {
      name: 'Utopia World Pre School',
      fullName: 'Utopia World Pre School',
      desc: 'World Pre-School Network & Admissions',
      color: 'teal',
      logoSrc: utopiaWorldPreschoolLogo,
    },
    {
      name: 'Utopia Global School',
      fullName: 'Utopia Global School',
      desc: 'K-12 Foundation & Master Operations',
      color: 'indigo',
      logoSrc: utopiaGlobalSchoolLogo,
    },
  ],

  // ─── Verticals (for reference in reports, documents) ────────────────────────
  verticals: [
    {
      id: 'UNIX',
      name: 'Unix Global Pre School',
      short: 'Unix Global',
      type: 'Franchise Pre-School',
      logoSrc: unixGlobalPreschoolLogo,
    },
    {
      id: 'UTOPIA_WORLD',
      name: 'Utopia World Pre School',
      short: 'Utopia World',
      type: 'Premium Pre-School Chain',
      logoSrc: utopiaWorldPreschoolLogo,
    },
    {
      id: 'UTOPIA_GLOBAL',
      name: 'Utopia Global School',
      short: 'Utopia School',
      type: 'K-12 School Chain',
      logoSrc: utopiaGlobalSchoolLogo,
    },
    {
      id: 'SEMS',
      name: 'Suryadhi Education Management System',
      short: 'SEMS',
      type: 'Master Franchise ERP',
      logoSrc: suryadhiMainLogo,
    },
  ],

  // ─── App / Parent App references ────────────────────────────────────────────
  parentApp: 'SEMS Parent App',
  parentAppFull: 'SEMS Parent Mobile Application',

  // ─── HQ reference (used in purchase orders, invoices) ───────────────────────
  hqName: 'Suryadhi Learning Pvt. Ltd. — HQ',
} as const;

export type PortalName = (typeof BRAND.portals)[number]['name'];
export type VerticalId = (typeof BRAND.verticals)[number]['id'];
export type SubBrand = (typeof BRAND.subBrands)[number];
