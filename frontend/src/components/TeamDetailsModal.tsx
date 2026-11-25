import { useEffect } from "react";
import {
  Activity,
  Award,
  Building2,
  Flame,
  Footprints,
  Globe,
  Ruler,
  Shield,
  Target,
  User,
  X,
} from "lucide-react";
import type { FormResult, TeamDetailsResponse } from "../types";
import { TeamBadge } from "./TeamBadge";

interface TeamDetailsModalProps {
  details: TeamDetailsResponse | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const RESULT_PILL: Record<FormResult, string> = {
  W: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  D: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  L: "bg-rose-500/20 text-rose-400 border-rose-500/40",
};

export function TeamDetailsModal({
  details,
  loading,
  isOpen,
  onClose,
}: TeamDetailsModalProps) {
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
  const accentColor =
    !team ||
    team.primary_color === "#000000" ||
    team.primary_color === "#FFFFFF"
      ? "#D20515"
      : team.primary_color;

  const isUndav =
    team?.code === "VFB" ||
    (details?.player_profile?.name ?? "").toLowerCase().includes("undav");
  const playerPhoto = team
    ? isUndav
      ? "./images/deniz-undav-cutout.png"
      : `./images/players/${team.code}.png`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={team ? `${team.name} club and player details` : "Club details"}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 z-30 rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-1.5 text-zinc-400 transition hover:border-zinc-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {loading || !details || !team ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
            Loading club & player analytics…
          </div>
        ) : (
          <div className="overflow-y-auto">
            {/* Hero Club Header */}
            <div className="relative overflow-hidden border-b border-zinc-800/90 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6">
              {team.logo_url && (
                <img
                  src={team.logo_url}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-52 w-52 object-contain opacity-[0.09] select-none"
                />
              )}
              <div
                className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: accentColor }}
              />

              <div className="relative z-10 flex flex-wrap items-center gap-4 pr-10">
                <TeamBadge team={team} size="lg" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                      {team.name}
                    </h2>
                    <span className="rounded-md bg-[#D20515]/20 px-2 py-0.5 font-mono text-xs font-bold text-[#ff5c69] border border-[#D20515]/40">
                      Rank #{details.splits.all.rank}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                      {details.club_info.stadium} ({details.club_info.city})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-zinc-500" />
                      Coach: <strong className="text-zinc-200">{details.club_info.coach}</strong>
                    </span>
                    <span>Est. {details.club_info.founded}</span>
                    <span className="font-mono text-[11px] text-zinc-300">
                      Sponsor: {details.club_info.sponsor}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* Featured Player Profile Card */}
              <div className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-[140px_1fr] items-center">
                  {/* Player Portrait / Cutout */}
                  <div className="relative mx-auto flex h-36 w-36 items-end justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                    {team.logo_url && (
                      <img
                        src={team.logo_url}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 m-auto h-24 w-24 object-contain opacity-15"
                      />
                    )}
                    {playerPhoto && (
                      <img
                        src={playerPhoto}
                        alt={details.player_profile.name || team.short_name}
                        className="relative z-10 h-full w-full object-contain object-bottom drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
                      />
                    )}
                  </div>

                  {/* Player Info & Scouting Bio */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase"
                        style={{
                          backgroundColor: `${accentColor}25`,
                          border: `1px solid ${accentColor}66`,
                          color: "#ffffff",
                        }}
                      >
                        #{details.player_profile.number ?? "—"} ·{" "}
                        {details.player_profile.position ?? "KEY"}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">
                        {details.player_profile.role}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white">
                      {details.player_profile.name || `${team.short_name} Key Player`}
                    </h3>

                    <p className="text-xs leading-relaxed text-zinc-300">
                      {details.player_profile.bio}
                    </p>

                    <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1">
                        <Globe className="h-3 w-3 text-zinc-500" />
                        {details.player_profile.nationality}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1">
                        Age: <strong className="text-zinc-200">{details.player_profile.age}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1">
                        <Ruler className="h-3 w-3 text-zinc-500" />
                        {details.player_profile.height}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1">
                        <Footprints className="h-3 w-3 text-zinc-500" />
                        {details.player_profile.foot} Foot
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* W/D/L Rate Distribution Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-300">
                    2026/27 Result Distribution ({details.advanced_stats.played} Matches)
                  </span>
                  <span className="font-mono text-zinc-400">
                    {details.splits.all.won}W · {details.splits.all.drawn}D ·{" "}
                    {details.splits.all.lost}L
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${details.advanced_stats.win_rate}%` }}
                    title={`Wins: ${details.advanced_stats.win_rate}%`}
                  />
                  <div
                    className="bg-amber-400 transition-all"
                    style={{ width: `${details.advanced_stats.draw_rate}%` }}
                    title={`Draws: ${details.advanced_stats.draw_rate}%`}
                  />
                  <div
                    className="bg-rose-500 transition-all"
                    style={{ width: `${details.advanced_stats.loss_rate}%` }}
                    title={`Losses: ${details.advanced_stats.loss_rate}%`}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-zinc-400">
                  <span className="text-emerald-400">
                    Win {details.advanced_stats.win_rate}%
                  </span>
                  <span className="text-amber-300">
                    Draw {details.advanced_stats.draw_rate}%
                  </span>
                  <span className="text-rose-400">
                    Loss {details.advanced_stats.loss_rate}%
                  </span>
                </div>
              </div>

              {/* Advanced Statistics Grid */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  <Activity className="h-4 w-4 text-[#D20515]" />
                  Advanced Season Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      Clean Sheets
                    </span>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {details.advanced_stats.clean_sheets}{" "}
                      <span className="text-xs font-normal text-emerald-400">
                        ({details.advanced_stats.clean_sheet_pct}%)
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      <Target className="h-3.5 w-3.5 text-sky-400" />
                      Goals / Game
                    </span>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {details.advanced_stats.avg_gf.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        / {details.advanced_stats.avg_ga.toFixed(2)} GA
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                      BTTS Rate
                    </span>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {details.advanced_stats.btts_pct}%{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        ({details.advanced_stats.btts_count}/{details.advanced_stats.played})
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                      Over 2.5 Goals
                    </span>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {details.advanced_stats.over_2_5_pct}%{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        ({details.advanced_stats.over_2_5_count}/{details.advanced_stats.played})
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      <Flame className="h-3.5 w-3.5 text-[#D20515]" />
                      Current Streak
                    </span>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {details.advanced_stats.current_streak}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                      Best Unbeaten Run
                    </span>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {details.advanced_stats.unbeaten_run}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        matches
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                      Scored 2+ / Failed
                    </span>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {details.advanced_stats.scored_2_plus}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        / {details.advanced_stats.failed_to_score} nil
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      <Award className="h-3.5 w-3.5 text-amber-400" />
                      Biggest Win
                    </span>
                    <p className="mt-1 truncate text-xs font-bold text-white">
                      {details.advanced_stats.biggest_win
                        ? `${details.advanced_stats.biggest_win.score_display} ${
                            details.advanced_stats.biggest_win.is_home ? "vs" : "@"
                          } ${details.advanced_stats.biggest_win.opponent}`
                        : "—"}
                    </p>
                    {details.advanced_stats.heaviest_loss && (
                      <p className="mt-0.5 truncate text-[10px] text-rose-400">
                        Worst: {details.advanced_stats.heaviest_loss.score_display}{" "}
                        {details.advanced_stats.heaviest_loss.is_home ? "vs" : "@"}{" "}
                        {details.advanced_stats.heaviest_loss.opponent}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Season Match Log */}
              <div>
                <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Full 2026/27 Match Log
                </h3>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/60">
                  {details.match_log.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      No finished matches recorded yet.
                    </div>
                  ) : (
                    details.match_log.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3.5 py-2 text-xs hover:bg-zinc-800/30"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-[10px] font-semibold text-zinc-500 w-8">
                            MD{m.matchday}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                              m.is_home
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-sky-500/10 text-sky-400"
                            }`}
                          >
                            {m.is_home ? "H" : "A"}
                          </span>
                          {m.opponent_logo && (
                            <img
                              src={m.opponent_logo}
                              alt={m.opponent}
                              className="h-4 w-4 object-contain shrink-0"
                            />
                          )}
                          <span className="truncate font-medium text-zinc-200">
                            {m.opponent}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="hidden font-mono text-[10px] text-zinc-500 sm:inline">
                            {m.match_date.split("T")[0]}
                          </span>
                          <span className="font-mono font-bold text-white">
                            {m.home_goals} – {m.away_goals}
                          </span>
                          {m.result && (
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px] font-bold ${RESULT_PILL[m.result]}`}
                            >
                              {m.result}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
