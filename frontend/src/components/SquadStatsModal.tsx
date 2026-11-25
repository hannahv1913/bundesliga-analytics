import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crosshair,
  Footprints,
  Globe,
  Ruler,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IS_STATIC_MODE } from "../api";
import type { SquadPlayer, SquadStatsResponse } from "../types";
import { TeamBadge } from "./TeamBadge";

interface SquadStatsModalProps {
  squad: SquadStatsResponse | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

type PosFilter = "ALL" | "GK" | "DEF" | "MID" | "FWD";
type SortField =
  | "appearances"
  | "minutes"
  | "goals"
  | "assists"
  | "shots"
  | "pass_accuracy"
  | "yellow_cards"
  | "rating"
  | "age";

const POS_BADGE: Record<SquadPlayer["position_group"], string> = {
  GK: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  DEF: "bg-sky-500/15 text-sky-300 border-sky-500/35",
  MID: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
  FWD: "bg-rose-500/15 text-rose-300 border-rose-500/35",
};

export function SquadStatsModal({
  squad,
  loading,
  isOpen,
  onClose,
}: SquadStatsModalProps) {
  const [posFilter, setPosFilter] = useState<PosFilter>("ALL");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("goals");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState<boolean>(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [selectedPlayerId]);

  useEffect(() => {
    if (!isOpen) return;
    setPosFilter("ALL");
    setQuery("");
    setSortField("goals");
    setSortDir("desc");
    setSelectedPlayerId(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPlayerId((prev) => {
          if (prev !== null) return null;
          onClose();
          return null;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!squad) return [];
    const q = query.trim().toLowerCase();
    return squad.players
      .filter((p) => (posFilter === "ALL" ? true : p.position_group === posFilter))
      .filter((p) =>
        q
          ? p.name.toLowerCase().includes(q) ||
            p.nationality.toLowerCase().includes(q) ||
            p.jersey.includes(q)
          : true
      )
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (av === bv) return b.rating - a.rating;
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [squad, posFilter, query, sortField, sortDir]);

  const selectedIndex = useMemo(
    () =>
      selectedPlayerId
        ? filteredPlayers.findIndex((p) => p.id === selectedPlayerId)
        : -1,
    [filteredPlayers, selectedPlayerId]
  );

  const selectedPlayer =
    selectedIndex >= 0 ? filteredPlayers[selectedIndex] : null;

  if (!isOpen) return null;

  const team = squad?.team;
  const accentColor =
    !team ||
    team.primary_color === "#000000" ||
    team.primary_color === "#FFFFFF"
      ? "#D20515"
      : team.primary_color;

  const columns: { key: SortField; label: string; title: string; hideSm?: boolean }[] = [
    { key: "age", label: "Age", title: "Age", hideSm: true },
    { key: "appearances", label: "Apps", title: "Appearances" },
    { key: "minutes", label: "Min", title: "Minutes Played", hideSm: true },
    { key: "goals", label: "G", title: "Goals" },
    { key: "assists", label: "A", title: "Assists" },
    { key: "shots", label: "Sh", title: "Shots", hideSm: true },
    { key: "pass_accuracy", label: "Pass%", title: "Pass Accuracy %", hideSm: true },
    { key: "yellow_cards", label: "YC", title: "Yellow Cards", hideSm: true },
    { key: "rating", label: "Rtg", title: "Season Rating" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={team ? `${team.name} squad player statistics` : "Squad player statistics"}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close squad statistics"
          className="absolute right-4 top-4 z-30 rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-1.5 text-zinc-400 transition hover:border-zinc-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {loading || !squad || !team ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
            Loading full squad player statistics…
          </div>
        ) : selectedPlayer ? (
          /* ===================== IN-DEPTH PLAYER DRILL-DOWN VIEW ===================== */
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/90 bg-zinc-900/80 px-5 py-3 pr-14">
              <button
                type="button"
                onClick={() => setSelectedPlayerId(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-[#D20515]/70 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to {team.short_name} Squad
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() =>
                    setSelectedPlayerId(filteredPlayers[selectedIndex - 1].id)
                  }
                  aria-label="Previous player"
                  className="rounded-md border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-35"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-[11px] text-zinc-400 px-1">
                  {selectedIndex + 1} / {filteredPlayers.length}
                </span>
                <button
                  type="button"
                  disabled={selectedIndex >= filteredPlayers.length - 1}
                  onClick={() =>
                    setSelectedPlayerId(filteredPlayers[selectedIndex + 1].id)
                  }
                  aria-label="Next player"
                  className="rounded-md border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-35"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable In-Depth Player Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Player Banner */}
              <div className="relative min-h-[185px] overflow-hidden border-b border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6">
                {team.logo_url && (
                  <img
                    src={team.logo_url}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2 top-1/2 h-48 w-48 -translate-y-1/2 object-contain opacity-[0.14] select-none"
                  />
                )}
                <div
                  className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-20 blur-3xl"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Player Transparent Cutout on the Right in Front of the Club Logo */}
                {!photoFailed &&
                  (!IS_STATIC_MODE ||
                    selectedPlayer.is_key_player ||
                    selectedPlayer.name.toLowerCase().includes("undav")) && (
                  <div className="pointer-events-none absolute bottom-0 right-4 z-10 hidden h-[175px] w-[170px] items-end justify-end overflow-hidden sm:flex md:right-10">
                    <img
                      key={selectedPlayer.id}
                      src={
                        selectedPlayer.name.toLowerCase().includes("undav")
                          ? "./images/deniz-undav-cutout.png"
                          : selectedPlayer.is_key_player
                          ? `./images/players/${team.code}.png`
                          : `/api/players/photo?name=${encodeURIComponent(
                              selectedPlayer.name
                            )}`
                      }
                      alt={selectedPlayer.name}
                      onError={() => setPhotoFailed(true)}
                      className="h-full w-full select-none object-contain object-bottom drop-shadow-[0_10px_22px_rgba(0,0,0,0.9)]"
                    />
                  </div>
                )}

                <div className="relative z-20 flex flex-wrap items-center gap-5 sm:pr-44">
                  {/* Jersey Number Badge */}
                  <div className="relative flex h-24 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-xl">
                    <span
                      className="font-mono text-3xl font-black tracking-tighter"
                      style={{ color: accentColor }}
                    >
                      #{selectedPlayer.jersey}
                    </span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {selectedPlayer.position_group}
                    </span>
                  </div>

                  {/* Player Meta */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[11px] font-bold uppercase ${POS_BADGE[selectedPlayer.position_group]}`}
                      >
                        #{selectedPlayer.jersey} · {selectedPlayer.position}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/90 px-2 py-0.5 text-[11px] text-zinc-300">
                        <TeamBadge team={team} size="sm" />
                        {team.short_name}
                      </span>
                      {selectedPlayer.rating > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {selectedPlayer.rating.toFixed(2)} Avg Rating
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-extrabold tracking-tight text-white">
                      {selectedPlayer.name}
                    </h2>
                    <p className="text-xs text-zinc-400">{selectedPlayer.role}</p>

                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-300">
                      <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5">
                        <Globe className="h-3 w-3 text-zinc-500" />
                        {selectedPlayer.nationality}
                      </span>
                      <span className="rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5">
                        Age {selectedPlayer.age}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5">
                        <Ruler className="h-3 w-3 text-zinc-500" />
                        {selectedPlayer.height}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5">
                        <Footprints className="h-3 w-3 text-zinc-500" />
                        {selectedPlayer.foot} Foot
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics Body */}
              <div className="space-y-6 p-6">
                {/* Headline Season KPIs */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                      <Target className="h-3.5 w-3.5 text-emerald-400" />
                      Goals / xG
                    </span>
                    <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                      {selectedPlayer.goals}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        ({selectedPlayer.xg.toFixed(1)} xG)
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                      <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                      Assists / xA
                    </span>
                    <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                      {selectedPlayer.assists}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        ({selectedPlayer.xa.toFixed(1)} xA)
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      Appearances
                    </span>
                    <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                      {selectedPlayer.appearances}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        ({selectedPlayer.starts}S / {selectedPlayer.sub_appearances}Sub)
                      </span>
                    </p>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {selectedPlayer.minutes} mins played
                    </span>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                      <Crosshair className="h-3.5 w-3.5 text-[#D20515]" />
                      Pass Accuracy
                    </span>
                    <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                      {selectedPlayer.pass_accuracy.toFixed(1)}%
                    </p>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {selectedPlayer.key_passes_per_90} KP / 90
                    </span>
                  </div>
                </div>

                {/* Attacking / Passing / Defensive Per-90 Breakdown */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      <Target className="h-3.5 w-3.5" />
                      Attacking Output
                    </h4>
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Total Shots</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.shots}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Shots / 90</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.shots_per_90.toFixed(1)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">
                          {selectedPlayer.position_group === "GK" ? "Save %" : "Shot Accuracy"}
                        </dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.shot_accuracy.toFixed(1)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Dribbles / 90</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.dribbles_per_90.toFixed(1)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-400">
                      <Activity className="h-3.5 w-3.5" />
                      Progression & Passing
                    </h4>
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Pass Accuracy</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.pass_accuracy.toFixed(1)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Key Passes / 90</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.key_passes_per_90.toFixed(1)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Progressive Passes / 90</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.progressive_passes_per_90.toFixed(1)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Goal Contributions</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.goals + selectedPlayer.assists}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      <Shield className="h-3.5 w-3.5" />
                      Defending & Discipline
                    </h4>
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Tackles / 90</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.tackles_per_90.toFixed(1)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Interceptions / 90</dt>
                        <dd className="font-mono font-bold text-white">{selectedPlayer.interceptions_per_90.toFixed(1)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Duels Won / Aerial</dt>
                        <dd className="font-mono font-bold text-white">
                          {selectedPlayer.duels_won_pct.toFixed(1)}% / {selectedPlayer.aerial_duels_pct.toFixed(1)}%
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Cards (Y / R)</dt>
                        <dd className="font-mono font-bold">
                          <span className="text-amber-300">{selectedPlayer.yellow_cards}</span>
                          <span className="text-zinc-500"> / </span>
                          <span className="text-rose-400">{selectedPlayer.red_cards}</span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Recent Matchday Ratings Chart + Scouting Attributes */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      Recent Matchday Ratings
                    </h4>
                    {selectedPlayer.recent_ratings.length === 0 ? (
                      <div className="flex h-36 items-center justify-center text-xs text-zinc-500">
                        No recent match ratings recorded.
                      </div>
                    ) : (
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={selectedPlayer.recent_ratings}
                            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                          >
                            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                              dataKey="matchday"
                              tickFormatter={(v) => `MD${v}`}
                              tick={{ fill: "#a1a1aa", fontSize: 11 }}
                              axisLine={{ stroke: "#3f3f46" }}
                            />
                            <YAxis
                              domain={[5, 10]}
                              tick={{ fill: "#a1a1aa", fontSize: 11 }}
                              axisLine={{ stroke: "#3f3f46" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#09090b",
                                borderColor: "#3f3f46",
                                borderRadius: "8px",
                                fontSize: "12px",
                              }}
                              labelFormatter={(v) => `Matchday ${v}`}
                            />
                            <Bar
                              dataKey="rating"
                              name="Match Rating"
                              fill={accentColor}
                              radius={[4, 4, 0, 0]}
                              maxBarSize={36}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                      <Zap className="h-3.5 w-3.5 text-[#D20515]" />
                      Scouting Attribute Index
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        {
                          label:
                            selectedPlayer.position_group === "GK"
                              ? "Shot Stopping"
                              : "Finishing",
                          value:
                            selectedPlayer.position_group === "GK"
                              ? Math.max(76, selectedPlayer.attributes.physical)
                              : selectedPlayer.attributes.finishing,
                        },
                        { label: "Creativity", value: selectedPlayer.attributes.creativity },
                        { label: "Pressing & Workrate", value: selectedPlayer.attributes.pressing },
                        { label: "Physical & Duels", value: selectedPlayer.attributes.physical },
                        { label: "Ball Progression", value: selectedPlayer.attributes.progression },
                      ].map((bar) => (
                        <div key={bar.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-300">{bar.label}</span>
                            <span className="font-mono font-bold text-white">{bar.value}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${bar.value}%`,
                                backgroundColor: accentColor,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== FULL SQUAD TABLE VIEW ===================== */
          <>
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden border-b border-zinc-800/90 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-5 sm:p-6">
              {team.logo_url && (
                <img
                  src={team.logo_url}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 object-contain opacity-[0.09] select-none"
                />
              )}

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pr-10">
                <div className="flex items-center gap-3.5">
                  <TeamBadge team={team} size="lg" />
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-white">
                      {team.name} — Squad Statistics
                    </h2>
                    <p className="text-xs text-zinc-400">
                      {squad.squad_count} Players · Avg Age {squad.summary.avg_age} · Click any player for in-depth analytics
                    </p>
                  </div>
                </div>

                {/* Quick Summary Pills */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {squad.summary.top_scorer && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5">
                      <Target className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-zinc-400">Top Scorer:</span>
                      <span className="font-bold text-white">
                        {squad.summary.top_scorer.name} ({squad.summary.top_scorer.goals})
                      </span>
                    </div>
                  )}
                  {squad.summary.top_rated && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-zinc-400">Top Rated:</span>
                      <span className="font-bold text-white">
                        {squad.summary.top_rated.name} ({squad.summary.top_rated.rating.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Bar */}
              <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/90 p-0.5">
                  {(["ALL", "GK", "DEF", "MID", "FWD"] as PosFilter[]).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosFilter(pos)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                        posFilter === pos
                          ? "bg-[#D20515] text-white"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter by player, nation, or #…"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-[#D20515] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Squad Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-md">
                  <tr className="border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="px-3 py-2.5 text-center w-10">#</th>
                    <th className="px-3 py-2.5">Player</th>
                    <th className="px-2 py-2.5 text-center">Pos</th>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        title={col.title}
                        className={`cursor-pointer select-none px-2.5 py-2.5 text-center hover:text-white ${
                          col.hideSm ? "hidden sm:table-cell" : ""
                        }`}
                      >
                        <span className="inline-flex items-center justify-center gap-0.5">
                          {col.label}
                          {sortField === col.key &&
                            (sortDir === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#D20515]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#D20515]" />
                            ))}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-4 py-10 text-center text-zinc-500"
                      >
                        <Users className="mx-auto mb-2 h-5 w-5 opacity-40" />
                        No squad players match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPlayerId(p.id)}
                        title={`Click for ${p.name}'s in-depth statistics`}
                        className={`cursor-pointer transition-colors ${
                          p.is_key_player
                            ? "bg-[#D20515]/10 hover:bg-[#D20515]/20"
                            : "hover:bg-zinc-800/60"
                        }`}
                      >
                        <td className="px-3 py-2 text-center font-mono text-zinc-400">
                          {p.jersey}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white group-hover:underline">
                              {p.name}
                            </span>
                            {p.is_key_player && (
                              <span className="rounded bg-[#D20515]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#ff5c69] border border-[#D20515]/40">
                                Key
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500">
                            {p.nationality} · {p.height}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span
                            className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${POS_BADGE[p.position_group]}`}
                          >
                            {p.position_group}
                          </span>
                        </td>
                        <td className="hidden px-2.5 py-2 text-center font-mono text-zinc-400 sm:table-cell">
                          {p.age}
                        </td>
                        <td className="px-2.5 py-2 text-center font-mono text-zinc-300">
                          {p.appearances}
                        </td>
                        <td className="hidden px-2.5 py-2 text-center font-mono text-zinc-400 sm:table-cell">
                          {p.minutes}
                        </td>
                        <td className="px-2.5 py-2 text-center font-mono font-bold text-emerald-400">
                          {p.goals}
                        </td>
                        <td className="px-2.5 py-2 text-center font-mono font-semibold text-sky-400">
                          {p.assists}
                        </td>
                        <td className="hidden px-2.5 py-2 text-center font-mono text-zinc-300 sm:table-cell">
                          {p.shots}
                        </td>
                        <td className="hidden px-2.5 py-2 text-center font-mono text-zinc-300 sm:table-cell">
                          {p.pass_accuracy.toFixed(1)}%
                        </td>
                        <td className="hidden px-2.5 py-2 text-center font-mono text-amber-300 sm:table-cell">
                          {p.yellow_cards}
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                              p.rating >= 7.3
                                ? "bg-emerald-500/20 text-emerald-300"
                                : p.rating >= 6.8
                                ? "bg-zinc-800 text-zinc-100"
                                : "bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            {p.rating > 0 ? p.rating.toFixed(2) : "—"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
