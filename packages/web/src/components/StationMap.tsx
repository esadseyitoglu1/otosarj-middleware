import type { Station } from '@otosarj/engine';
import type { StationLayout } from '../data/stationLayout';

interface StationMapProps {
  station: Station | null;
  layout: StationLayout;
  selectedEvseId: string | null;
  recommendedEvseId: string | null;
}

function statusColor(status: string): string {
  switch (status) {
    case 'charging':
      return 'bg-brand-500';
    case 'available':
      return 'bg-slate-600';
    case 'faulted':
      return 'bg-rose-500';
    case 'reserved':
      return 'bg-amber-500';
    default:
      return 'bg-slate-700';
  }
}

export function StationMap({ station, layout, selectedEvseId, recommendedEvseId }: StationMapProps) {
  return (
    <div className="rounded-2xl border border-surface-300/50 bg-surface-50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Saha Görünümü
        </h2>
        <span className="text-xs text-slate-500">{layout.displayName}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {layout.cabinets.map((cabinet) => {
          const evses = cabinet.evseIds.map((id) =>
            station?.evses.find((e) => e.id === id)
          );

          return (
            <div
              key={cabinet.id}
              className={`relative rounded-xl border p-3 transition-colors ${
                cabinet.shared
                  ? 'border-brand-700/40 bg-brand-950/30'
                  : 'border-surface-300/40 bg-surface-100/40'
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                <span className="text-xs font-medium text-slate-300">{cabinet.label}</span>
                <span className="text-[10px] text-slate-500">
                  {cabinet.maxKw} kW {cabinet.shared ? '· paylaşımlı' : ''}
                </span>
              </div>

              {/* Paylasimli kabinlerde iki soket arasi guc-baglanti cizgisi */}
              <div className={`relative ${cabinet.shared ? 'grid grid-cols-2 gap-1' : ''}`}>
                {cabinet.shared && (
                  <svg
                    className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-8 -translate-x-1/2 -translate-y-1/2"
                    viewBox="0 0 32 4"
                  >
                    <line
                      x1="0"
                      y1="2"
                      x2="32"
                      y2="2"
                      stroke="#3cc99a"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-flowDash"
                      opacity="0.6"
                    />
                  </svg>
                )}

                {evses.map((evse, i) => {
                  if (!evse) return <div key={i} />;
                  const isSelected = evse.id === selectedEvseId;
                  const isRecommended = evse.id === recommendedEvseId;

                  return (
                    <div
                      key={evse.id}
                      className={`relative rounded-lg border p-2 text-center transition-all ${
                        isRecommended
                          ? 'border-brand-400 bg-brand-500/15 shadow-glow'
                          : isSelected
                            ? 'border-amber-400/70 bg-amber-500/10'
                            : 'border-surface-300/30 bg-surface-0/60'
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-surface-0">
                          ÖNERİLEN
                        </span>
                      )}
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusColor(evse.status)} ${
                            evse.status === 'charging' ? 'animate-pulseFast' : ''
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-200">{evse.id}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {evse.status === 'charging'
                          ? `${evse.liveDrawKw?.toFixed(0) ?? '—'} kW`
                          : evse.status === 'available'
                            ? 'boş'
                            : evse.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
