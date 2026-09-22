import { scenarios } from '../data/scenarios';

interface ScenarioBarProps {
  onRun: (scenarioId: string) => void;
  onReset: () => void;
  running: boolean;
  activeId: string | null;
}

export function ScenarioBar({ onRun, onReset, running, activeId }: ScenarioBarProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-slate-100">Üç seçim, üç farklı sonuç</h2>
          <p className="mt-1 text-sm text-slate-400">Bir karta dokunun. Saha ve araç sizin için hazırlansın.</p></div>
        <button onClick={onReset} disabled={running} className="shrink-0 text-xs text-slate-400 underline underline-offset-4 hover:text-white disabled:opacity-40">Sıfırla</button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {scenarios.map((s, index) => (
          <button key={s.id} onClick={() => onRun(s.id)} disabled={running} aria-pressed={activeId === s.id}
            className={'rounded-2xl border p-5 text-left transition disabled:opacity-50 ' + (activeId === s.id ? 'border-brand-400/60 bg-brand-400/10' : 'border-surface-300/60 bg-surface-50 hover:border-brand-400/60')}>
            <div className="mb-3 flex items-center justify-between text-xs"><span className="font-mono text-brand-300">0{index + 1}</span><span className="text-slate-500">{index === 0 ? 'Buradan başlayın' : 'Senaryoyu çalıştır'} ↗</span></div>
            <h3 className="text-sm font-semibold text-slate-100">{s.label}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{s.description}</p>
            {s.revenueHint && <p className="mt-4 border-t border-surface-300/40 pt-3 text-xs text-brand-300">{s.revenueHint}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
