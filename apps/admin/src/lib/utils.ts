import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Table cell links — plain at rest; primary + underline on hover. */
export const tableLinkClass =
  'cursor-pointer underline-offset-4 transition-colors duration-200 hover:text-primary hover:underline';

/** Titles that navigate or open a sheet — a table link in heading type. */
export const titleLinkClass = cn(tableLinkClass, 'font-heading font-medium');

/** Info-card values that navigate — primary at rest; underline on hover. */
export const cardLinkClass =
  'cursor-pointer text-primary underline-offset-4 transition-colors duration-200 hover:underline';

/**
 * Leading media column — hug the logo/thumb (`w-0`) and keep a short trail so
 * the title sits close. Also pulls the next title cell’s left pad in (default
 * table `pl-4` is too roomy after art). `h-px` is the percentage base a table
 * cell needs; the row still sizes itself, so `h-full` art fills the cell’s
 * content box without eating its padding.
 */
export const tableMediaCellClass =
  'h-px w-0 pr-1.5 [&+td]:pl-2.5 [&+th]:pl-2.5';

/** Table cover thumb — fills the row's content height. Use `aspect='auto'`. */
export const tableThumbClass = 'h-full w-16';

/**
 * Status badges in a table column — fill the cell so shorter labels match the
 * longest one in that column (table layout sizes the column from content).
 */
export const tableBadgeClass = 'w-full';

/** Shrink a badge column to its content so leftover table width does not inflate it. */
export const tableBadgeCellClass = 'w-0';
