import { useCallback, useEffect, useState } from "react";
import {
  getMatches,
  getQuadrant,
  getStandings,
  getTeamDetails,
  getTeamSquad,
  getTeamSummary,
  syncData,
} from "./api";
import { AttackDefenseChart } from "./components/AttackDefenseChart";
import { ClubDeepDive } from "./components/ClubDeepDive";
import { HeaderBar } from "./components/HeaderBar";
import { HeroBanner } from "./components/HeroBanner";
import { LeagueTable } from "./components/LeagueTable";
import { MatchdayExplorer } from "./components/MatchdayExplorer";
import { PlayerStatsModal } from "./components/PlayerStatsModal";
import { SquadStatsModal } from "./components/SquadStatsModal";
import { TeamDetailsModal } from "./components/TeamDetailsModal";
import type {
  MatchItem,
  QuadrantClub,
  SquadStatsResponse,
  StandingRow,
  TeamDetailsResponse,
  TeamSummaryResponse,
  VenueFilter,
} from "./types";

export default function App() {
  const [venue, setVenue] = useState<VenueFilter>("all");
  const [upToMatchday, setUpToMatchday] = useState<number>(34);
  const [maxPlayedMatchday, setMaxPlayedMatchday] = useState<number>(34);
  const [initializedMatchday, setInitializedMatchday] = useState<boolean>(false);

  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadingStandings, setLoadingStandings] = useState<boolean>(true);

  const [quadrantClubs, setQuadrantClubs] = useState<QuadrantClub[]>([]);
  const [avgGf, setAvgGf] = useState<number>(0);
  const [avgGa, setAvgGa] = useState<number>(0);

  const [explorerMatchday, setExplorerMatchday] = useState<number>(1);
  const [availableMatchdays, setAvailableMatchdays] = useState<number[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [initializedExplorer, setInitializedExplorer] = useState<boolean>(false);

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamSummary, setTeamSummary] = useState<TeamSummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  const [modalTeamId, setModalTeamId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<"team" | "player" | "squad" | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [squadStats, setSquadStats] = useState<SquadStatsResponse | null>(null);
  const [loadingSquad, setLoadingSquad] = useState<boolean>(false);

  const openTeamModal = (teamId: number) => {
    setModalTeamId(teamId);
    setModalMode("team");
  };

  const openPlayerModal = (teamId: number) => {
    setModalTeamId(teamId);
    setModalMode("player");
  };

  const openSquadModal = (teamId: number) => {
    setModalTeamId(teamId);
    setModalMode("squad");
  };

  const closeModal = () => {
    setModalTeamId(null);
    setModalMode(null);
  };

  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (v: VenueFilter, md: number) => {
    setLoadingStandings(true);
    try {
      const [stRes, qRes] = await Promise.all([
        getStandings(v, md),
        getQuadrant(v, md),
      ]);
      setStandings(stRes.standings);
      setMaxPlayedMatchday(stRes.max_played_matchday);
      setLastUpdated(stRes.last_updated);
      setQuadrantClubs(qRes.clubs);
      setAvgGf(qRes.avg_gf_per_game);
      setAvgGa(qRes.avg_ga_per_game);

      if (!initializedMatchday) {
        setUpToMatchday(stRes.max_played_matchday);
        setInitializedMatchday(true);
      }

      setSelectedTeamId((prev) =>
        prev !== null ? prev : stRes.standings[0]?.team.id ?? null
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load standings");
    } finally {
      setLoadingStandings(false);
    }
  }, [initializedMatchday]);

  useEffect(() => {
    loadAnalytics(venue, upToMatchday);
  }, [venue, upToMatchday, loadAnalytics]);

  const loadMatches = useCallback(async (md?: number) => {
    try {
      const res = await getMatches({ matchday: md });
      setAvailableMatchdays(res.available_matchdays);
      setMatches(res.matches);
      if (!initializedExplorer) {
        setExplorerMatchday(res.current_matchday);
        setInitializedExplorer(true);
        if (md === undefined && res.current_matchday !== 1) {
          const currentRes = await getMatches({ matchday: res.current_matchday });
          setMatches(currentRes.matches);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    }
  }, [initializedExplorer]);

  useEffect(() => {
    loadMatches(initializedExplorer ? explorerMatchday : undefined);
  }, [explorerMatchday, initializedExplorer, loadMatches]);

  useEffect(() => {
    if (selectedTeamId === null) return;
    let cancelled = false;
    setLoadingSummary(true);
    getTeamSummary(selectedTeamId)
      .then((res) => {
        if (!cancelled) setTeamSummary(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load team summary");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTeamId]);

  useEffect(() => {
    if (modalTeamId === null || modalMode === null) return;
    let cancelled = false;

    if (modalMode === "squad") {
      setLoadingSquad(true);
      setSquadStats(null);
      getTeamSquad(modalTeamId)
        .then((res) => {
          if (!cancelled) setSquadStats(res);
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to load squad stats");
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingSquad(false);
        });
    } else {
      setLoadingDetails(true);
      setTeamDetails(null);
      getTeamDetails(modalTeamId)
        .then((res) => {
          if (!cancelled) setTeamDetails(res);
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to load club details");
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingDetails(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [modalTeamId, modalMode]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await syncData();
      await Promise.all([
        loadAnalytics(venue, upToMatchday),
        loadMatches(explorerMatchday),
      ]);
      if (selectedTeamId !== null) {
        const summary = await getTeamSummary(selectedTeamId);
        setTeamSummary(summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-zinc-100 bundesliga-grid-bg">
      {/* Dynamic Bundesliga Stadium Background Layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Drifting Crimson Stadium Floodlight Orbs */}
        <div className="absolute -left-32 top-16 h-[460px] w-[460px] rounded-full bg-[#D20515] blur-[150px] animate-[pulseGlow_12s_ease-in-out_infinite]" />
        <div className="absolute -right-24 top-[42%] h-[420px] w-[420px] rounded-full bg-[#D20515] blur-[160px] animate-[pulseGlowReverse_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-120px] left-1/3 h-[380px] w-[380px] rounded-full bg-rose-900/40 blur-[140px]" />

        {/* Subtle Watermarked Bundesliga Logo */}
        <img
          src="./images/bundesliga-logo.png"
          alt=""
          aria-hidden="true"
          className="fixed -bottom-20 -right-16 h-[420px] w-[420px] object-contain opacity-[0.035] grayscale select-none"
        />
      </div>

      <div className="relative z-10">
        <HeaderBar
          venue={venue}
          onVenueChange={setVenue}
          upToMatchday={upToMatchday}
          maxPlayedMatchday={maxPlayedMatchday}
          onMatchdayChange={setUpToMatchday}
          onSync={handleSync}
          syncing={syncing}
          lastUpdated={lastUpdated}
        />

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
          <HeroBanner
            standings={standings}
            maxPlayedMatchday={maxPlayedMatchday}
            avgGfPerGame={avgGf}
            onSelectStuttgart={() => {
              const vfb = standings.find(
                (r) =>
                  r.team.name.includes("Stuttgart") || r.team.code === "VFB"
              );
              if (vfb) setSelectedTeamId(vfb.team.id);
            }}
          />

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Top Grid: Standings Table (left) + Quadrant & Matchday Explorer (right) */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <LeagueTable
                standings={standings}
                selectedTeamId={selectedTeamId}
                onSelectTeam={setSelectedTeamId}
                onOpenTeamModal={openTeamModal}
                onOpenSquadModal={openSquadModal}
                loading={loadingStandings}
              />
            </div>

            <div className="flex flex-col gap-6 xl:col-span-5">
              <AttackDefenseChart
                clubs={quadrantClubs}
                avgGf={avgGf}
                avgGa={avgGa}
                selectedTeamId={selectedTeamId}
                onSelectTeam={setSelectedTeamId}
              />
              <MatchdayExplorer
                matchday={explorerMatchday}
                availableMatchdays={availableMatchdays}
                onMatchdayChange={setExplorerMatchday}
                matches={matches}
                selectedTeamId={selectedTeamId}
                onSelectTeam={setSelectedTeamId}
              />
            </div>
          </div>

          {/* Bottom Panel: Club Deep-Dive */}
          <ClubDeepDive
            summary={teamSummary}
            loading={loadingSummary}
            onOpenPlayerModal={openPlayerModal}
          />
        </main>
      </div>

      <TeamDetailsModal
        details={teamDetails}
        loading={loadingDetails}
        isOpen={modalMode === "team" && modalTeamId !== null}
        onClose={closeModal}
      />

      <PlayerStatsModal
        details={teamDetails}
        loading={loadingDetails}
        isOpen={modalMode === "player" && modalTeamId !== null}
        onClose={closeModal}
      />

      <SquadStatsModal
        squad={squadStats}
        loading={loadingSquad}
        isOpen={modalMode === "squad" && modalTeamId !== null}
        onClose={closeModal}
      />
    </div>
  );
}
