import type { Decision } from '@otosarj/engine';

interface EngineLogProps {
  decision: Decision | null;
  stats: { shown: number; accepted: number; declined: number };
}

const RULE_LABELS: Record<string, string> = {
  R1: 'R1 · Power-sharing çakışması',
  R2: 'R2 · Kapasite aşırı-tahsisi',
  R3: 'R3 · Konnektör uyumsuzluğu',
  R5: 'R5 · Suppression (tekrar uyarmama)',
};

function verdictBadge(verdict: Decision['verdict']) {
  switch (verdict) {
    case 'NUDGE':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'BLOCK':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    default:
      return 'bg-brand-500/15 text-brand-400 border-brand-500/30';
  }
}

export function EngineLog({ decision, stats }: EngineLogProps) {
  const acceptRate =
    stats.shown > 0 ? Math.round((stats.accepted / stats.shown) * 100) : null;

  return (
    <div className="rounded-2xl border border-surface-300/50 bg-surface-50 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Karar Motoru
      </h2>

      {!decision ? (
        <p className="text-xs text-slate-500">
          Sürücü telefonundan bir soket okutun — motorun kararı ve gerekçeleri burada
          adım adım görünecek.
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${verdictBadge(decision.verdict)}`}
            >
              {decision.verdict}
            </span>
            {decision.triggeredRule && (
              <span className="text-[11px] text-slate-400">
                {RULE_LABELS[decision.triggeredRule] ?? decision.triggeredRule}
              </span>
            )}
          </div>

          <div className="mb-3 space-y-1.5 rounded-xl bg-surface-0/60 p-3">
            {decision.reasoning.map((step, i) => (
              <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                <span className="text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {decision.verdict === 'NUDGE' && decision.operatorImpact.revenueOpportunityTl > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-brand-700/30 bg-brand-950/20 p-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  Ek kWh potansiyeli
                </div>
                <div className="text-sm font-bold text-brand-400">
                  +{decision.operatorImpact.kwhThroughputGainKwh.toFixed(1)} kWh
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  Ciro fırsatı
                </div>
                <div className="text-sm font-bold text-brand-400">
                  ₺{decision.operatorImpact.revenueOpportunityTl.toFixed(0)}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 border-t border-surface-300/30 pt-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-500">
          Bu oturumda gösterilen öneriler
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Gösterilen: {stats.shown}</span>
          <span>Kabul: {stats.accepted}</span>
          <span>Red: {stats.declined}</span>
          {acceptRate !== null && (
            <span className="ml-auto rounded-md bg-surface-100 px-2 py-0.5 text-brand-400">
              %{acceptRate} kabul
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
