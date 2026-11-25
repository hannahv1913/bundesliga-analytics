import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Users } from "lucide-react";
import type { FormResult, StandingRow } from "../types";
import { TeamBadge } from "./TeamBadge";

interface LeagueTableProps {
  standings: StandingRow[];
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number) => void;
  onOpenTeamModal: (teamId: number) => void;
  onOpenSquadModal: (teamId: number) => void;
  loading?: boolean;
}

type SortKey =
  | "rank"
  | "played"
  | "won"
  | "drawn"
  | "lost"
  | "gf"
  | "ga"
  | "gd"
  | "points"
  | "ppg";

const FORM_STYLES: Record<FormResult, string> = {
  W: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  D: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  L: "bg-rose-500/20 text-rose-400 border-rose-500/40",
};

function getZoneBorder(rank: number): string {
  if (rank <= 4) return "border-l-emerald-500";
  if (rank === 5) return "border-l-sky-500";
  if (rank === 6) return "border-l-cyan-400";
  if (rank === 16) return "border-l-amber-500";
  if (rank >= 17) return "border-l-rose-600";
  return "border-l-transparent";
}

export function LeagueTable({
  standings,
  selectedTeamId,
  onSelectTeam,
  onOpenTeamModal,
  onOpenSquadModal,
  loading,
}: LeagueTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" || key === "ga" || key === "lost" ? "asc" : "desc");
    }
  };

  const sortedStandings = useMemo(() => {
    const copy = [...standings];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return a.rank - b.rank;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [standings, sortKey, sortDir]);

  const columns: { key: SortKey; label: string; title: string; align?: string }[] = [
    { key: "rank", label: "#", title: "Position", align: "text-center" },
    { key: "played", label: "MP", title: "Matches Played", align: "text-center" },
    { key: "won", label: "W", title: "Wins", align: "text-center" },
    { key: "drawn", label: "D", title: "Draws", align: "text-center" },
    { key: "lost", label: "L", title: "Losses", align: "text-center" },
    { key: "gf", label: "GF", title: "Goals For", align: "text-center hidden sm:table-cell" },
    { key: "ga", label: "GA", title: "Goals Against", align: "text-center hidden sm:table-cell" },
    { key: "gd", label: "GD", title: "Goal Difference", align: "text-center" },
    { key: "points", label: "PTS", title: "Points", align: "text-center" },
    { key: "ppg", label: "PPG", title: "Points Per Game", align: "text-center hidden md:table-cell" },
  ];

  return (
    <section className="flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-900/70 backdrop-blur-md shadow-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            League Standings
          </h2>
          <p className="text-xs text-zinc-400">
            Click any club to inspect its trajectory & splits
          </p>
        </div>

        {/* Zone Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-1 rounded-full bg-emerald-500" />
            UCL
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-1 rounded-full bg-sky-500" />
            UEL
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-1 rounded-full bg-cyan-400" />
            UECL
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-1 rounded-full bg-amber-500" />
            Playoff
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-1 rounded-full bg-rose-600" />
            Relegation
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {columns.slice(0, 1).map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  title={col.title}
                  className={`cursor-pointer select-none px-3 py-2.5 hover:text-white ${col.align}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-[#D20515]" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-[#D20515]" />
                      )
                    ) : (
                      <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5">Club</th>
              {columns.slice(1).map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  title={col.title}
                  className={`cursor-pointer select-none px-2.5 py-2.5 hover:text-white ${col.align}`}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    {col.label}
                    {sortKey === col.key &&
                      (sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-[#D20515]" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-[#D20515]" />
                      ))}
                  </span>
                </th>
              ))}
              <th className="hidden px-3 py-2.5 text-right lg:table-cell">
                Last 5
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/50">
            {loading && standings.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-zinc-500">
                  Loading Bundesliga standings…
                </td>
              </tr>
            ) : (
              sortedStandings.map((row) => {
                const selected = row.team.id === selectedTeamId;
                return (
                  <tr
                    key={row.team.id}
                    onClick={() => onSelectTeam(row.team.id)}
                    className={`cursor-pointer border-l-4 transition-colors ${getZoneBorder(
                      row.rank
                    )} ${
                      selected
                        ? "bg-[#D20515]/15 hover:bg-[#D20515]/20"
                        : "hover:bg-zinc-800/50"
                    }`}
                  >
                    <td className="px-3 py-2 text-center font-mono font-semibold text-zinc-300">
                      {row.rank}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-between gap-2 min-w-[155px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TeamBadge team={row.team} size="md" />
                          <span
                            className={`font-semibold truncate ${
                              selected ? "text-white" : "text-zinc-200"
                            }`}
                          >
                            {row.team.short_name}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTeam(row.team.id);
                              onOpenTeamModal(row.team.id);
                            }}
                            title={`Open ${row.team.short_name} club info & stats`}
                            className="inline-flex shrink-0 items-center gap-1 rounded border border-zinc-700/70 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 transition hover:border-[#D20515]/70 hover:text-white"
                          >
                            Info
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTeam(row.team.id);
                              onOpenSquadModal(row.team.id);
                            }}
                            title={`Open ${row.team.short_name} full squad player stats`}
                            className="inline-flex shrink-0 items-center gap-1 rounded border border-zinc-700/70 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 transition hover:border-[#D20515]/70 hover:text-white"
                          >
                            <Users className="h-2.5 w-2.5" />
                            Player Stats
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2 text-center font-mono text-zinc-300">
                      {row.played}
                    </td>
                    <td className="px-2.5 py-2 text-center font-mono text-zinc-300">
                      {row.won}
                    </td>
                    <td className="px-2.5 py-2 text-center font-mono text-zinc-400">
                      {row.drawn}
                    </td>
                    <td className="px-2.5 py-2 text-center font-mono text-zinc-400">
                      {row.lost}
                    </td>
                    <td className="hidden px-2.5 py-2 text-center font-mono text-zinc-300 sm:table-cell">
                      {row.gf}
                    </td>
                    <td className="hidden px-2.5 py-2 text-center font-mono text-zinc-300 sm:table-cell">
                      {row.ga}
                    </td>
                    <td
                      className={`px-2.5 py-2 text-center font-mono font-semibold ${
                        row.gd > 0
                          ? "text-emerald-400"
                          : row.gd < 0
                          ? "text-rose-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    <td className="px-2.5 py-2 text-center font-mono text-sm font-bold text-white">
                      {row.points}
                    </td>
                    <td className="hidden px-2.5 py-2 text-center font-mono text-zinc-300 md:table-cell">
                      {row.ppg.toFixed(2)}
                    </td>
                    <td className="hidden px-3 py-2 text-right lg:table-cell">
                      <div className="inline-flex items-center justify-end gap-1">
                        {row.form.length === 0 ? (
                          <span className="text-zinc-600">—</span>
                        ) : (
                          row.form.map((res, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px] font-bold ${FORM_STYLES[res]}`}
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
