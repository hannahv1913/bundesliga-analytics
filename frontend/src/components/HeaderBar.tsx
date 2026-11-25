import { RefreshCw } from "lucide-react";
import type { VenueFilter } from "../types";

interface HeaderBarProps {
  venue: VenueFilter;
  onVenueChange: (venue: VenueFilter) => void;
  upToMatchday: number;
  maxPlayedMatchday: number;
  onMatchdayChange: (md: number) => void;
  onSync: () => void;
  syncing: boolean;
  lastUpdated: string | null;
}

const VENUE_OPTIONS: { value: VenueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "home", label: "Home" },
  { value: "away", label: "Away" },
];

export function HeaderBar({
  venue,
  onVenueChange,
  upToMatchday,
  maxPlayedMatchday,
  onMatchdayChange,
  onSync,
  syncing,
  lastUpdated,
}: HeaderBarProps) {
  const sliderMax = Math.max(1, maxPlayedMatchday);
  const clampedMatchday = Math.min(upToMatchday, sliderMax);

  const formattedUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Official Bundesliga Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D20515] p-1 shadow-lg shadow-[#D20515]/30 ring-1 ring-white/15">
            <img
              src="./images/bundesliga-logo.png"
              alt="Bundesliga Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                Bundesliga Analytics — 2026/27
              </h1>
              <span className="hidden rounded bg-[#D20515]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#ff4d5a] border border-[#D20515]/30 sm:inline-block">
                LIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              18 Clubs · Matchdays 1–{sliderMax} · Updated {formattedUpdated}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {/* Venue Segmented Control */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/90 p-0.5">
            {VENUE_OPTIONS.map((opt) => {
              const active = venue === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onVenueChange(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#D20515] text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Matchday Range Slider (maxes out at current played matchday) */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/75 px-3 py-1.5">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Up to Matchday
              </span>
              <span className="font-mono text-xs font-bold text-white">
                MD 1–{clampedMatchday}
                {clampedMatchday === sliderMax && (
                  <span className="ml-1.5 text-[10px] font-normal text-emerald-400">
                    (Current)
                  </span>
                )}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={sliderMax}
              value={clampedMatchday}
              onChange={(e) => onMatchdayChange(Number(e.target.value))}
              aria-label="Matchday range"
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-[#D20515] sm:w-32"
            />
          </div>

          {/* Sync Data Button */}
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-100 transition hover:border-[#D20515]/70 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#D20515] ${
                syncing ? "animate-spin" : ""
              }`}
            />
            {syncing ? "Syncing…" : "Sync Data"}
          </button>
        </div>
      </div>
    </header>
  );
}
