import type { TFunction } from 'i18next';
import type { BadgeProps } from '@/components/ui/badge';

/* =========================================================================
 * Statuts d'une vérification IMEI
 * ========================================================================= */

export type ImeiStatus = 'legitimate' | 'suspect' | 'stolen';

const IMEI_STATUS_VARIANT: Record<ImeiStatus, NonNullable<BadgeProps['variant']>> = {
  legitimate: 'legitimate',
  suspect: 'suspect',
  stolen: 'stolen',
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

export function imeiStatusVariant(status: string): NonNullable<BadgeProps['variant']> {
  if (status === 'legitimate') return IMEI_STATUS_VARIANT.legitimate;
  if (status === 'suspect') return IMEI_STATUS_VARIANT.suspect;
  return IMEI_STATUS_VARIANT.stolen;
}

/** @deprecated utilise <Badge variant={imeiStatusVariant(s)} /> */
export function imeiStatusClass(status: string): string {
  if (status === 'legitimate') return 'bg-success/15 text-success border-success/30';
  if (status === 'suspect') return 'bg-warning/15 text-warning border-warning/30';
  return 'bg-destructive/15 text-destructive border-destructive/30';
}

/* =========================================================================
 * Statuts d'une déclaration de vol
 * ========================================================================= */

export type DeclarationStatus = 'declared' | 'in_progress' | 'resolved';

const DECLARATION_STATUS_VARIANT: Record<DeclarationStatus, NonNullable<BadgeProps['variant']>> = {
  declared: 'declared',
  in_progress: 'in_progress',
  resolved: 'resolved',
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

export function declarationStatusVariant(status: DeclarationStatus): NonNullable<BadgeProps['variant']> {
  return DECLARATION_STATUS_VARIANT[status];
}

/** @deprecated utilise <Badge variant={declarationStatusVariant(s)} /> */
export function declarationStatusClass(status: DeclarationStatus): string {
  if (status === 'declared') return 'bg-destructive/15 text-destructive border-destructive/30';
  if (status === 'in_progress') return 'bg-warning/15 text-warning border-warning/30';
  return 'bg-success/15 text-success border-success/30';
}
