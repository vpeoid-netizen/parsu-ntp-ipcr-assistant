import type { FunctionCategory, PersonnelCategory } from "@/lib/types";

export const RULESET_VERSION = "FY 2026 Non-Teaching Personnel v1.0";

export const RATING_PERIODS = ["January–June", "July–December"];

export const PERSONNEL_CATEGORIES: {
  code: PersonnelCategory;
  label: string;
  description: string;
}[] = [
  {
    code: "DIRECTOR_UNIT_HEAD",
    label: "Director / Unit Head",
    description: "Directors, CAOs, College Deans, and unit heads",
  },
  {
    code: "ADMIN_STAFF",
    label: "Office / Unit / Administrative Staff",
    description: "Regular non-teaching personnel in offices, divisions, and units",
  },
  {
    code: "UNIVERSITY_DRIVER",
    label: "Full-Time University Driver",
    description: "University drivers with passenger feedback component",
  },
  {
    code: "PROJECT_BASED",
    label: "Project-Based Personnel",
    description: "Research, extension, academic, or administrative project-based staff",
  },
];

export const FUNCTIONAL_DEPARTMENTS = [
  {
    code: "GASS",
    name: "General Administration & Support Services",
    supervisingOffice: "Office of the Vice President for Administration & Finance",
  },
  {
    code: "SAO",
    name: "Support to Academic Operations",
    supervisingOffice: "Office of the Vice President for Academic Affairs",
  },
  {
    code: "ADU",
    name: "Academic Delivery Units",
    supervisingOffice: "Office of the Vice President for Academic Affairs",
  },
  {
    code: "EO",
    name: "Executive Operations",
    supervisingOffice:
      "Office of the Vice President for Executive Operations & Institutional Development",
  },
  {
    code: "REO",
    name: "Research & Extension Operations",
    supervisingOffice: "Office of the Vice President for Research & Extension",
  },
  {
    code: "PRES",
    name: "Office of the University President",
    supervisingOffice: "Board of Regents",
  },
] as const;

export interface OfficeEntry {
  code: string;
  name: string;
  department: (typeof FUNCTIONAL_DEPARTMENTS)[number]["code"];
  campus?: string;
}

export const OFFICES: OfficeEntry[] = [
  { code: "OUP", name: "Office of the University President", department: "PRES" },
  { code: "OUBS", name: "Office of the University & Board Secretary", department: "PRES" },
  { code: "PMSO", name: "Presidential Management Staff Office", department: "PRES" },
  { code: "OVPAF", name: "Office of the Vice President for Administration & Finance", department: "GASS" },
  { code: "ASD", name: "Administrative Services Division", department: "GASS" },
  { code: "HRMU", name: "Human Resource Management Unit", department: "GASS" },
  { code: "SPMU", name: "Supply & Property Management Unit", department: "GASS" },
  { code: "RMU", name: "Records Management Unit", department: "GASS" },
  { code: "PROC", name: "Procurement Unit", department: "GASS" },
  { code: "CASH", name: "Cashiering Unit", department: "GASS" },
  { code: "GSU", name: "General Services Unit", department: "GASS" },
  { code: "FSD", name: "Finance Services Division", department: "GASS" },
  { code: "BUD", name: "Budget Unit", department: "GASS" },
  { code: "ACCT", name: "Accounting Unit", department: "GASS" },
  { code: "AUX", name: "Auxiliary Services Division", department: "GASS" },
  { code: "PMU", name: "Production and Marketing Unit", department: "GASS" },
  { code: "DORM", name: "Dormitories Unit", department: "GASS" },
  { code: "FOOD", name: "Food Services Unit", department: "GASS" },
  { code: "IRD", name: "Institutional Resilience Division", department: "GASS" },
  { code: "SSSU", name: "Safety & Security Services Unit", department: "GASS" },
  { code: "DRRM", name: "Disaster Risk Reduction Management Unit", department: "GASS" },
  { code: "OVPAA", name: "Office of the Vice President for Academic Affairs", department: "SAO" },
  { code: "OSAS", name: "Office of Student Affairs & Services", department: "SAO" },
  { code: "GCU", name: "Guidance & Counselling Unit", department: "SAO" },
  { code: "CAU", name: "Culture & Arts Unit", department: "SAO" },
  { code: "HSU", name: "Health Services Unit", department: "SAO" },
  { code: "SSNS", name: "Students & Special Needs Services Unit", department: "SAO" },
  { code: "PLAC", name: "Placement Unit", department: "SAO" },
  { code: "SAU", name: "Sports & Athletics Unit", department: "SAO" },
  { code: "ADM", name: "Admissions Unit", department: "SAO" },
  { code: "SSU", name: "Student Scholarship Unit", department: "SAO" },
  { code: "URO", name: "University Registrar's Office", department: "SAO" },
  { code: "LSO", name: "Library Services Office", department: "SAO" },
  { code: "NSTP", name: "National Service Training Program Office", department: "SAO" },
  { code: "COS", name: "College of Science", department: "ADU", campus: "Goa" },
  { code: "CAH", name: "College of Arts & Humanities", department: "ADU", campus: "Goa" },
  { code: "CBM", name: "College of Business & Management", department: "ADU", campus: "Goa" },
  { code: "CED", name: "College of Education", department: "ADU", campus: "Goa" },
  { code: "CECS", name: "College of Engineering & Computational Sciences", department: "ADU", campus: "Goa" },
  { code: "CSCE", name: "College of Sustainable Communities & Ecosystems", department: "ADU", campus: "Caramoan" },
  { code: "CHTM", name: "College of Hospitality & Tourism Management", department: "ADU", campus: "San Jose" },
  { code: "CPSCH", name: "College of Public Safety & Community Health", department: "ADU", campus: "Lagonoy" },
  { code: "CACD", name: "College of Agribusiness & Community Development", department: "ADU", campus: "Salogon" },
  { code: "CFMS", name: "College of Fisheries & Marine Science", department: "ADU", campus: "Sagnay" },
  { code: "CESD", name: "College of Environmental Science & Design", department: "ADU", campus: "Tinambac" },
  { code: "OVPEOID", name: "Office of the Vice President for Executive Operations & Institutional Development", department: "EO" },
  { code: "IPDO", name: "Institutional Planning & Development Office", department: "EO" },
  { code: "LSO_LEGAL", name: "Legal Services Office", department: "EO" },
  { code: "QAO", name: "Quality Assurance Office", department: "EO" },
  { code: "CPRO", name: "Communications & Public Relations Office", department: "EO" },
  { code: "PMO", name: "Project Management Office", department: "EO" },
  { code: "ICTO", name: "Information & Communication Technology Office", department: "EO" },
  { code: "IAO", name: "Internal Audit Office", department: "EO" },
  { code: "AAO", name: "Alumni Affairs Office", department: "EO" },
  { code: "IAFO", name: "International Affairs Office", department: "EO" },
  { code: "GADO", name: "Gender & Development Office", department: "EO" },
  { code: "OVPRE", name: "Office of the Vice President for Research & Extension", department: "REO" },
  { code: "RPSD", name: "Research & Publication Services Division", department: "REO" },
  { code: "RCWU", name: "Research & Creative Works Unit", department: "REO" },
  { code: "PPU", name: "Publication & Printing Unit", department: "REO" },
  { code: "TTPU", name: "Technology Transfer & Patent Unit", department: "REO" },
  { code: "ESD", name: "Extension Services Division", department: "REO" },
  { code: "EXTU", name: "Extension Unit", department: "REO" },
  { code: "MIAU", name: "Monitoring & Impact Assessment Unit", department: "REO" },
];

export const COMMON_POSITIONS = [
  "University President",
  "Vice President",
  "Director",
  "Chief Administrative Officer",
  "College Dean",
  "Head",
  "Administrative Officer",
  "Administrative Aide",
  "Administrative Assistant",
  "Clerk",
  "Staff",
  "University Driver",
  "Project Staff",
  "Other",
];

export const FUNCTION_CATEGORY_LABELS: Record<FunctionCategory, string> = {
  CORE: "Core Functions",
  STRATEGIC: "Strategic Functions",
  SUPPORT: "Support Functions",
  OTHER: "Other Functions",
  PASSENGER_FEEDBACK: "Passenger's Feedback",
};

export const FUNCTION_WEIGHTS: Record<
  PersonnelCategory,
  Partial<Record<FunctionCategory, number>>
> = {
  DIRECTOR_UNIT_HEAD: { CORE: 0.6, STRATEGIC: 0.3, OTHER: 0.1 },
  ADMIN_STAFF: { CORE: 0.5, STRATEGIC: 0.2, SUPPORT: 0.2, OTHER: 0.1 },
  UNIVERSITY_DRIVER: {
    CORE: 0.5,
    SUPPORT: 0.1,
    OTHER: 0.2,
    PASSENGER_FEEDBACK: 0.2,
  },
  PROJECT_BASED: { CORE: 0.5, STRATEGIC: 0.2, SUPPORT: 0.2, OTHER: 0.1 },
};

export function getApplicableFunctionCategories(
  category: PersonnelCategory
): FunctionCategory[] {
  const weights = FUNCTION_WEIGHTS[category];
  return (Object.keys(weights) as FunctionCategory[]).filter(
    (key) => key !== "PASSENGER_FEEDBACK" && (weights[key] ?? 0) > 0
  );
}

export function hasPassengerFeedback(category: PersonnelCategory): boolean {
  return (FUNCTION_WEIGHTS[category].PASSENGER_FEEDBACK ?? 0) > 0;
}

export function getFunctionWeight(
  category: PersonnelCategory,
  functionCategory: FunctionCategory
): number {
  return FUNCTION_WEIGHTS[category][functionCategory] ?? 0;
}

export function getDepartmentMeta(code: string) {
  return FUNCTIONAL_DEPARTMENTS.find((d) => d.code === code);
}

export function getOfficeMeta(code: string) {
  return OFFICES.find((o) => o.code === code);
}
