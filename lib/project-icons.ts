/**
 * The icon set a project can wear in the home page Projects folder.
 *
 * One list, used by two places that must never disagree: the picker in Admin ->
 * Productions, and the folder window on the home page. If they drifted, someone
 * would choose a camera in admin and get a notepad on the desktop.
 *
 * Labels are written for a person, not a developer. The files are named
 * `icon-46.png`, `icon-cal.png` and so on, which tells you nothing about what
 * they look like, so every entry says what you would actually see. Anyone
 * editing this list should open the image first and describe it honestly: these
 * labels are the accessible names in the picker, and a wrong one is worse than
 * a missing one.
 *
 * `key` is what gets stored in productions.desktop_icon (migration v44) and is
 * also what the home page passes to its <Ico> component, so it has to match a
 * real file in public/images/desktop-icons/icon-<key>.png.
 */

import type { ProductionKind } from './supabase';

export type ProjectIcon = {
  /** Stored value, and the icon-<key>.png filename. */
  key: string;
  /** What you see. Used as the option's accessible name in the picker. */
  label: string;
};

export const PROJECT_ICONS: ProjectIcon[] = [
  { key: 'cal',     label: 'Calendar' },
  { key: '57',      label: 'Notepad' },
  { key: '50',      label: 'Camera' },
  { key: '56',      label: 'Computer' },
  { key: '51',      label: 'Framed picture' },
  { key: '70',      label: 'Cup of brushes and pens' },
  { key: '80',      label: 'Paints and beakers' },
  { key: '62',      label: 'Binder of colour swatches' },
  { key: '46',      label: 'Two people' },
  { key: '84',      label: 'Speech bubble' },
  { key: '63',      label: 'Globe and magnifier' },
  { key: '82',      label: 'Open window' },
  { key: '76',      label: 'Telephone' },
  { key: '52',      label: 'Newspaper and letter' },
  { key: '64',      label: 'Mailbox' },
  { key: 'printer', label: 'Stack of pages' },
];

const BY_KEY = new Map(PROJECT_ICONS.map((i) => [i.key, i]));

/**
 * The icon used when a production has not picked one. Deliberately boring and
 * predictable: a workshop looks like a notepad, a show looks like a stage-ish
 * framed picture, and anything unrecognised gets the calendar, because
 * everything in this folder is a thing that happens on a date.
 */
const BY_KIND: Record<ProductionKind, string> = {
  workshop:  '57',
  show:      '51',
  screening: '56',
  project:   '70',
  series:    '62',
  other:     'cal',
};

/**
 * Resolves what a project should actually show. Takes the stored choice and the
 * kind, and always returns a key that exists, so a row written before this
 * feature, or one carrying a key from an icon we later removed, renders an icon
 * rather than a broken image.
 */
export function resolveProjectIcon(
  desktopIcon: string | null | undefined,
  kind: ProductionKind,
): string {
  if (desktopIcon && BY_KEY.has(desktopIcon)) return desktopIcon;
  return BY_KIND[kind] ?? 'cal';
}

/** Plain-language name for an icon key, for accessible names and admin summaries. */
export function projectIconLabel(key: string): string {
  return BY_KEY.get(key)?.label ?? 'Calendar';
}

/** The pink folder the whole section lives behind. Not in the picker: it is the
 *  folder itself, so letting a project inside it wear the same icon would be
 *  confusing. */
export const PROJECTS_FOLDER_ICON = 'projects-open';
