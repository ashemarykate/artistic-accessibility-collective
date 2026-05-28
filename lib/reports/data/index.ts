import type { ReportData } from '../types';
import { ogdenDowntownAlliance } from './ogden-downtown-alliance';

const reports: Record<string, ReportData> = {
  'ogden-downtown-alliance': ogdenDowntownAlliance,
};

export function getReportData(slug: string): ReportData | null {
  return reports[slug] ?? null;
}

export function getAllReportSlugs(): string[] {
  return Object.keys(reports);
}
