import type { StaffingSheetData } from '../types';
import { riotFest } from './riot-fest';

const sheets: Record<string, StaffingSheetData> = {
  'riot-fest': riotFest,
};

export function getStaffingSheet(slug: string): StaffingSheetData | null {
  return sheets[slug] ?? null;
}

export function getAllStaffingSlugs(): string[] {
  return Object.keys(sheets);
}
