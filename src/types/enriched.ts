import type { Aktivitaetserfassung, GesundheitFitness } from './app';

export type EnrichedAktivitaetserfassung = Aktivitaetserfassung & {
  hund_auswahlName: string;
};

export type EnrichedGesundheitFitness = GesundheitFitness & {
  hund_gesundheitName: string;
};
