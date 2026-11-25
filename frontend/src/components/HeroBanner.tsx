import { Flame, Sparkles, Target, Trophy } from "lucide-react";
import type { StandingRow } from "../types";

interface HeroBannerProps {
  standings: StandingRow[];
  maxPlayedMatchday: number;
  avgGfPerGame: number;
  onSelectStuttgart: () => void;
}

export function HeroBanner({
  standings,
  maxPlayedMatchday,
  avgGfPerGame,
  onSelectStuttgart,
}: HeroBannerProps) {
  const leader = standings[0];
  const topAttack = [...standings].sort((a, b) => b.gf - a.gf)[0];
  const totalGoals = standings.reduce((acc, r) => acc + r.gf, 0);

  return (
    <section className="group relative min-h-[260px] md:min-h-[300px] overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#070709] shadow-2xl">
      {/* Full-bleed Dynamic Deniz Undav Stadium Hero Artwork */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="./images/deniz-undav-hero-dynamic.jpg"
          alt="Deniz Undav — VfB Stuttgart #26 Bundesliga Hero"
          className="h-full w-full object-cover object-[78%_12%] sm:object-[72%_12%] md:object-[right_10%] transition-transform duration-700 ease-out group-hover:scale-[1.03] select-none"
        />
        {/* Smooth left-to-right readability gradient (keeps Deniz bright & crisp on right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/85 via-45% to-transparent" />
        {/* Subtle bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709]/80 via-transparent to-transparent" />
      </div>

      {/* Oversized VfB Stuttgart Jersey-Style "26" Fading into the Background Right of Deniz's Head */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 -top-4 z-10 hidden select-none text-[210px] xl:text-[250px] font-bold leading-[0.8] tracking-tight text-white/[0.09] lg:block"
        style={{
          fontFamily: "'Teko', sans-serif",
          WebkitTextStroke: "1.5px rgba(210, 5, 21, 0.28)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.35) 62%, transparent 98%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.35) 62%, transparent 98%)",
        }}
      >
        26
      </span>

      {/* Subtle Floating Player Tag on Bottom-Right */}
      <div className="pointer-events-none absolute bottom-3 right-4 z-20 hidden items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/75 px-2.5 py-1 backdrop-blur-md md:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D20515] animate-pulse" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-200">
          #26 Deniz Undav · VfB Stuttgart
        </span>
      </div>

      {/* Foreground Content */}
      <div className="relative z-20 flex h-full flex-col justify-between gap-6 p-6 sm:p-8 lg:max-w-[60%]">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D20515]/50 bg-[#D20515]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#ff5c69] backdrop-blur-sm">
            <Flame className="h-3.5 w-3.5" />
            Bundesliga 2026/27 · Matchday 1–{maxPlayedMatchday} Live
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl drop-shadow">
            Every Goal. Every Matchday.{" "}
            <span className="text-[#D20515]">Tactical Pulse.</span>
          </h2>

          <p className="max-w-xl text-xs leading-relaxed text-zinc-300 sm:text-sm">
            Featuring{" "}
            <span className="font-semibold text-white">Deniz Undav (#26)</span>{" "}
            and all 18 Bundesliga clubs. Scrub through any matchday, compare
            attacking vs. defensive efficiency, and inspect club trajectories.
          </p>
        </div>

        {/* Live Season KPIs + CTA */}
        <div className="flex flex-wrap items-center gap-3">
          {leader && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800/90 bg-zinc-950/80 px-3.5 py-2 backdrop-blur-md">
              <Trophy className="h-4 w-4 text-amber-400" />
              <div className="text-xs">
                <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
                  Leader
                </span>
                <span className="font-bold text-white">
                  {leader.team.short_name} ({leader.points} pts)
                </span>
              </div>
            </div>
          )}

          {topAttack && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800/90 bg-zinc-950/80 px-3.5 py-2 backdrop-blur-md">
              <Target className="h-4 w-4 text-emerald-400" />
              <div className="text-xs">
                <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
                  Top Attack
                </span>
                <span className="font-bold text-white">
                  {topAttack.team.short_name} ({topAttack.gf} GF)
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-zinc-800/90 bg-zinc-950/80 px-3.5 py-2 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-[#D20515]" />
            <div className="text-xs">
              <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
                Season Goals
              </span>
              <span className="font-mono font-bold text-white">
                {totalGoals} ({avgGfPerGame.toFixed(2)}/G)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSelectStuttgart}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D20515] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#D20515]/30 transition hover:bg-[#b80412]"
          >
            Spotlight: Deniz Undav
          </button>
        </div>
      </div>
    </section>
  );
}
