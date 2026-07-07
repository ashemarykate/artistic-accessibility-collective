// Types for the event staffing price-out sheet: the purple companion document
// to the accessibility assessment report. One sheet per event engagement.

export interface StaffingRole {
  role: string;
  /** Plain-language description of what this role covers. */
  covers: string;
  /** Human-readable rate, e.g. "$95/hr per interpreter, 4 hour daily minimum"
   *  or "Scoped per event" for roles not priced on this sheet. */
  rate: string;
  /** What this engagement includes, e.g. "In this quote" / "N/A for this event". */
  engagement: string;
  /** Drives styling: included roles get the highlighted treatment. */
  included: boolean;
}

export interface StaffingStep {
  step: string;
  detail: string;
}

export interface StaffingSheetData {
  event: {
    name: string;
    slug: string;
    location: string;
    dates: string;
    /** One-line scope, e.g. "ASL interpretation for live performances". */
    scope: string;
    /** Short intro paragraph for the sheet. */
    overview: string;
    preparedDate: string;
  };
  roles: StaffingRole[];
  /** Universal "what you get with us" bullets, same spirit on every sheet. */
  whyUs: string[];
  /** The event-specific pitch: why AAC is the right fit for THIS event. */
  whyThisEvent: string[];
  /** How the engagement runs, start to finish. A true sequence. */
  steps: StaffingStep[];
  /** e.g. "Numbers on this sheet hold for 60 days from the prepared date." */
  validityNote: string;
}
