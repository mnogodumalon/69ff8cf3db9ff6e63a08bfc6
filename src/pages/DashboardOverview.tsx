import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichAktivitaetserfassung, enrichGesundheitFitness } from '@/lib/enrich';
import type { EnrichedAktivitaetserfassung, EnrichedGesundheitFitness } from '@/types/enriched';
import type { Hundeprofil, Aktivitaetserfassung, GesundheitFitness } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { HundeprofilDialog } from '@/components/dialogs/HundeprofilDialog';
import { AktivitaetserfassungDialog } from '@/components/dialogs/AktivitaetserfassungDialog';
import { GesundheitFitnessDialog } from '@/components/dialogs/GesundheitFitnessDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconDog, IconRun,
  IconHeartbeat, IconCalendar, IconFlame, IconMap2,
  IconChevronRight, IconActivity, IconWeight
} from '@tabler/icons-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const APPGROUP_ID = '69ff8cf3db9ff6e63a08bfc6';
const REPAIR_ENDPOINT = '/claude/build/repair';

type DialogMode =
  | { type: 'none' }
  | { type: 'createHund' }
  | { type: 'editHund'; record: Hundeprofil }
  | { type: 'createAktivitaet'; hundId?: string }
  | { type: 'editAktivitaet'; record: Aktivitaetserfassung }
  | { type: 'createGesundheit'; hundId?: string }
  | { type: 'editGesundheit'; record: GesundheitFitness };

type DeleteTarget =
  | { type: 'hund'; id: string }
  | { type: 'aktivitaet'; id: string }
  | { type: 'gesundheit'; id: string }
  | null;

export default function DashboardOverview() {
  const {
    hundeprofil, aktivitaetserfassung, gesundheitFitness,
    hundeprofilMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedAktivitaetserfassung = enrichAktivitaetserfassung(aktivitaetserfassung, { hundeprofilMap });
  const enrichedGesundheitFitness = enrichGesundheitFitness(gesundheitFitness, { hundeprofilMap });

  const [selectedHundId, setSelectedHundId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogMode>({ type: 'none' });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [activeTab, setActiveTab] = useState<'aktivitaeten' | 'gesundheit'>('aktivitaeten');

  // ALL hooks before early returns
  const selectedHund = useMemo(() => {
    if (!selectedHundId) return hundeprofil[0] ?? null;
    return hundeprofilMap.get(selectedHundId) ?? null;
  }, [selectedHundId, hundeprofil, hundeprofilMap]);

  const aktForHund: EnrichedAktivitaetserfassung[] = useMemo(() => {
    if (!selectedHund) return [];
    return enrichedAktivitaetserfassung
      .filter(a => {
        const url = a.fields.hund_auswahl ?? '';
        return url.includes(selectedHund.record_id);
      })
      .sort((a, b) => (b.fields.aktivitaet_datum ?? '').localeCompare(a.fields.aktivitaet_datum ?? ''));
  }, [selectedHund, enrichedAktivitaetserfassung]);

  const gesForHund: EnrichedGesundheitFitness[] = useMemo(() => {
    if (!selectedHund) return [];
    return enrichedGesundheitFitness
      .filter(g => {
        const url = g.fields.hund_gesundheit ?? '';
        return url.includes(selectedHund.record_id);
      })
      .sort((a, b) => (b.fields.messdatum ?? '').localeCompare(a.fields.messdatum ?? ''));
  }, [selectedHund, enrichedGesundheitFitness]);

  const totalMinuten = useMemo(() =>
    aktForHund.reduce((s, a) => s + (a.fields.dauer_minuten ?? 0), 0),
    [aktForHund]
  );
  const totalKm = useMemo(() =>
    aktForHund.reduce((s, a) => s + (a.fields.distanz_km ?? 0), 0),
    [aktForHund]
  );

  const gewichtChart = useMemo(() => {
    return gesForHund
      .slice()
      .reverse()
      .filter(g => g.fields.aktuelles_gewicht != null)
      .map(g => ({
        date: formatDate(g.fields.messdatum),
        gewicht: g.fields.aktuelles_gewicht,
      }));
  }, [gesForHund]);

  const latestGesundheit = gesForHund[0] ?? null;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'hund') {
      await LivingAppsService.deleteHundeprofilEntry(deleteTarget.id);
      if (selectedHund?.record_id === deleteTarget.id) setSelectedHundId(null);
    } else if (deleteTarget.type === 'aktivitaet') {
      await LivingAppsService.deleteAktivitaetserfassungEntry(deleteTarget.id);
    } else if (deleteTarget.type === 'gesundheit') {
      await LivingAppsService.deleteGesundheitFitnes(deleteTarget.id);
    }
    setDeleteTarget(null);
    fetchAll();
  };

  const aktTypIcon: Record<string, string> = {
    spaziergang: '🚶',
    laufen: '🏃',
    radfahren: '🚴',
    schwimmen: '🏊',
    agility: '🏅',
    spielen: '🎾',
    hundesport: '🐕',
    sonstiges: '⭐',
  };

  const zustandColor: Record<string, string> = {
    sehr_gut: 'bg-emerald-100 text-emerald-700',
    gut: 'bg-green-100 text-green-700',
    mittel: 'bg-amber-100 text-amber-700',
    schlecht: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PfotenTracker</h1>
          <p className="text-sm text-muted-foreground">{hundeprofil.length} Hund{hundeprofil.length !== 1 ? 'e' : ''} erfasst</p>
        </div>
        <Button size="sm" onClick={() => setDialog({ type: 'createHund' })}>
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          Neuer Hund
        </Button>
      </div>

      {/* Hunde-Auswahl */}
      {hundeprofil.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border">
          <IconDog size={48} className="text-muted-foreground" stroke={1.5} />
          <div className="text-center">
            <p className="font-medium text-foreground">Noch kein Hund erfasst</p>
            <p className="text-sm text-muted-foreground">Füge deinen ersten Hund hinzu, um zu starten.</p>
          </div>
          <Button size="sm" onClick={() => setDialog({ type: 'createHund' })}>
            <IconPlus size={16} className="mr-1.5" />Hund hinzufügen
          </Button>
        </div>
      ) : (
        <>
          {/* Hunde-Karten Leiste */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {hundeprofil.map(h => {
              const isSelected = (selectedHund?.record_id === h.record_id);
              return (
                <button
                  key={h.record_id}
                  onClick={() => setSelectedHundId(h.record_id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shrink-0 transition-all text-left
                    ${isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50'}`}
                >
                  {h.fields.foto ? (
                    <img
                      src={h.fields.foto}
                      alt={h.fields.hund_name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                      ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                      <IconDog size={20} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {h.fields.hund_name ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{h.fields.rasse ?? 'Unbekannte Rasse'}</p>
                  </div>
                  {isSelected && <IconChevronRight size={16} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {selectedHund && (
            <>
              {/* Hund Detail Header */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex flex-wrap items-start gap-4 p-5">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {selectedHund.fields.foto ? (
                      <img
                        src={selectedHund.fields.foto}
                        alt={selectedHund.fields.hund_name}
                        className="w-16 h-16 rounded-2xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <IconDog size={28} className="text-primary" stroke={1.5} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-foreground truncate">{selectedHund.fields.hund_name ?? '—'}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {selectedHund.fields.rasse && (
                          <span className="text-sm text-muted-foreground">{selectedHund.fields.rasse}</span>
                        )}
                        {selectedHund.fields.geschlecht?.label && (
                          <Badge variant="secondary" className="text-xs">{selectedHund.fields.geschlecht.label}</Badge>
                        )}
                        {selectedHund.fields.geburtsdatum && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconCalendar size={12} className="shrink-0" />
                            {formatDate(selectedHund.fields.geburtsdatum)}
                          </span>
                        )}
                        {selectedHund.fields.gewicht_kg && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconWeight size={12} className="shrink-0" />
                            {selectedHund.fields.gewicht_kg} kg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDialog({ type: 'editHund', record: selectedHund })}
                    >
                      <IconPencil size={14} className="mr-1.5 shrink-0" />
                      Bearbeiten
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget({ type: 'hund', id: selectedHund.record_id })}
                    >
                      <IconTrash size={14} className="shrink-0" />
                    </Button>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-border divide-x divide-border">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{aktForHund.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Aktivitäten</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{totalMinuten > 0 ? `${Math.round(totalMinuten / 60)}h` : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Gesamtzeit</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{totalKm > 0 ? `${totalKm.toFixed(1)} km` : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Strecke</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{latestGesundheit?.fields.aktuelles_gewicht ? `${latestGesundheit.fields.aktuelles_gewicht} kg` : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Gewicht aktuell</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
                <button
                  onClick={() => setActiveTab('aktivitaeten')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${activeTab === 'aktivitaeten' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <IconRun size={15} className="shrink-0" />Aktivitäten
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('gesundheit')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${activeTab === 'gesundheit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <IconHeartbeat size={15} className="shrink-0" />Gesundheit
                  </span>
                </button>
              </div>

              {/* Aktivitäten Tab */}
              {activeTab === 'aktivitaeten' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Aktivitäten</h3>
                    <Button
                      size="sm"
                      onClick={() => setDialog({ type: 'createAktivitaet', hundId: selectedHund.record_id })}
                    >
                      <IconPlus size={14} className="mr-1.5 shrink-0" />
                      Neue Aktivität
                    </Button>
                  </div>

                  {aktForHund.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-2xl border border-dashed border-border">
                      <IconActivity size={36} className="text-muted-foreground" stroke={1.5} />
                      <p className="text-sm text-muted-foreground">Noch keine Aktivitäten erfasst</p>
                      <Button size="sm" variant="outline" onClick={() => setDialog({ type: 'createAktivitaet', hundId: selectedHund.record_id })}>
                        <IconPlus size={14} className="mr-1" />Erste Aktivität
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {aktForHund.map(a => (
                        <div key={a.record_id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-accent/30 transition-colors">
                          <div className="text-2xl shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span>{aktTypIcon[a.fields.aktivitaet_typ?.key ?? ''] ?? '⭐'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {a.fields.aktivitaet_typ?.label ?? 'Aktivität'}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                              {a.fields.aktivitaet_datum && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <IconCalendar size={11} className="shrink-0" />
                                  {formatDate(a.fields.aktivitaet_datum)}
                                </span>
                              )}
                              {a.fields.dauer_minuten != null && (
                                <span className="text-xs text-muted-foreground">{a.fields.dauer_minuten} Min.</span>
                              )}
                              {a.fields.distanz_km != null && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <IconMap2 size={11} className="shrink-0" />
                                  {a.fields.distanz_km} km
                                </span>
                              )}
                              {a.fields.kalorien != null && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <IconFlame size={11} className="shrink-0" />
                                  {a.fields.kalorien} kcal
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {a.fields.intensitaet?.key && (
                              <Badge variant="secondary" className="text-xs hidden sm:flex">
                                {a.fields.intensitaet.label}
                              </Badge>
                            )}
                            {a.fields.wetter?.key && (
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                {a.fields.wetter.label}
                              </span>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                              onClick={() => setDialog({ type: 'editAktivitaet', record: a })}>
                              <IconPencil size={14} className="shrink-0" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget({ type: 'aktivitaet', id: a.record_id })}>
                              <IconTrash size={14} className="shrink-0" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Gesundheit Tab */}
              {activeTab === 'gesundheit' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Gesundheit & Fitness</h3>
                    <Button
                      size="sm"
                      onClick={() => setDialog({ type: 'createGesundheit', hundId: selectedHund.record_id })}
                    >
                      <IconPlus size={14} className="mr-1.5 shrink-0" />
                      Neuer Eintrag
                    </Button>
                  </div>

                  {/* Gewichtsverlauf Chart */}
                  {gewichtChart.length > 1 && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <p className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                        <IconWeight size={16} className="text-primary shrink-0" />
                        Gewichtsverlauf
                      </p>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={gewichtChart}>
                          <defs>
                            <linearGradient id="gewichtGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} unit=" kg" domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }}
                            formatter={(v: number) => [`${v} kg`, 'Gewicht']}
                          />
                          <Area type="monotone" dataKey="gewicht" stroke="var(--primary)" strokeWidth={2} fill="url(#gewichtGrad)" dot={{ fill: 'var(--primary)', r: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {gesForHund.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-2xl border border-dashed border-border">
                      <IconHeartbeat size={36} className="text-muted-foreground" stroke={1.5} />
                      <p className="text-sm text-muted-foreground">Noch keine Gesundheitsdaten erfasst</p>
                      <Button size="sm" variant="outline" onClick={() => setDialog({ type: 'createGesundheit', hundId: selectedHund.record_id })}>
                        <IconPlus size={14} className="mr-1" />Erster Eintrag
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {gesForHund.map(g => (
                        <div key={g.record_id} className="flex flex-wrap sm:flex-nowrap items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-accent/30 transition-colors">
                          <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <IconHeartbeat size={18} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium text-sm text-foreground">
                                {formatDate(g.fields.messdatum)}
                              </p>
                              {g.fields.allgemeinzustand?.key && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${zustandColor[g.fields.allgemeinzustand.key] ?? 'bg-muted text-muted-foreground'}`}>
                                  {g.fields.allgemeinzustand.label}
                                </span>
                              )}
                              {g.fields.tierarztbesuch && (
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Tierarzt</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
                              {g.fields.aktuelles_gewicht != null && (
                                <span className="text-xs text-muted-foreground">{g.fields.aktuelles_gewicht} kg</span>
                              )}
                              {g.fields.ruhepuls != null && (
                                <span className="text-xs text-muted-foreground">{g.fields.ruhepuls} bpm</span>
                              )}
                              {g.fields.koerpertemperatur != null && (
                                <span className="text-xs text-muted-foreground">{g.fields.koerpertemperatur} °C</span>
                              )}
                              {g.fields.impfungen && g.fields.impfungen.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Impfung: {g.fields.impfungen.map(i => i.label).join(', ')}
                                </span>
                              )}
                            </div>
                            {g.fields.tierarzt_grund && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{g.fields.tierarzt_grund}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                              onClick={() => setDialog({ type: 'editGesundheit', record: g })}>
                              <IconPencil size={14} className="shrink-0" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget({ type: 'gesundheit', id: g.record_id })}>
                              <IconTrash size={14} className="shrink-0" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Global Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              title="Hunde"
              value={String(hundeprofil.length)}
              description="Erfasste Profile"
              icon={<IconDog size={18} className="text-muted-foreground" />}
            />
            <StatCard
              title="Aktivitäten"
              value={String(aktivitaetserfassung.length)}
              description="Gesamt"
              icon={<IconRun size={18} className="text-muted-foreground" />}
            />
            <StatCard
              title="Gesundheits­einträge"
              value={String(gesundheitFitness.length)}
              description="Messungen"
              icon={<IconHeartbeat size={18} className="text-muted-foreground" />}
            />
          </div>
        </>
      )}

      {/* Dialogs */}
      <HundeprofilDialog
        open={dialog.type === 'createHund' || dialog.type === 'editHund'}
        onClose={() => setDialog({ type: 'none' })}
        onSubmit={async (fields) => {
          if (dialog.type === 'editHund') {
            await LivingAppsService.updateHundeprofilEntry(dialog.record.record_id, fields);
          } else {
            await LivingAppsService.createHundeprofilEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={dialog.type === 'editHund' ? dialog.record.fields : undefined}
        enablePhotoScan={AI_PHOTO_SCAN['Hundeprofil']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Hundeprofil']}
      />

      <AktivitaetserfassungDialog
        open={dialog.type === 'createAktivitaet' || dialog.type === 'editAktivitaet'}
        onClose={() => setDialog({ type: 'none' })}
        onSubmit={async (fields) => {
          if (dialog.type === 'editAktivitaet') {
            await LivingAppsService.updateAktivitaetserfassungEntry(dialog.record.record_id, fields);
          } else {
            await LivingAppsService.createAktivitaetserfassungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={
          dialog.type === 'editAktivitaet'
            ? dialog.record.fields
            : dialog.type === 'createAktivitaet' && dialog.hundId
              ? { hund_auswahl: createRecordUrl(APP_IDS.HUNDEPROFIL, dialog.hundId) }
              : undefined
        }
        hundeprofilList={hundeprofil}
        enablePhotoScan={AI_PHOTO_SCAN['Aktivitaetserfassung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Aktivitaetserfassung']}
      />

      <GesundheitFitnessDialog
        open={dialog.type === 'createGesundheit' || dialog.type === 'editGesundheit'}
        onClose={() => setDialog({ type: 'none' })}
        onSubmit={async (fields) => {
          if (dialog.type === 'editGesundheit') {
            await LivingAppsService.updateGesundheitFitnes(dialog.record.record_id, fields);
          } else {
            await LivingAppsService.createGesundheitFitnes(fields);
          }
          fetchAll();
        }}
        defaultValues={
          dialog.type === 'editGesundheit'
            ? dialog.record.fields
            : dialog.type === 'createGesundheit' && dialog.hundId
              ? { hund_gesundheit: createRecordUrl(APP_IDS.HUNDEPROFIL, dialog.hundId) }
              : undefined
        }
        hundeprofilList={hundeprofil}
        enablePhotoScan={AI_PHOTO_SCAN['GesundheitFitness']}
        enablePhotoLocation={AI_PHOTO_LOCATION['GesundheitFitness']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={
          deleteTarget?.type === 'hund'
            ? 'Möchtest du dieses Hundeprofil wirklich löschen? Alle zugehörigen Daten bleiben erhalten.'
            : 'Möchtest du diesen Eintrag wirklich löschen?'
        }
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-44 rounded-2xl shrink-0" />)}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
