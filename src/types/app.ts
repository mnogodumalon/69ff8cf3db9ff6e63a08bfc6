// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Hundeprofil {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    hund_name?: string;
    rasse?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    geschlecht?: LookupValue;
    gewicht_kg?: number;
    farbe?: string;
    chip_nummer?: string;
    besitzer_vorname?: string;
    besitzer_nachname?: string;
    foto?: string;
    notizen_profil?: string;
  };
}

export interface Aktivitaetserfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    hund_auswahl?: string; // applookup -> URL zu 'Hundeprofil' Record
    aktivitaet_datum?: string; // Format: YYYY-MM-DD oder ISO String
    aktivitaet_typ?: LookupValue;
    dauer_minuten?: number;
    distanz_km?: number;
    tempo?: string;
    kalorien?: number;
    intensitaet?: LookupValue;
    startort?: GeoLocation; // { lat, long, info }
    wetter?: LookupValue;
    notizen_aktivitaet?: string;
  };
}

export interface GesundheitFitness {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    hund_gesundheit?: string; // applookup -> URL zu 'Hundeprofil' Record
    messdatum?: string; // Format: YYYY-MM-DD oder ISO String
    aktuelles_gewicht?: number;
    ruhepuls?: number;
    koerpertemperatur?: number;
    allgemeinzustand?: LookupValue;
    tierarztbesuch?: boolean;
    tierarzt_grund?: string;
    impfungen?: LookupValue[];
    medikamente?: string;
    foto_gesundheit?: string;
    notizen_gesundheit?: string;
  };
}

export const APP_IDS = {
  HUNDEPROFIL: '69ff8cdbc08467589ae138e4',
  AKTIVITAETSERFASSUNG: '69ff8ce06b990c8518369d72',
  GESUNDHEIT_FITNESS: '69ff8ce28bc98a35f64e87d0',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'hundeprofil': {
    geschlecht: [{ key: "maennlich", label: "Männlich" }, { key: "weiblich", label: "Weiblich" }],
  },
  'aktivitaetserfassung': {
    aktivitaet_typ: [{ key: "spaziergang", label: "Spaziergang" }, { key: "laufen", label: "Laufen / Joggen" }, { key: "radfahren", label: "Radfahren" }, { key: "schwimmen", label: "Schwimmen" }, { key: "agility", label: "Agility" }, { key: "spielen", label: "Spielen" }, { key: "hundesport", label: "Hundesport" }, { key: "sonstiges", label: "Sonstiges" }],
    intensitaet: [{ key: "niedrig", label: "Niedrig" }, { key: "mittel", label: "Mittel" }, { key: "hoch", label: "Hoch" }],
    wetter: [{ key: "sonnig", label: "Sonnig" }, { key: "bewoelkt", label: "Bewölkt" }, { key: "regnerisch", label: "Regnerisch" }, { key: "windig", label: "Windig" }, { key: "schnee", label: "Schnee" }],
  },
  'gesundheit_&_fitness': {
    allgemeinzustand: [{ key: "sehr_gut", label: "Sehr gut" }, { key: "gut", label: "Gut" }, { key: "mittel", label: "Mittel" }, { key: "schlecht", label: "Schlecht" }],
    impfungen: [{ key: "tollwut", label: "Tollwut" }, { key: "staupe", label: "Staupe" }, { key: "parvovirose", label: "Parvovirose" }, { key: "leptospirose", label: "Leptospirose" }, { key: "zwingerhusten", label: "Zwingerhusten" }, { key: "leishmaniose", label: "Leishmaniose" }, { key: "sonstige", label: "Sonstige" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'hundeprofil': {
    'hund_name': 'string/text',
    'rasse': 'string/text',
    'geburtsdatum': 'date/date',
    'geschlecht': 'lookup/radio',
    'gewicht_kg': 'number',
    'farbe': 'string/text',
    'chip_nummer': 'string/text',
    'besitzer_vorname': 'string/text',
    'besitzer_nachname': 'string/text',
    'foto': 'file',
    'notizen_profil': 'string/textarea',
  },
  'aktivitaetserfassung': {
    'hund_auswahl': 'applookup/select',
    'aktivitaet_datum': 'date/datetimeminute',
    'aktivitaet_typ': 'lookup/select',
    'dauer_minuten': 'number',
    'distanz_km': 'number',
    'tempo': 'string/text',
    'kalorien': 'number',
    'intensitaet': 'lookup/radio',
    'startort': 'geo',
    'wetter': 'lookup/select',
    'notizen_aktivitaet': 'string/textarea',
  },
  'gesundheit_&_fitness': {
    'hund_gesundheit': 'applookup/select',
    'messdatum': 'date/date',
    'aktuelles_gewicht': 'number',
    'ruhepuls': 'number',
    'koerpertemperatur': 'number',
    'allgemeinzustand': 'lookup/radio',
    'tierarztbesuch': 'bool',
    'tierarzt_grund': 'string/text',
    'impfungen': 'multiplelookup/checkbox',
    'medikamente': 'string/textarea',
    'foto_gesundheit': 'file',
    'notizen_gesundheit': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateHundeprofil = StripLookup<Hundeprofil['fields']>;
export type CreateAktivitaetserfassung = StripLookup<Aktivitaetserfassung['fields']>;
export type CreateGesundheitFitness = StripLookup<GesundheitFitness['fields']>;