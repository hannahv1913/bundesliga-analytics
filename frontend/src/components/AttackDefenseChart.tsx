import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { QuadrantClub } from "../types";
import { TeamBadge } from "./TeamBadge";

interface AttackDefenseChartProps {
  clubs: QuadrantClub[];
  avgGf: number;
  avgGa: number;
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number) => void;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: QuadrantClub;
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number) => void;
}

function CustomClubDot({
  cx,
  cy,
  payload,
  selectedTeamId,
  onSelectTeam,
}: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;

  const isSelected = payload.team.id === selectedTeamId;
  const logoSize = isSelected ? 28 : 22;
  const half = logoSize / 2;
  const rawColor = payload.team.primary_color;
  const fallbackFill =
    rawColor === "#000000" ? "#a1a1aa" : rawColor || "#D20515";

  return (
    <g
      onClick={() => onSelectTeam(payload.team.id)}
      className="cursor-pointer transition-transform"
    >
      {payload.team.logo_url ? (
        <image
          href={payload.team.logo_url}
          x={cx - half}
          y={cy - half}
          width={logoSize}
          height={logoSize}
          preserveAspectRatio="xMidYMid meet"
          style={{
            filter: isSelected
              ? "drop-shadow(0 0 6px rgba(210, 5, 21, 0.95))"
              : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.75))",
          }}
        />
      ) : (
        <circle cx={cx} cy={cy} r={isSelected ? 8 : 6} fill={fallbackFill} />
      )}

      {isSelected && (
        <g transform={`translate(${cx}, ${cy - 22})`}>
          <rect
            x={-18}
            y={-10}
            width={36}
            height={16}
            rx={4}
            fill="#18181b"
            stroke="#D20515"
            strokeWidth={1}
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={10}
            fontWeight={700}
            fontFamily="JetBrains Mono, monospace"
          >
            {payload.team.code}
          </text>
        </g>
      )}
    </g>
  );
}

interface TooltipPayloadItem {
  payload?: QuadrantClub;
}

function QuadrantTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || !payload.length || !payload[0].payload) {
    return null;
  }
  const club = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <TeamBadge team={club.team} size="sm" />
        <div>
          <p className="text-xs font-bold text-white">{club.team.short_name}</p>
          <p className="text-[10px] text-zinc-400">
            Rank #{club.rank} · {club.points} pts ({club.played} MP)
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-2 text-[11px]">
        <div>
          <span className="text-zinc-400">Scored / G</span>
          <p className="font-mono font-bold text-emerald-400">
            {club.gf_per_game.toFixed(2)}
          </p>
        </div>
        <div>
          <span className="text-zinc-400">Conceded / G</span>
          <p className="font-mono font-bold text-rose-400">
            {club.ga_per_game.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AttackDefenseChart({
  clubs,
  avgGf,
  avgGa,
  selectedTeamId,
  onSelectTeam,
}: AttackDefenseChartProps) {
  const activeClubs = clubs.filter((c) => c.played > 0);
  // Render selected club last so its crest sits on top of neighbors
  const orderedClubs = [...activeClubs].sort((a, b) =>
    a.team.id === selectedTeamId ? 1 : b.team.id === selectedTeamId ? -1 : 0
  );

  return (
    <section className="flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-900/70 backdrop-blur-md shadow-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Attack vs. Defense Quadrant
          </h2>
          <p className="text-xs text-zinc-400">
            Goals scored vs. conceded per game (top-right = elite)
          </p>
        </div>
        <div className="hidden text-right font-mono text-[11px] text-zinc-400 sm:block">
          <span>
            Avg: {avgGf.toFixed(2)} GF / {avgGa.toFixed(2)} GA
          </span>
        </div>
      </div>

      <div className="relative h-[360px] w-full p-3">
        {/* Corner quadrant annotations positioned cleanly inside the plot */}
        <span className="pointer-events-none absolute right-7 top-5 z-10 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
          Elite Attack & Defense
        </span>
        <span className="pointer-events-none absolute left-14 top-5 z-10 rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
          Compact / Low-Scoring
        </span>
        <span className="pointer-events-none absolute bottom-14 left-14 z-10 rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400 border border-rose-500/20">
          Struggling
        </span>
        <span className="pointer-events-none absolute bottom-14 right-7 z-10 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20">
          Open / High-Scoring
        </span>

        {orderedClubs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            No finished matches available for this filter.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 28, right: 24, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="gf_per_game"
                name="Goals For / Game"
                domain={["auto", "auto"]}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
                label={{
                  value: "Goals Scored / Game →",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#71717a",
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="ga_per_game"
                name="Goals Against / Game"
                reversed={true}
                domain={["auto", "auto"]}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
                width={42}
              />
              <ZAxis range={[60, 60]} />
              <ReferenceLine
                x={avgGf}
                stroke="#71717a"
                strokeDasharray="4 4"
                strokeWidth={1.25}
              />
              <ReferenceLine
                y={avgGa}
                stroke="#71717a"
                strokeDasharray="4 4"
                strokeWidth={1.25}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "#52525b" }}
                content={<QuadrantTooltip />}
              />
              <Scatter
                data={orderedClubs}
                shape={(props: unknown) => {
                  const p = props as CustomDotProps;
                  return (
                    <CustomClubDot
                      cx={p.cx}
                      cy={p.cy}
                      payload={p.payload}
                      selectedTeamId={selectedTeamId}
                      onSelectTeam={onSelectTeam}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
