import type { Decision, DeclineReason } from '@otosarj/engine';
import { useState } from 'react';

interface NudgeModalProps {
  decision: Decision;
  onAccept: () => void;
  onDecline: (reason?: DeclineReason) => void;
}

const DECLINE_REASONS: { id: DeclineReason; label: string }[] = [
  { id: 'parking', label: 'Park yeri uygun değil' },
  { id: 'price', label: 'Fiyat farkı var' },
  { id: 'short-stop', label: 'Kısa mola yapıyorum' },
  { id: 'other', label: 'Diğer' },
];

export function NudgeModal({ decision, onAccept, onDecline }: NudgeModalProps) {
  const [showReasons, setShowReasons] = useState(false);

  if (decision.verdict === 'PROCEED') return null;

  const isBlock = decision.verdict === 'BLOCK';

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/60 backdrop-blur-sm rounded-[2.5rem]">
      <div className="w-full animate-slideUp rounded-t-3xl border-t border-surface-300/50 bg-surface-50 p-5 pb-6">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-300" />

        <div className="mb-3 flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
              isBlock ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isBlock ? '⛔' : '⚡'}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {isBlock ? 'Uyumsuz Soket' : `Öneri · Kural ${decision.triggeredRule}`}
          </span>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-100">{decision.driverMessage}</p>

        {!isBlock && decision.recommended && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-surface-0/60 p-3 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Seçtiğiniz</div>
              <div className="text-lg font-bold text-slate-300">
                {decision.selected.effectivePowerKw.toFixed(0)} kW
              </div>
              <div className="text-[10px] text-slate-500">
                ~{decision.selected.estMinutesTo80} dk
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-brand-400">Önerilen</div>
              <div className="text-lg font-bold text-brand-400">
                {decision.recommended.effectivePowerKw.toFixed(0)} kW
              </div>
              <div className="text-[10px] text-brand-400/70">
                ~{decision.recommended.estMinutesTo80} dk
              </div>
            </div>
          </div>
        )}

        {!showReasons ? (
          <div className="flex flex-col gap-2">
            {!isBlock && decision.recommended && (
              <button
                onClick={onAccept}
                className="rounded-xl bg-brand-500 py-3 text-sm font-semibold text-surface-0 transition hover:bg-brand-400 active:scale-[0.98]"
              >
                {decision.recommended.evseId} kabinine geç
              </button>
            )}
            <button
              onClick={() => (isBlock ? onDecline() : setShowReasons(true))}
              className="rounded-xl border border-surface-300/50 py-3 text-sm text-slate-300 transition hover:bg-surface-100 active:scale-[0.98]"
            >
              {isBlock ? 'Anladım' : 'Yine de buraya takacağım'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-xs text-slate-500">
              İsterseniz sebebini belirtin (opsiyonel) — bu bilgi sahayı iyileştirmemize yardımcı olur.
            </p>
            {DECLINE_REASONS.map((r) => (
              <button
                key={r.id}
                onClick={() => onDecline(r.id)}
                className="rounded-lg border border-surface-300/40 py-2 text-left text-xs text-slate-300 transition hover:bg-surface-100"
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() => onDecline()}
              className="mt-1 text-center text-xs text-slate-500 underline underline-offset-2"
            >
              Atla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
