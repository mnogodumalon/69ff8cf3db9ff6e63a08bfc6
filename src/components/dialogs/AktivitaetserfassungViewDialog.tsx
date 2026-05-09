import { useState } from 'react';
import type { Aktivitaetserfassung, Hundeprofil } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconChevronDown } from '@tabler/icons-react';
import { GeoMapPicker } from '@/components/GeoMapPicker';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface AktivitaetserfassungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Aktivitaetserfassung | null;
  onEdit: (record: Aktivitaetserfassung) => void;
  hundeprofilList: Hundeprofil[];
}

export function AktivitaetserfassungViewDialog({ open, onClose, record, onEdit, hundeprofilList }: AktivitaetserfassungViewDialogProps) {
  const [showCoords, setShowCoords] = useState(false);

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
          <DialogTitle>Aktivitätserfassung anzeigen</DialogTitle>
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
            <p className="text-sm">{getHundeprofilDisplayName(record.fields.hund_auswahl)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum und Uhrzeit</Label>
            <p className="text-sm">{formatDate(record.fields.aktivitaet_datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aktivitätstyp</Label>
            <Badge variant="secondary">{record.fields.aktivitaet_typ?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dauer (Minuten)</Label>
            <p className="text-sm">{record.fields.dauer_minuten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Distanz (km)</Label>
            <p className="text-sm">{record.fields.distanz_km ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Durchschnittstempo (min/km)</Label>
            <p className="text-sm">{record.fields.tempo ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kalorienverbrauch (kcal)</Label>
            <p className="text-sm">{record.fields.kalorien ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Intensität</Label>
            <Badge variant="secondary">{record.fields.intensitaet?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Startort</Label>
            {record.fields.startort?.info && (
              <p className="text-sm text-muted-foreground break-words whitespace-normal">{record.fields.startort.info}</p>
            )}
            {record.fields.startort?.lat != null && record.fields.startort?.long != null && (
              <GeoMapPicker
                lat={record.fields.startort.lat}
                lng={record.fields.startort.long}
                readOnly
              />
            )}
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors" onClick={() => setShowCoords(v => !v)}>
              {showCoords ? 'Koordinaten verbergen' : 'Koordinaten anzeigen'}
              <IconChevronDown className={`h-3 w-3 transition-transform ${showCoords ? "rotate-180" : ""}`} />
            </button>
            {showCoords && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-xs text-muted-foreground">Breitengrad:</span> {record.fields.startort?.lat?.toFixed(6) ?? '—'}</div>
                <div><span className="text-xs text-muted-foreground">Längengrad:</span> {record.fields.startort?.long?.toFixed(6) ?? '—'}</div>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wetter</Label>
            <Badge variant="secondary">{record.fields.wetter?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen zur Aktivität</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_aktivitaet ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}