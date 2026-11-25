import { Award, Home, Plane, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FormResult, TeamSummaryResponse } from "../types";
import { PlayerSpotlight } from "./PlayerSpotlight";
import { TeamBadge } from "./TeamBadge";

interface ClubDeepDiveProps {
  summary: TeamSummaryResponse | null;
  loading: boolean;
  onOpenPlayerModal: (teamId: number) => void;
}

const RESULT_PILL: Record<FormResult, string> = {
  W: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  D: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  L: "bg-rose-500/20 text-rose-400 border-rose-500/40",
};

export function ClubDeepDive({
  summary,
  loading,
  onOpenPlayerModal,
}: ClubDeepDiveProps) {
  if (loading && !summary) {
    return (
      <section className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-6 text-center text-xs text-zinc-400">
        Loading club analytics…
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-6 text-center text-xs text-zinc-400">
        Select any club from the standings table or chart to view its deep-dive.
      </section>
    );
  }

  const { team, trajectory, splits, biggest_win, recent_fixtures, upcoming_fixtures } =
    summary;
  const lineColor =
    team.primary_color === "#000000" || team.primary_color === "#FFFFFF"
      ? "#D20515"
      : team.primary_color;

  return (
    <section className="flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-900/70 backdrop-blur-md shadow-xl overflow-hidden">
      {/* Club Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/50 px-5 py-4">
        <div className="flex items-center gap-3.5">
          <TeamBadge team={team} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{team.name}</h2>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-300">
                #{splits.all.rank}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {splits.all.points} pts in {splits.all.played} matches ·{" "}
              <span className="font-mono text-zinc-200">
                {splits.all.ppg.toFixed(2)} PPG
              </span>
            </p>
          </div>
        </div>

        {biggest_win && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <Award className="h-4 w-4 text-emerald-400" />
            <div className="text-xs">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300/80 block">
                Biggest Win (MD {biggest_win.matchday})
              </span>
              <span className="font-semibold text-white">
                {biggest_win.score_display} {biggest_win.is_home ? "vs" : "@"}{" "}
                {biggest_win.opponent}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-12">
        {/* Key Player Cutout + Logo Background */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <PlayerSpotlight
            team={team}
            onOpenPlayerStats={() => onOpenPlayerModal(team.id)}
          />
        </div>

        {/* Points Trajectory Chart */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#D20515]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Cumulative Points Trajectory vs. League Average
            </h3>
          </div>
          <div className="h-[220px] w-full rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-2">
            {trajectory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No matchday trajectory data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trajectory}
                  margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
                >
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="matchday"
                    tickFormatter={(v) => `MD${v}`}
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={{ stroke: "#3f3f46" }}
                  />
                  <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={{ stroke: "#3f3f46" }}
                    allowDecimals={false}
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
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="cumulative_points"
                    name={team.short_name}
                    stroke={lineColor}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: lineColor }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="league_avg_cumulative_points"
                    name="League Avg"
                    stroke="#71717a"
                    strokeWidth={1.75}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Home vs Away Splits + Recent/Upcoming */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Home Split */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Home className="h-3.5 w-3.5 text-emerald-400" />
                Home Record
              </div>
              <p className="font-mono text-lg font-bold text-white">
                {splits.home.points}{" "}
                <span className="text-xs font-normal text-zinc-400">pts</span>
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-300">
                {splits.home.won}W-{splits.home.drawn}D-{splits.home.lost}L ·{" "}
                {splits.home.gf}:{splits.home.ga}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                {splits.home.ppg.toFixed(2)} PPG ({splits.home.played} MP)
              </p>
            </div>

            {/* Away Split */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Plane className="h-3.5 w-3.5 text-sky-400" />
                Away Record
              </div>
              <p className="font-mono text-lg font-bold text-white">
                {splits.away.points}{" "}
                <span className="text-xs font-normal text-zinc-400">pts</span>
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-300">
                {splits.away.won}W-{splits.away.drawn}D-{splits.away.lost}L ·{" "}
                {splits.away.gf}:{splits.away.ga}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                {splits.away.ppg.toFixed(2)} PPG ({splits.away.played} MP)
              </p>
            </div>
          </div>

          {/* Recent & Upcoming Fixtures */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Recent Results
              </h4>
              <div className="space-y-1.5">
                {recent_fixtures.length === 0 ? (
                  <p className="text-xs text-zinc-500">No matches played.</p>
                ) : (
                  recent_fixtures.slice(0, 4).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate text-zinc-300">
                        <span className="font-mono text-[10px] text-zinc-500 mr-1">
                          MD{f.matchday}
                        </span>
                        {f.is_home ? "vs" : "@"} {f.opponent}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[11px] text-zinc-200">
                          {f.home_goals}–{f.away_goals}
                        </span>
                        {f.result && (
                          <span
                            className={`inline-flex h-4 w-4 items-center justify-center rounded border font-mono text-[9px] font-bold ${RESULT_PILL[f.result]}`}
                          >
                            {f.result}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Upcoming Fixtures
              </h4>
              <div className="space-y-1.5">
                {upcoming_fixtures.length === 0 ? (
                  <p className="text-xs text-zinc-500">Season complete.</p>
                ) : (
                  upcoming_fixtures.slice(0, 4).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate text-zinc-300">
                        <span className="font-mono text-[10px] text-zinc-500 mr-1">
                          MD{f.matchday}
                        </span>
                        {f.is_home ? "vs" : "@"} {f.opponent}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                        {f.match_date.split("T")[0]}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
