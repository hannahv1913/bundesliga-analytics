import { useEffect } from "react";
import {
  Activity,
  Clock,
  Crosshair,
  Footprints,
  Globe,
  Ruler,
  Sparkles,
  Star,
  Target,
  X,
  Zap,
} from "lucide-react";
import type { TeamDetailsResponse } from "../types";
import { TeamBadge } from "./TeamBadge";

interface PlayerStatsModalProps {
  details: TeamDetailsResponse | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerStatsModal({
  details,
  loading,
  isOpen,
  onClose,
}: PlayerStatsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const team = details?.team;
  const player = details?.player_profile;
  const stats = player?.stats;
  const attrs = player?.attributes;
  const isGoalkeeper = player?.position === "GK";

  const accentColor =
    !team ||
    team.primary_color === "#000000" ||
    team.primary_color === "#FFFFFF"
      ? "#D20515"
      : team.primary_color;

  const isUndav =
    team?.code === "VFB" ||
    (player?.name ?? "").toLowerCase().includes("undav");
  const photoSrc = team
    ? isUndav
      ? "./images/deniz-undav-cutout.png"
      : `./images/players/${team.code}.png`
    : null;

  const attributeBars = attrs
    ? [
        { label: isGoalkeeper ? "Shot Stopping" : "Finishing", value: isGoalkeeper ? 86 : attrs.finishing },
        { label: "Creativity", value: attrs.creativity },
        { label: isGoalkeeper ? "Command of Area" : "Pressing & Workrate", value: attrs.pressing },
        { label: "Physical & Duels", value: attrs.physical },
        { label: "Ball Progression", value: attrs.progression },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={player?.name ? `${player.name} statistics` : "Player statistics"}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close player statistics"
          className="absolute right-4 top-4 z-30 rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-1.5 text-zinc-400 transition hover:border-zinc-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {loading || !details || !team || !player ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
            Loading player statistics…
          </div>
        ) : (
          <div className="overflow-y-auto">
            {/* Player Hero Header */}
            <div className="relative overflow-hidden border-b border-zinc-800/90 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6">
              {team.logo_url && (
                <img
                  src={team.logo_url}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-4 top-1/2 h-48 w-48 -translate-y-1/2 object-contain opacity-[0.12] select-none"
                />
              )}
              <div
                className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full opacity-25 blur-3xl"
                style={{ backgroundColor: accentColor }}
              />

              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
                {/* Player Photo / Cutout */}
                <div className="relative h-36 w-32 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
                  {photoSrc && (
                    <img
                      src={photoSrc}
                      alt={player.name || team.short_name}
                      className="h-full w-full object-contain object-bottom drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
                    />
                  )}
                </div>

                {/* Name, Club, Rating & Bio Meta */}
                <div className="flex-1 space-y-2 pr-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase"
                      style={{
                        backgroundColor: `${accentColor}25`,
                        border: `1px solid ${accentColor}66`,
                        color: "#ffffff",
                      }}
                    >
                      #{player.number ?? "—"} · {player.position ?? "FWD"}
                    </span>
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/90 px-2 py-0.5 text-[11px] text-zinc-300">
                      <TeamBadge team={team} size="sm" />
                      <span>{team.short_name}</span>
                    </div>
                    {stats && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {stats.rating.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    {player.name}
                  </h2>
                  <p className="text-xs font-medium text-zinc-400">{player.role}</p>

                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-300">
                    <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5">
                      <Globe className="h-3 w-3 text-zinc-500" />
                      {player.nationality}
                    </span>
                    <span className="rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5">
                      Age {player.age}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5">
                      <Ruler className="h-3 w-3 text-zinc-500" />
                      {player.height}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5">
                      <Footprints className="h-3 w-3 text-zinc-500" />
                      {player.foot}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* Scouting Summary */}
              <p className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 text-xs leading-relaxed text-zinc-300">
                {player.bio}
              </p>

              {/* 2026/27 Season Stats Grid */}
              {stats && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <Activity className="h-4 w-4 text-[#D20515]" />
                    2026/27 Bundesliga Season Statistics
                  </h3>

                  {/* Headline KPIs */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                        <Target className="h-3.5 w-3.5 text-emerald-400" />
                        {isGoalkeeper ? "Clean Sheets" : "Goals"}
                      </span>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                        {isGoalkeeper
                          ? details.advanced_stats.clean_sheets
                          : stats.goals}
                      </p>
                      {!isGoalkeeper && (
                        <span className="font-mono text-[10px] text-zinc-400">
                          xG {stats.xg.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                        <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                        {isGoalkeeper ? "Save %" : "Assists"}
                      </span>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                        {isGoalkeeper ? `${stats.shot_accuracy}%` : stats.assists}
                      </p>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {isGoalkeeper
                          ? "Shot stopping"
                          : `${stats.goals + stats.assists} G+A`}
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        Appearances
                      </span>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                        {stats.appearances}
                      </p>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {stats.minutes} mins
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                        <Crosshair className="h-3.5 w-3.5 text-[#D20515]" />
                        Pass Acc.
                      </span>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                        {stats.pass_accuracy}%
                      </p>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {stats.key_passes_per_90} KP / 90
                      </span>
                    </div>
                  </div>

                  {/* Per-90 Secondary Row */}
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/80 px-3 py-2">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Shots / 90
                      </span>
                      <p className="font-mono text-sm font-bold text-zinc-100">
                        {stats.shots_per_90.toFixed(1)}{" "}
                        {!isGoalkeeper && (
                          <span className="text-[10px] font-normal text-zinc-400">
                            ({stats.shot_accuracy}% on target)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/80 px-3 py-2">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Dribbles / 90
                      </span>
                      <p className="font-mono text-sm font-bold text-zinc-100">
                        {stats.dribbles_per_90.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/80 px-3 py-2">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Duels Won
                      </span>
                      <p className="font-mono text-sm font-bold text-zinc-100">
                        {stats.duels_won_pct}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attribute Profile Bars */}
              {attributeBars.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Scouting Attribute Index
                  </h3>
                  <div className="space-y-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    {attributeBars.map((bar) => (
                      <div key={bar.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-zinc-300">
                            {bar.label}
                          </span>
                          <span className="font-mono font-bold text-white">
                            {bar.value}
                          </span>
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
