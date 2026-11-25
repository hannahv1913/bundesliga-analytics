import { useState } from "react";
import { BarChart3 } from "lucide-react";
import type { Team } from "../types";

interface PlayerSpotlightProps {
  team: Team;
  onOpenPlayerStats: () => void;
}

const CLUB_SPONSORS: Record<string, string> = {
  MUN: "TELEKOM",
  DOR: "1&1",
  VFB: "LBBW",
  B04: "BARMENIA",
  RBL: "RED BULL",
  SGE: "INDEED",
  SCF: "JOBRAD",
  SVW: "MATTHÄI",
  M05: "KÖMMERLING",
  FCA: "WWK",
  BMG: "REUTER",
  FCU: "PARAMOUNT+",
  TSG: "SAP",
  KOE: "REWE",
  S04: "SUN MINIMEAL",
  HSV: "HANSEMERKUR",
  SCP: "FOUR 20",
  ELV: "HYLO",
};

export function PlayerSpotlight({ team, onOpenPlayerStats }: PlayerSpotlightProps) {
  const [imgError, setImgError] = useState(false);

  const playerName = team.key_player?.name ?? `${team.short_name} Key Player`;
  const playerNumber = team.key_player?.number ?? 10;
  const playerPos = team.key_player?.position ?? "FWD";
  const sponsorName = CLUB_SPONSORS[team.code] ?? team.code;

  const accentColor =
    team.primary_color === "#000000" || team.primary_color === "#FFFFFF"
      ? "#D20515"
      : team.primary_color;

  const isUndav =
    team.code === "VFB" || playerName.toLowerCase().includes("undav");
  const photoSrc = isUndav
    ? "./images/deniz-undav-cutout.png"
    : `./images/players/${team.code}.png`;

  return (
    <button
      key={team.id}
      type="button"
      onClick={onOpenPlayerStats}
      title={`View ${playerName} statistics`}
      className="group relative flex min-h-[235px] w-full flex-col justify-between overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950 p-4 text-left shadow-inner transition hover:border-[#D20515]/70 hover:shadow-lg hover:shadow-[#D20515]/10 focus:outline-none focus:ring-2 focus:ring-[#D20515]/50 animate-[fadeIn_280ms_ease-out]"
    >
      {/* Large Club Logo Watermark in Background */}
      {team.logo_url && (
        <img
          src={team.logo_url}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1/2 h-52 w-52 -translate-y-1/2 object-contain opacity-20 select-none"
        />
      )}

      {/* Club Color Radial Glow */}
      <div
        className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top Metadata */}
      <div className="relative z-20 max-w-[56%]">
        <span
          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{
            borderColor: `${accentColor}66`,
            backgroundColor: `${accentColor}22`,
            color: "#ffffff",
          }}
        >
          {playerPos} · #{playerNumber}
        </span>
        <h4 className="mt-2 text-lg font-extrabold leading-tight tracking-tight text-white drop-shadow">
          {playerName}
        </h4>
        <p className="mt-0.5 text-xs text-zinc-400">
          {team.short_name} Key Player
        </p>

        {/* Club Crest & Sponsor Tag */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-zinc-800/90 bg-zinc-900/90 px-2 py-1 backdrop-blur-sm">
          {team.logo_url && (
            <img
              src={team.logo_url}
              alt={team.short_name}
              className="h-4 w-4 object-contain"
            />
          )}
          <span className="font-mono text-[10px] font-semibold tracking-wider text-zinc-300">
            {sponsorName}
          </span>
        </div>
      </div>

      {/* Bottom Club Tag + Interactive Player Stats Hint */}
      <div className="relative z-20 mt-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D20515]/40 bg-[#D20515]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-100 transition group-hover:bg-[#D20515] group-hover:text-white">
          <BarChart3 className="h-3 w-3" />
          Player Stats
        </span>
      </div>

      {/* Foreground Real Player Transparent Cutout */}
      {!imgError && (
        <div className="pointer-events-none absolute bottom-0 right-1 z-10 flex h-[215px] w-[170px] items-end justify-end overflow-hidden">
          <img
            src={photoSrc}
            alt={playerName}
            onError={() => setImgError(true)}
            className="h-full w-full select-none object-contain object-bottom drop-shadow-[0_10px_22px_rgba(0,0,0,0.9)]"
          />
        </div>
      )}
    </button>
  );
}
