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

            {decision.verdict === 'NUDGE' && decision.operatorImpact.kwhThroughputGainKwh > 0 && (
              <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3">
                <p className="text-[11px] font-medium text-brand-300">
                  Bu öneri kabul edilirse (tahmini, bu seans için)
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  +{decision.operatorImpact.kwhThroughputGainKwh.toFixed(1)} kWh ek satış
                  potansiyeli · ~₺{decision.operatorImpact.revenueOpportunityTl.toFixed(0)}
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                  Güç farkı × tahmini süre × tarife ile hesaplanır. Talep/doluluk
                  modellenmez, sahada ölçülmüş bir rakam değildir.
                </p>
              </div>
            )}

            {decision.verdict === 'NUDGE' && decision.operatorImpact.freedCapacityKw > 0 && (
              <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3">
                <p className="text-[11px] font-medium text-brand-300">
                  Bu öneri kabul edilirse (tahmini, fırsat maliyeti)
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {decision.selected.evseId} soketinde ~
                  {decision.operatorImpact.freedCapacityKw.toFixed(0)} kW kapasite
                  boşalır — o gücü gerçekten kullanabilecek bir sonraki araca satılabilir.
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                  Soket nominal gücü − bu seansın gücü ile hesaplanır. Sahada bir sonraki
                  aracın gelip gelmeyeceği (doluluk/talep) modellenmez, gerçekleşmiş bir
                  ciro değildir.
                </p>
              </div>
            )}
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
