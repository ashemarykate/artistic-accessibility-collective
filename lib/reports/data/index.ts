import type { ReportData } from '../types';
import { ogdenDowntownAlliance } from './ogden-downtown-alliance';
import { sampleReport } from './sample';

const reports: Record<string, ReportData> = {
  'ogden-downtown-alliance': ogdenDowntownAlliance,
  // Fictional demo org showing the current report voice and structure
  sample: sampleReport,
};

export function getReportData(slug: string): ReportData | null {
  return reports[slug] ?? null;
}

export function getAllReportSlugs(): string[] {
  return Object.keys(reports);
}
