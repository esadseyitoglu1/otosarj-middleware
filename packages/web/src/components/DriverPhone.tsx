import type { Decision, DeclineReason, VehicleProfile } from '@otosarj/engine';
import { NudgeModal } from './NudgeModal';

interface DriverPhoneProps {
  vehicles: VehicleProfile[];
  selectedVehicleId: string;
  onVehicleChange: (id: string) => void;
  soc: number;
  onSocChange: (soc: number) => void;
  evseOptions: string[];
  onScan: (evseId: string) => void;
  loading: boolean;
  decision: Decision | null;
  onAcceptNudge: () => void;
  onDeclineNudge: (reason?: DeclineReason) => void;
}

export function DriverPhone({
  vehicles,
  selectedVehicleId,
  onVehicleChange,
  soc,
  onSocChange,
  evseOptions,
  onScan,
  loading,
  decision,
  onAcceptNudge,
  onDeclineNudge,
}: DriverPhoneProps) {
  return (
    <div className="rounded-2xl border border-surface-300/50 bg-surface-50 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Sürücü Telefonu
      </h2>

      <div className="mx-auto w-[280px]">
        {/* Telefon cercevesi */}
        <div className="relative rounded-[2.5rem] border-4 border-surface-300/60 bg-surface-0 p-3 shadow-2xl">
          <div className="absolute left-1/2 top-1 h-4 w-20 -translate-x-1/2 rounded-full bg-surface-300/40" />

          <div className="relative mt-3 min-h-[440px] rounded-[1.75rem] bg-gradient-to-b from-surface-50 to-surface-0 p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-sm font-bold text-slate-200">OtoPriz</span>
            </div>

            <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
              Aracınız
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => onVehicleChange(e.target.value)}
              className="mb-4 w-full rounded-lg border border-surface-300/50 bg-surface-100 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-brand-500"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.makeModel} ({v.maxDcPowerKw} kW)
                </option>
              ))}
            </select>

            <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
              Mevcut şarj seviyesi: %{soc}
            </label>
            <input
              type="range"
              min={0}
              max={95}
              value={soc}
              onChange={(e) => onSocChange(Number(e.target.value))}
              className="mb-5 w-full accent-brand-500"
            />

            <label className="mb-1.5 block text-[10px] uppercase tracking-wide text-slate-500">
              QR okut — soket seçin
            </label>
            <div className="mb-4 grid grid-cols-4 gap-1.5">
              {evseOptions.map((evseId) => (
                <button
                  key={evseId}
                  onClick={() => onScan(evseId)}
                  disabled={loading}
                  className="rounded-lg border border-surface-300/50 bg-surface-100 py-2 text-xs font-medium text-slate-300 transition hover:border-brand-500 hover:text-brand-300 disabled:opacity-40"
                >
                  {evseId}
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 animate-pulseFast rounded-full bg-brand-500" />
                Motor değerlendiriyor…
              </div>
            )}

            {decision && decision.verdict === 'PROCEED' && (
              <div className="rounded-xl border border-brand-700/40 bg-brand-950/30 p-3 text-center text-xs text-brand-300">
                ✓ {decision.driverMessage}
              </div>
            )}

            {decision && decision.verdict !== 'PROCEED' && (
              <NudgeModal decision={decision} onAccept={onAcceptNudge} onDecline={onDeclineNudge} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
