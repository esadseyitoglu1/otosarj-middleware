import { useState } from 'react';

const STORAGE_KEY = 'otosarj-welcome-seen-v1';

/** Ilk aciliste rehberin gosterilip gosterilmeyecegini belirler (localStorage). */
export function useShouldShowWelcomeOnLoad(): boolean {
  const [shouldShow] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });
  return shouldShow;
}

export function markWelcomeSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // yoksayilir
  }
}

interface WelcomeGuideProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Kullanim rehberi modali. Amac: linki alan kisi hicbir baglam olmadan
 * geldiginde, "hazir senaryolar" butonlarinin ve panellerin ne oldugunu
 * 10 saniyede anlamasi. Gorunurluk App.tsx'ten kontrol edilir --
 * hem ilk aciliste (localStorage'a gore) hem de "?" butonuyla tekrar
 * acilabilir.
 */
export function WelcomeGuide({ visible, onClose }: WelcomeGuideProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-surface-300/50 bg-surface-50 p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h2 className="text-base font-bold text-slate-100">
            OtoŞarj Simülatörüne Hoş Geldiniz
          </h2>
        </div>
        <p className="mb-5 text-xs leading-relaxed text-slate-400">
          Bu, gerçek bir middleware API'ye bağlı çalışan bir prototip. Kurulum
          gerekmiyor — aşağıdaki 3 adımı takip edin.
        </p>

        <ol className="mb-6 space-y-3.5">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-slate-200">Bir senaryo seçin</p>
              <p className="text-xs text-slate-500">
                Üstteki <span className="text-brand-400">A</span>,{' '}
                <span className="text-brand-400">B</span> veya{' '}
                <span className="text-brand-400">C</span> butonlarına tıklayın —
                her biri sahayı otomatik kurup gerçek bir soket taraması yapar.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-slate-200">Üç paneli izleyin</p>
              <p className="text-xs text-slate-500">
                Solda saha, ortada sürücünün telefonu ve gördüğü öneri, sağda
                karar motorunun{' '}
                <span className="text-slate-300">neden</span> o kararı verdiği
                adım adım.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-slate-200">İsterseniz kendiniz deneyin</p>
              <p className="text-xs text-slate-500">
                Telefon panelinden araç/şarj seviyesi değiştirip farklı
                soketler okutarak motoru kendiniz test edebilirsiniz.
              </p>
            </div>
          </li>
        </ol>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-surface-0 transition hover:bg-brand-400 active:scale-[0.98]"
        >
          Anladım, başlayalım
        </button>
      </div>
    </div>
  );
}
