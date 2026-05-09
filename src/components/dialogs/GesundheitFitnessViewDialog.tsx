import type { GesundheitFitness, Hundeprofil } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface GesundheitFitnessViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: GesundheitFitness | null;
  onEdit: (record: GesundheitFitness) => void;
  hundeprofilList: Hundeprofil[];
}

export function GesundheitFitnessViewDialog({ open, onClose, record, onEdit, hundeprofilList }: GesundheitFitnessViewDialogProps) {
  function getHundeprofilDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return hundeprofilList.find(r => r.record_id === id)?.fields.hund_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gesundheit & Fitness anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hund</Label>
            <p className="text-sm">{getHundeprofilDisplayName(record.fields.hund_gesundheit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum der Messung</Label>
            <p className="text-sm">{formatDate(record.fields.messdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aktuelles Gewicht (kg)</Label>
            <p className="text-sm">{record.fields.aktuelles_gewicht ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ruhepuls (Schläge/min)</Label>
            <p className="text-sm">{record.fields.ruhepuls ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Körpertemperatur (°C)</Label>
            <p className="text-sm">{record.fields.koerpertemperatur ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Allgemeinzustand</Label>
            <Badge variant="secondary">{record.fields.allgemeinzustand?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tierarztbesuch</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.tierarztbesuch ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.tierarztbesuch ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Grund des Tierarztbesuchs</Label>
            <p className="text-sm">{record.fields.tierarzt_grund ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Impfungen</Label>
            <p className="text-sm">{Array.isArray(record.fields.impfungen) ? record.fields.impfungen.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Medikamente / Behandlungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.medikamente ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Foto / Dokument</Label>
            {record.fields.foto_gesundheit ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.foto_gesundheit} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen zur Gesundheit</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_gesundheit ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}