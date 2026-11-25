import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { MatchItem } from "../types";
import { TeamBadge } from "./TeamBadge";

interface MatchdayExplorerProps {
  matchday: number;
  availableMatchdays: number[];
  onMatchdayChange: (md: number) => void;
  matches: MatchItem[];
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number) => void;
}

function formatMatchDate(raw: string): string {
  if (!raw) return "TBD";
  const [datePart, timePart] = raw.split("T");
  const d = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return timePart ? `${dateLabel} · ${timePart}` : dateLabel;
}

export function MatchdayExplorer({
  matchday,
  availableMatchdays,
  onMatchdayChange,
  matches,
  selectedTeamId,
  onSelectTeam,
}: MatchdayExplorerProps) {
  const minMd = availableMatchdays[0] ?? 1;
  const maxMd = availableMatchdays[availableMatchdays.length - 1] ?? 34;

  return (
    <section className="flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-900/70 backdrop-blur-md shadow-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#D20515]" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Matchday Explorer
            </h2>
            <p className="text-xs text-zinc-400">
              Fixtures & full-time results
            </p>
          </div>
        </div>

        {/* Stepper + Dropdown */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onMatchdayChange(Math.max(minMd, matchday - 1))}
            disabled={matchday <= minMd}
            aria-label="Previous matchday"
            className="rounded-md border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <select
            value={matchday}
            onChange={(e) => onMatchdayChange(Number(e.target.value))}
            aria-label="Select matchday"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 font-mono text-xs font-semibold text-white focus:border-[#D20515] focus:outline-none"
          >
            {(availableMatchdays.length > 0
              ? availableMatchdays
              : Array.from({ length: 34 }, (_, i) => i + 1)
            ).map((md) => (
              <option key={md} value={md}>
                Matchday {md}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onMatchdayChange(Math.min(maxMd, matchday + 1))}
            disabled={matchday >= maxMd}
            aria-label="Next matchday"
            className="rounded-md border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-zinc-800/60 max-h-[340px] overflow-y-auto">
        {matches.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-zinc-500">
            No fixtures found for Matchday {matchday}.
          </div>
        ) : (
          matches.map((m) => {
            const involvesSelected =
              m.home_team.id === selectedTeamId ||
              m.away_team.id === selectedTeamId;
            const finished = m.status === "finished";

            return (
              <div
                key={m.id}
                className={`px-4 py-2.5 transition-colors ${
                  involvesSelected
                    ? "bg-[#D20515]/12 border-l-2 border-l-[#D20515]"
                    : "hover:bg-zinc-800/30"
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{formatMatchDate(m.match_date)}</span>
                  <span
                    className={`uppercase font-semibold tracking-wider ${
                      finished ? "text-zinc-400" : "text-amber-400/90"
                    }`}
                  >
                    {finished ? "FT" : "Scheduled"}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                  {/* Home Team */}
                  <button
                    type="button"
                    onClick={() => onSelectTeam(m.home_team.id)}
                    className={`flex items-center justify-end gap-2 text-right hover:text-white ${
                      m.home_team.id === selectedTeamId
                        ? "font-bold text-white"
                        : "font-medium text-zinc-200"
                    }`}
                  >
                    <span className="truncate">{m.home_team.short_name}</span>
                    <TeamBadge team={m.home_team} size="sm" />
                  </button>

                  {/* Scoreline */}
                  <div className="min-w-[54px] rounded bg-zinc-950 px-2 py-1 text-center font-mono text-xs font-bold text-white border border-zinc-800">
                    {finished
                      ? `${m.home_goals} – ${m.away_goals}`
                      : "vs"}
                  </div>

                  {/* Away Team */}
                  <button
                    type="button"
                    onClick={() => onSelectTeam(m.away_team.id)}
                    className={`flex items-center justify-start gap-2 text-left hover:text-white ${
                      m.away_team.id === selectedTeamId
                        ? "font-bold text-white"
                        : "font-medium text-zinc-200"
                    }`}
                  >
                    <TeamBadge team={m.away_team} size="sm" />
                    <span className="truncate">{m.away_team.short_name}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
