import type { TFunction } from 'i18next';

/* =========================================================================
 * Statuts d'une vérification IMEI
 * Source unique pour libellés + classes Tailwind (badges, tableaux, etc.)
 * ========================================================================= */

export type ImeiStatus = 'legitimate' | 'suspect' | 'stolen';

export const IMEI_STATUS_CLASS: Record<ImeiStatus, string> = {
  legitimate: 'bg-success text-success-foreground',
  suspect: 'bg-warning text-warning-foreground',
  stolen: 'bg-destructive text-destructive-foreground',
};

export function imeiStatusLabel(t: TFunction, status: string): string {
  switch (status) {
    case 'legitimate':
      return t('dashboard.history.statusLegitimate');
    case 'suspect':
      return t('dashboard.history.statusSuspect');
    case 'stolen':
    default:
      return t('dashboard.history.statusStolen');
  }
}

export function imeiStatusClass(status: string): string {
  if (status === 'legitimate') return IMEI_STATUS_CLASS.legitimate;
  if (status === 'suspect') return IMEI_STATUS_CLASS.suspect;
  return IMEI_STATUS_CLASS.stolen;
}

/* =========================================================================
 * Statuts d'une déclaration de vol
 * ========================================================================= */

export type DeclarationStatus = 'declared' | 'in_progress' | 'resolved';

export const DECLARATION_STATUS_CLASS: Record<DeclarationStatus, string> = {
  declared: 'bg-destructive text-destructive-foreground',
  in_progress: 'bg-warning text-warning-foreground',
  resolved: 'bg-success text-success-foreground',
};

export function declarationStatusLabel(t: TFunction, status: DeclarationStatus): string {
  switch (status) {
    case 'declared':
      return t('dashboard.cases.statusDeclared');
    case 'in_progress':
      return t('dashboard.cases.statusInProgress');
    case 'resolved':
      return t('dashboard.cases.statusResolved');
  }
}

export function declarationStatusClass(status: DeclarationStatus): string {
  return DECLARATION_STATUS_CLASS[status];
}
