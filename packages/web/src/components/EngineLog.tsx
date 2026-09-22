import type { Decision } from '@otosarj/engine';

interface EngineLogProps {
  decision: Decision | null;
  stats: { shown: number; accepted: number; declined: number };
}

const RULE_LABELS: Record<string, string> = {
  R1: 'Seçilen soket başka bir araçla güç paylaşıyor.',
  R2: 'Daha düşük kapasiteli bir soket de aracın ihtiyacını karşılayabiliyor.',
  R3: 'Soketin bağlantı tipi bu araçla uyumlu değil.',
  R5: 'Reddedilen öneri bu oturumda tekrar gösterilmiyor.',
};

const VERDICT_LABELS: Record<Decision['verdict'], string> = {
  NUDGE: 'Alternatif soket önerisi',
  BLOCK: 'Uyumsuz bağlantı',
  PROCEED: 'Ek yönlendirme yok',
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
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-surface-300/50 bg-surface-50 p-5" aria-labelledby="decision-reason-title">
        <h2 id="decision-reason-title" className="mb-4 text-sm font-semibold text-slate-200">
          Kararın gerekçesi
        </h2>

        {!decision ? (
          <p className="text-xs leading-relaxed text-slate-400">
            Bir senaryo çalıştırın veya sürücü ekranından soket seçin.
            Önerinin hangi koşullara dayandığını burada görebilirsiniz.
          </p>
        ) : (
          <>
            <span className={`inline-block rounded-md border px-2 py-1 text-[11px] font-semibold ${verdictBadge(decision.verdict)}`}>
              {VERDICT_LABELS[decision.verdict]}
            </span>
            {decision.triggeredRule && (
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                {RULE_LABELS[decision.triggeredRule] ?? decision.triggeredRule}
              </p>
            )}

            <details className="mt-4 rounded-xl bg-surface-0/60 p-3">
              <summary className="cursor-pointer text-xs font-medium text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400">
                Teknik karar adımları
              </summary>
              <ol className="mt-3 space-y-2">
                {decision.reasoning.map((step, i) => (
                  <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                    <span className="shrink-0 text-slate-500">{i + 1}.</span>
                    <span className="min-w-0 break-words">{step}</span>
                  </li>
                ))}
              </ol>
            </details>
          </>
        )}

        <div className="mt-4 border-t border-surface-300/30 pt-3">
          <p className="mb-2 text-[11px] text-slate-500">Bu demo oturumundaki öneriler</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
            <span>Gösterilen: {stats.shown}</span>
            <span>Kabul: {stats.accepted}</span>
            <span>Ret: {stats.declined}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-surface-300/40 p-5" aria-labelledby="demo-scope-title">
        <h2 id="demo-scope-title" className="mb-3 text-sm font-semibold text-slate-300">Bu demo neyi gösteriyor?</h2>
        <p className="text-xs leading-relaxed text-slate-400">
          Kararlar çalışan bir API üzerinden üretiliyor. İstasyon, araç ve doluluk
          bilgileri örnek veriler; güç ve süreler model tahmini.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Canlı bir şarj ağına bağlantı yok. Sahada kullanım için operatörün
          istasyon yönetim sistemiyle (CSMS) veri entegrasyonu ve gerçek
          koşullarda doğrulama gerekiyor.
        </p>
      </section>
    </div>
  );
}
