import { scenarios } from '../data/scenarios';

interface ScenarioBarProps {
  onRun: (scenarioId: string) => void;
  onReset: () => void;
  running: boolean;
}

export function ScenarioBar({ onRun, onReset, running }: ScenarioBarProps) {
  return (
    <div className="rounded-2xl border border-surface-300/50 bg-surface-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Hazır Senaryolar
        </h2>
        <button
          onClick={onReset}
          className="text-[11px] text-slate-500 underline underline-offset-2 hover:text-slate-300"
        >
          Sahayı sıfırla
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onRun(s.id)}
            disabled={running}
            title={s.description}
            className="rounded-lg border border-surface-300/50 bg-surface-100 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-brand-500 hover:text-brand-300 disabled:opacity-40"
          >
            <div className="font-medium">{s.label}</div>
            <div className="mt-0.5 text-[10px] text-slate-500">{s.description}</div>
            {s.revenueHint && (
              <div className="mt-1 text-[10px] text-brand-400/80">↑ {s.revenueHint}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
