import { useCallback, useEffect, useState } from 'react';
import { vehicleFixtures, type Decision, type DeclineReason, type Station } from '@otosarj/engine';
import { StationMap } from './components/StationMap';
import { DriverPhone } from './components/DriverPhone';
import { EngineLog } from './components/EngineLog';
import { ScenarioBar } from './components/ScenarioBar';
import { WelcomeGuide, markWelcomeSeen, useShouldShowWelcomeOnLoad } from './components/WelcomeGuide';
import { otoprizLayout, largeOperatorLayout, type StationLayout } from './data/stationLayout';
import { scenarios } from './data/scenarios';
import { useSessionId } from './hooks/useSessionId';
import * as api from './api/client';

const LAYOUTS: Record<string, StationLayout> = {
  [otoprizLayout.stationId]: otoprizLayout,
  [largeOperatorLayout.stationId]: largeOperatorLayout,
};

function App() {
  const sessionId = useSessionId();
  const showOnLoad = useShouldShowWelcomeOnLoad();
  const [guideVisible, setGuideVisible] = useState(showOnLoad);

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
    try {
      const data = await api.getStationLive(id);
      setStation(data as Station);
      setApiError(null);
    } catch (err) {
      setApiError(
        'Middleware API\'ye ulaşılamıyor. Sunucu ayakta mı? (bkz. README "Kurulum")'
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
          sessionId,
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
    [sessionId, stationId, vehicleId, soc]
  );

  const handleAccept = useCallback(async () => {
    if (!decision) return;
    setStats((s) => ({ ...s, accepted: s.accepted + 1 }));
    await api.acceptNudge({
      sessionId,
      stationId,
      evseId: decision.selected.evseId,
      triggeredRule: decision.triggeredRule,
    });
    if (decision.recommended) {
      await handleScan(decision.recommended.evseId);
    }
  }, [decision, sessionId, stationId, handleScan]);

  const handleDecline = useCallback(
    async (reason?: DeclineReason) => {
      if (!decision) return;
      setStats((s) => ({ ...s, declined: s.declined + 1 }));
      await api.declineNudge({
        sessionId,
        stationId,
        evseId: decision.selected.evseId,
        triggeredRule: decision.triggeredRule,
        declineReason: reason,
      });
      setDecision(null);
    },
    [decision, sessionId, stationId]
  );

  const handleReset = useCallback(async () => {
    await api.simulateReset();
    setDecision(null);
    setStats({ shown: 0, accepted: 0, declined: 0 });
    await refreshStation(stationId);
  }, [stationId, refreshStation]);

  const handleRunScenario = useCallback(
    async (scenarioId: string) => {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      setScenarioRunning(true);
      setDecision(null);
      try {
        await api.simulateReset();

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
          sessionId,
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
        setApiError('Senaryo çalıştırılamadı. Sunucuya bağlanılamadı.');
      } finally {
        setScenarioRunning(false);
      }
    },
    [sessionId, stationId, refreshStation]
  );

  return (
    <div className="min-h-screen bg-surface-0 px-4 py-6 sm:px-6 lg:px-10">
      <header className="mx-auto mb-6 max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-100 sm:text-xl">
              OtoŞarj <span className="text-brand-400">— Akıllı Soket Yönlendirme</span>
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Zero-friction middleware simülatörü · QR okutma anında canlı karar
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuideVisible(true)}
              title="Kullanım rehberini aç"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-surface-300/50 bg-surface-100 text-xs font-bold text-slate-400 transition hover:border-brand-500 hover:text-brand-400"
            >
              ?
            </button>
            <label className="text-xs text-slate-500">Saha:</label>
            <select
              value={stationId}
              onChange={(e) => {
                setStationId(e.target.value);
                setDecision(null);
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

        {apiError && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {apiError}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl space-y-5">
        <ScenarioBar onRun={handleRunScenario} onReset={handleReset} running={scenarioRunning} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto_1fr]">
          <StationMap
            station={station}
            layout={layout}
            selectedEvseId={decision?.selected.evseId ?? null}
            recommendedEvseId={decision?.recommended?.evseId ?? null}
          />

          <DriverPhone
            vehicles={vehicleFixtures}
            selectedVehicleId={vehicleId}
            onVehicleChange={setVehicleId}
            soc={soc}
            onSocChange={setSoc}
            evseOptions={station?.evses.map((e) => e.id) ?? []}
            onScan={handleScan}
            loading={loading}
            decision={decision}
            onAcceptNudge={handleAccept}
            onDeclineNudge={handleDecline}
          />

          <EngineLog decision={decision} stats={stats} />
        </div>
      </main>

      <footer className="mx-auto mt-8 max-w-7xl border-t border-surface-300/30 pt-4 text-center text-[11px] text-slate-600">
        Prototip demo · Kişisel veri toplanmaz · Middleware CSMS'e yazmaz, sadece okur
      </footer>
      <WelcomeGuide
        visible={guideVisible}
        onClose={() => {
          markWelcomeSeen();
          setGuideVisible(false);
        }}
      />
    </div>
  );
}

export default App;
