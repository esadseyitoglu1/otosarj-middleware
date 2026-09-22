import { useCallback, useEffect, useRef, useState } from 'react';
import { vehicleFixtures, type Decision, type DeclineReason, type Station } from '@otosarj/engine';
import { StationMap } from './components/StationMap';
import { DriverPhone } from './components/DriverPhone';
import { EngineLog } from './components/EngineLog';
import { ScenarioBar } from './components/ScenarioBar';
import { WelcomeGuide } from './components/WelcomeGuide';
import { PresentationHero } from './components/PresentationHero';
import { DecisionSummary } from './components/DecisionSummary';
import { otoprizLayout, largeOperatorLayout, type StationLayout } from './data/stationLayout';
import { scenarios } from './data/scenarios';
import { useSessionId } from './hooks/useSessionId';
import * as api from './api/client';

const LAYOUTS: Record<string, StationLayout> = {
  [otoprizLayout.stationId]: otoprizLayout,
  [largeOperatorLayout.stationId]: largeOperatorLayout,
};

function App() {
  const initialSessionId = useSessionId();
  const session = useRef(initialSessionId);
  const [guideVisible, setGuideVisible] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const stationRequest = useRef(0);

  const [stationId, setStationId] = useState(otoprizLayout.stationId);
  const [station, setStation] = useState<Station | null>(null);
  const [vehicleId, setVehicleId] = useState(vehicleFixtures[0]!.id);
  const [soc, setSoc] = useState(20);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [stats, setStats] = useState({ shown: 0, accepted: 0, declined: 0 });

  const layout = LAYOUTS[stationId]!;

  const refreshStation = useCallback(async (id: string) => {
    const requestId = ++stationRequest.current;
    try {
      const data = await api.getStationLive(id);
      if (requestId !== stationRequest.current) return;
      setStation(data as Station);
      setApiError(null);
    } catch (err) {
      if (requestId !== stationRequest.current) return;
      setApiError(
        'Demo verileri yüklenemedi. Biraz sonra tekrar deneyin.'
      );
    }
  }, []);

  useEffect(() => {
    void refreshStation(stationId);
  }, [stationId, refreshStation]);

  const handleScan = useCallback(
    async (evseId: string) => {
      setLoading(true);
      setApiError(null);
      try {
        const result = await api.scan({
          sessionId: session.current,
          stationId,
          scannedEvseId: evseId,
          vehicleProfileId: vehicleId,
          currentSocPercent: soc,
        });
        setDecision(result);
        if (result.verdict === 'NUDGE') {
          setStats((s) => ({ ...s, shown: s.shown + 1 }));
        }
      } catch {
        setApiError('İstek başarısız. Sunucuya bağlanılamadı.');
      } finally {
        setLoading(false);
      }
    },
    [stationId, vehicleId, soc]
  );

  const handleAccept = useCallback(async () => {
    if (!decision || loading || scenarioRunning) return;
    setLoading(true);
    setApiError(null);
    try {
      await api.acceptNudge({
        sessionId: session.current, stationId, evseId: decision.selected.evseId,
        triggeredRule: decision.triggeredRule,
      });
      setStats((s) => ({ ...s, accepted: s.accepted + 1 }));
      if (decision.recommended) await handleScan(decision.recommended.evseId);
    } catch { setApiError('Tercihiniz kaydedilemedi. Lütfen tekrar deneyin.'); }
    finally { setLoading(false); }
  }, [decision, stationId, handleScan, loading, scenarioRunning]);

  const handleDecline = useCallback(
    async (reason?: DeclineReason) => {
      if (!decision || loading || scenarioRunning) return;
      setLoading(true);
      setApiError(null);
      try {
        await api.declineNudge({
          sessionId: session.current, stationId, evseId: decision.selected.evseId,
          triggeredRule: decision.triggeredRule, declineReason: reason,
        });
        setStats((s) => ({ ...s, declined: s.declined + 1 }));
        setDecision(null);
      } catch { setApiError('Tercihiniz kaydedilemedi. Lütfen tekrar deneyin.'); }
      finally { setLoading(false); }
    },
    [decision, stationId, loading, scenarioRunning]
  );

  const handleReset = useCallback(async () => {
    setScenarioRunning(true);
    setApiError(null);
    try {
      await api.simulateReset();
      session.current = crypto.randomUUID();
      setActiveScenario(null);
      setDecision(null);
      setStats({ shown: 0, accepted: 0, declined: 0 });
      await refreshStation(stationId);
    } catch {
      setApiError('Demo sıfırlanamadı. Lütfen tekrar deneyin.');
    } finally { setScenarioRunning(false); }
  }, [stationId, refreshStation]);

  const handleRunScenario = useCallback(
    async (scenarioId: string) => {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      setScenarioRunning(true);
      setApiError(null);
      setActiveScenario(scenarioId);
      setDecision(null);
      try {
        await api.simulateReset();
        session.current = crypto.randomUUID();
        setStats({ shown: 0, accepted: 0, declined: 0 });

        if (scenario.stationId !== stationId) {
          setStationId(scenario.stationId);
        }

        if (scenario.presetOccupied) {
          await api.simulateStartSession({
            stationId: scenario.stationId,
            evseId: scenario.presetOccupied.evseId,
            liveDrawKw: scenario.presetOccupied.liveDrawKw,
          });
        }

        await refreshStation(scenario.stationId);
        setVehicleId(scenario.vehicleProfileId);
        setSoc(20);

        const result = await api.scan({
          sessionId: session.current,
          stationId: scenario.stationId,
          scannedEvseId: scenario.scannedEvseId,
          vehicleProfileId: scenario.vehicleProfileId,
          currentSocPercent: 20,
        });
        setDecision(result);
        if (result.verdict === 'NUDGE') {
          setStats((s) => ({ ...s, shown: s.shown + 1 }));
        }
      } catch {
        setApiError('Senaryo çalıştırılamadı. Lütfen tekrar deneyin.');
      } finally {
        setScenarioRunning(false);
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [stationId, refreshStation]
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <header className="mx-auto mb-6 max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-slate-100 sm:text-xl">
              OtoŞarj <span className="text-brand-400">— Akıllı Soket Yönlendirme</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              OtoPriz için hazırlanan çalışan prototip · Simülasyon verileri
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuideVisible(true)}
              title="Kullanım rehberini aç"
              aria-label="Kullanım rehberini aç"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-surface-300/50 bg-surface-100 text-xs font-bold text-slate-400 transition hover:border-brand-500 hover:text-brand-400"
            >
              ?
            </button>
            <label className="text-xs text-slate-500">Saha:</label>
            <select
              aria-label="Örnek saha"
              disabled={loading || scenarioRunning}
              value={stationId}
              onChange={(e) => {
                setStationId(e.target.value);
                setDecision(null);
                setActiveScenario(null);
              }}
              className="rounded-lg border border-surface-300/50 bg-surface-100 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500"
            >
              {Object.values(LAYOUTS).map((l) => (
                <option key={l.stationId} value={l.stationId}>
                  {l.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

      </header>

      <main className="mx-auto max-w-7xl space-y-5">
        <PresentationHero onStart={() => void handleRunScenario('A')} onGuide={() => setGuideVisible(true)} busy={loading || scenarioRunning} />
        <section id="demo" className="scroll-mt-6 space-y-5" aria-label="Etkileşimli demo">
        <ScenarioBar onRun={handleRunScenario} onReset={handleReset} running={loading || scenarioRunning} activeId={activeScenario} />
        <div ref={resultRef} className="scroll-mt-5 space-y-3">
          {apiError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{apiError}</div>}
          <DecisionSummary decision={decision} running={scenarioRunning} />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_330px_1fr]">
          <StationMap
            station={station}
            layout={layout}
            selectedEvseId={decision?.selected.evseId ?? null}
            recommendedEvseId={decision?.recommended?.evseId ?? null}
          />

          <DriverPhone
            vehicles={vehicleFixtures}
            selectedVehicleId={vehicleId}
            onVehicleChange={(id) => { setVehicleId(id); setDecision(null); setActiveScenario(null); }}
            soc={soc}
            onSocChange={(value) => { setSoc(value); setDecision(null); setActiveScenario(null); }}
            evseOptions={station?.evses.filter((e) => e.status === 'available').map((e) => e.id) ?? []}
            onScan={handleScan}
            loading={loading || scenarioRunning}
            decision={decision}
            onAcceptNudge={handleAccept}
            onDeclineNudge={handleDecline}
          />

          <EngineLog decision={decision} stats={stats} />
        </div>
        </section>
      </main>

      <footer className="mx-auto mt-8 max-w-7xl border-t border-surface-300/30 pt-4 text-center text-[11px] text-slate-600">
        <span>Prototip demo · Kişisel veri toplanmaz · Middleware CSMS'e yazmaz, sadece okur</span>
        <a className="ml-4 text-slate-400 hover:text-brand-300" href="http://turbinetwin.esadseyitoglu.xyz">Diğer proje: TurbineTwin ↗</a>
      </footer>
      <WelcomeGuide
        visible={guideVisible}
        onClose={() => {
          setGuideVisible(false);
        }}
      />
    </div>
  );
}

export default App;
