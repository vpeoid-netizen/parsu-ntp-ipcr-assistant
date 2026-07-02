export type PersonnelCategory =
  | "DIRECTOR_UNIT_HEAD"
  | "ADMIN_STAFF"
  | "UNIVERSITY_DRIVER"
  | "PROJECT_BASED";

export type AppointmentType = "PERMANENT" | "CASUAL" | "COS";

export type EvaluationMode = "SELF_EVALUATION" | "VALIDATION";

export type FunctionCategory =
  | "CORE"
  | "STRATEGIC"
  | "SUPPORT"
  | "OTHER"
  | "PASSENGER_FEEDBACK";

export interface FunctionDeliverableState {
  id: string;
  functionCategory: FunctionCategory;
  deliverable: string;
  actualOutput?: string;
  qualityRating?: number;
  efficiencyRating?: number;
  timelinessRating?: number;
  qualityApplicable?: boolean;
  efficiencyApplicable?: boolean;
  timelinessApplicable?: boolean;
  evaluatorComments?: string;
}

export interface DesignationDeliverableState {
  id: string;
  deliverable: string;
  actualOutput?: string;
  qualityRating?: number;
  efficiencyRating?: number;
  timelinessRating?: number;
  qualityApplicable?: boolean;
  efficiencyApplicable?: boolean;
  timelinessApplicable?: boolean;
  evaluatorComments?: string;
}

export interface EvaluationProfile {
  employeeName: string;
  positionTitle: string;
  personnelCategory: PersonnelCategory;
  officeCode: string;
  officeName: string;
  functionalDepartment: string;
  supervisingOffice: string;
  appointmentType: AppointmentType;
  evaluationYear: number;
  ratingPeriod: string;
  supervisorName?: string;
  hasDesignation: boolean;
  designationTitle?: string;
}

export interface EvaluationState {
  mode: EvaluationMode;
  currentStep: number;
  profile: EvaluationProfile;
  functionDeliverables: FunctionDeliverableState[];
  passengerFeedbackRating?: number;
  designationDeliverables: DesignationDeliverableState[];
}
