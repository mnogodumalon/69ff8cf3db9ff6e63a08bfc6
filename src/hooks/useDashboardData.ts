import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Hundeprofil, Aktivitaetserfassung, GesundheitFitness } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [hundeprofil, setHundeprofil] = useState<Hundeprofil[]>([]);
  const [aktivitaetserfassung, setAktivitaetserfassung] = useState<Aktivitaetserfassung[]>([]);
  const [gesundheitFitness, setGesundheitFitness] = useState<GesundheitFitness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [hundeprofilData, aktivitaetserfassungData, gesundheitFitnessData] = await Promise.all([
        LivingAppsService.getHundeprofil(),
        LivingAppsService.getAktivitaetserfassung(),
        LivingAppsService.getGesundheitFitness(),
      ]);
      setHundeprofil(hundeprofilData);
      setAktivitaetserfassung(aktivitaetserfassungData);
      setGesundheitFitness(gesundheitFitnessData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [hundeprofilData, aktivitaetserfassungData, gesundheitFitnessData] = await Promise.all([
          LivingAppsService.getHundeprofil(),
          LivingAppsService.getAktivitaetserfassung(),
          LivingAppsService.getGesundheitFitness(),
        ]);
        setHundeprofil(hundeprofilData);
        setAktivitaetserfassung(aktivitaetserfassungData);
        setGesundheitFitness(gesundheitFitnessData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const hundeprofilMap = useMemo(() => {
    const m = new Map<string, Hundeprofil>();
    hundeprofil.forEach(r => m.set(r.record_id, r));
    return m;
  }, [hundeprofil]);

  return { hundeprofil, setHundeprofil, aktivitaetserfassung, setAktivitaetserfassung, gesundheitFitness, setGesundheitFitness, loading, error, fetchAll, hundeprofilMap };
}