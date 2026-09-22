interface Props { onStart: () => void; onGuide: () => void; busy: boolean }

export function PresentationHero({ onStart, onGuide, busy }: Props) {
  return (
    <section className="grid gap-8 pb-7 pt-4 sm:pb-10 sm:pt-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Aynı istasyon. Daha doğru seçim.</p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl">
          Daha iyi şarj,<br /><span className="text-brand-300">doğru soketle başlar.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400">
          Boş bir soket, her zaman en iyi seçenek değildir. OtoŞarj, araç kapasitesini ve
          istasyondaki güç paylaşımını değerlendirir; daha uygun bir soket varsa sürücüye önerir.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button disabled={busy} onClick={onStart} className="rounded-xl bg-brand-400 px-5 py-3 text-sm font-semibold text-surface-0 transition hover:bg-brand-300 disabled:opacity-50">
            {busy ? 'İşleniyor…' : 'Örneği çalıştır →'}
          </button>
          <button onClick={onGuide} className="rounded-xl border border-surface-300 px-5 py-3 text-sm text-slate-300 hover:border-slate-500">Nasıl çalışır?</button>
        </div>
        <p className="mt-4 text-xs text-slate-500">Ek uygulama gerektirmeden, mevcut QR akışına eklenmek üzere tasarlandı.</p>
      </div>
      <div className="rounded-2xl border border-surface-300/60 bg-surface-50 p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Çözmek istediğimiz problem</p>
          <span className="text-xs text-brand-300">Güç paylaşımı</span>
        </div>
        <div className="my-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-300">Aynı kabin</p>
            <div className="my-3 flex items-center gap-2" aria-hidden="true"><span className="h-8 w-10 rounded-lg border border-amber-400/40 bg-amber-400/10" /><span className="text-amber-400">↔</span><span className="h-8 w-10 rounded-lg border border-amber-400/40 bg-amber-400/10" /></div>
            <p className="text-sm text-slate-200">İki araç, ortak güç</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Seçim, şarjı yavaşlatabilir.</p>
          </div>
          <div className="rounded-xl border border-brand-400/30 bg-brand-400/5 p-4">
            <p className="text-xs text-brand-300">Boş kabin</p>
            <div className="my-3 flex h-8 items-center gap-2" aria-hidden="true"><span className="h-8 w-10 rounded-lg border border-brand-400/50 bg-brand-400/15" /><span className="text-brand-300">✓</span></div>
            <p className="text-sm text-slate-200">Uygun alternatif</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Aynı sahada daha iyi seçim.</p>
          </div>
        </div>
        <p className="border-t border-surface-300/50 pt-4 text-sm leading-relaxed text-slate-400">Şarj öncesinde gerekçeli bir öneri. <span className="text-slate-200">Son karar sürücünündür.</span></p>
      </div>
    </section>
  );
}
