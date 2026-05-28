export type AssessmentStatus = 'good' | 'gaps' | 'not-found' | 'needs-info';
export type AssessmentPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Resource {
  name: string;
  url: string;
  description: string;
}

export interface AssessmentArea {
  id: number;
  title: string;
  context: string;
  whatWeFound: string[];
  openQuestions: string[];
  recommendations: string[];
  resources: Resource[];
  status: AssessmentStatus;
  statusLabel: string;
  priority: AssessmentPriority;
}

export interface OrgEvent {
  name: string;
  when: string;
  format: string;
}

export interface OrgFunder {
  name: string;
  note: string;
}

export interface PriorityPhase {
  phase: string;
  label: string;
  actions: string[];
}

export interface LegalNote {
  framework: string;
  description: string;
  action: string;
}

export interface ResourceCategory {
  category: string;
  items: Resource[];
}

export interface ServicePrice {
  community: string;
  small: string;
  established: string;
  large: string;
}

export interface Service {
  name: string;
  prices: ServicePrice;
}

export interface ReportData {
  org: {
    name: string;
    slug: string;
    abbreviation?: string;
    location: string;
    type: string;
    overview: string;
    preparedDate: string;
    assessmentDate: string;
    coverPhoto?: string;
  };
  events: OrgEvent[];
  funders: OrgFunder[];
  assessmentAreas: AssessmentArea[];
  priorityPhases: PriorityPhase[];
  legalNotes: LegalNote[];
  keyResources: ResourceCategory[];
  services: Service[];
}
