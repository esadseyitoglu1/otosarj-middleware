import { useEffect, useRef } from 'react';

interface WelcomeGuideProps {
  visible: boolean;
  onClose: () => void;
}

/** Kullanıcının isteğiyle açılan rehber; dialog odak yönetimi tarayıcıya aittir. */
export function WelcomeGuide({ visible, onClose }: WelcomeGuideProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [visible]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="guide-title"
      aria-describedby="guide-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-surface-300/50 bg-surface-50 p-5 text-slate-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:p-6"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="guide-title" className="text-base font-bold">Demoyu nasıl deneyebilirsiniz?</h2>
        <button type="button" onClick={onClose} aria-label="Rehberi kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-surface-100 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400">
          ×
        </button>
      </div>
      <p id="guide-description" className="mb-5 text-xs leading-relaxed text-slate-400">
        Sürücünün soket seçimi, üç örnek durumda nasıl değişiyor? Kurulum
        gerekmeden deneyebilirsiniz.
      </p>

      <ol className="mb-5 space-y-4">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">1</span>
          <div>
            <p className="text-sm font-medium text-slate-200">Bir senaryo seçin</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              A, B veya C kartını seçin. Örnek saha hazırlanır ve demo API'si
              seçili araç ile soket için karar üretir.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">2</span>
          <div>
            <p className="text-sm font-medium text-slate-200">Sonucu inceleyin</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Saha haritasında soketleri, sürücü ekranında öneriyi ve
              “Kararın gerekçesi” bölümünde nedenini görün. Sürücü öneriyi
              kabul edebilir veya kendi seçimiyle devam edebilir.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">3</span>
          <div>
            <p className="text-sm font-medium text-slate-200">Koşulları değiştirin</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Sürücü ekranından araç, şarj seviyesi ve soket seçerek yeni
              bir karar isteyin. Her durumda farklı soket önerilmesi gerekmez.
            </p>
          </div>
        </li>
      </ol>

      <p className="mb-5 rounded-xl bg-surface-0/60 p-3 text-xs leading-relaxed text-slate-400">
        Bu demo örnek verilerle çalışır; canlı şarj ağına bağlı değildir.
        Gerçek kullanım için operatör verileriyle entegrasyon ve saha
        doğrulaması gerekir. Gösterilen güç ve süreler tahminidir.
      </p>

      <button type="button" onClick={onClose} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-surface-0 transition hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400">
        Demoya dön
      </button>
    </dialog>
  );
}
