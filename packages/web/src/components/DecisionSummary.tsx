import type { Decision } from '@otosarj/engine';

export function DecisionSummary({ decision, running }: { decision: Decision | null; running: boolean }) {
  const recommended = decision?.recommended;
  const minutesSaved = decision && recommended ? Math.max(0, decision.selected.estMinutesTo80 - recommended.estMinutesTo80) : 0;
  return (
    <div aria-live="polite" aria-busy={running} className="rounded-2xl border border-brand-500/25 bg-brand-950/20 p-5 sm:p-6">
      {!decision ? (
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-brand-400/10 px-3 py-2 text-brand-300" aria-hidden="true">↗</span>
          <div><h2 className="text-base font-semibold text-slate-100">{running ? 'Seçim değerlendiriliyor…' : 'Bir senaryo seçin, farkı görün.'}</h2>
            <p className="mt-1 text-sm text-slate-400">{running ? 'Saha hazırlanıyor ve karar motorundan yanıt alınıyor.' : 'Önerilen soket, tahmini süre ve kararın nedeni burada görünecek.'}</p></div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-300">Bu örneğin sonucu</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {decision.verdict === 'PROCEED' ? 'Ek öneri gerekmiyor.' : decision.verdict === 'BLOCK' ? 'Soket bağlantısı araçla uyumsuz.' : decision.triggeredRule === 'R2' ? 'Aynı hız, daha uygun kapasite.' : 'Boş kabine geçmek süre kazandırabilir.'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {recommended ? `${decision.selected.evseId} yerine ${recommended.evseId} soketi öneriliyor. ${minutesSaved > 0 ? `Bu modelde %80 şarja ulaşmak yaklaşık ${minutesSaved} dakika daha kısa.` : 'Yüksek güçlü soket, o kapasiteye ihtiyaç duyan araçlara kalabilir.'}` : decision.driverMessage}
            </p>
          </div>
          {recommended && <div className="flex items-center gap-5 rounded-xl bg-surface-0/50 px-5 py-3">
            <div><p className="text-xs text-slate-500">Seçilen · {decision.selected.evseId}</p><p className="mt-1 text-2xl font-semibold text-slate-300">{decision.selected.effectivePowerKw.toFixed(0)} <span className="text-xs font-normal">kW</span></p></div>
            <span className="text-slate-500" aria-hidden="true">→</span>
            <div><p className="text-xs text-brand-300">Önerilen · {recommended.evseId}</p><p className="mt-1 text-2xl font-semibold text-brand-300">{recommended.effectivePowerKw.toFixed(0)} <span className="text-xs font-normal">kW</span></p></div>
          </div>}
          <p className="w-full text-xs text-slate-500">Simülasyon sonucu · Güç ve süreler tahminidir; gerçek şarj koşullarına göre değişir.</p>
        </div>
      )}
    </div>
  );
}
