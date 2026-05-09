import type { EnrichedAktivitaetserfassung, EnrichedGesundheitFitness } from '@/types/enriched';
import type { Aktivitaetserfassung, GesundheitFitness, Hundeprofil } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface AktivitaetserfassungMaps {
  hundeprofilMap: Map<string, Hundeprofil>;
}

export function enrichAktivitaetserfassung(
  aktivitaetserfassung: Aktivitaetserfassung[],
  maps: AktivitaetserfassungMaps
): EnrichedAktivitaetserfassung[] {
  return aktivitaetserfassung.map(r => ({
    ...r,
    hund_auswahlName: resolveDisplay(r.fields.hund_auswahl, maps.hundeprofilMap, 'hund_name'),
  }));
}

interface GesundheitFitnessMaps {
  hundeprofilMap: Map<string, Hundeprofil>;
}

export function enrichGesundheitFitness(
  gesundheitFitness: GesundheitFitness[],
  maps: GesundheitFitnessMaps
): EnrichedGesundheitFitness[] {
  return gesundheitFitness.map(r => ({
    ...r,
    hund_gesundheitName: resolveDisplay(r.fields.hund_gesundheit, maps.hundeprofilMap, 'hund_name'),
  }));
}
