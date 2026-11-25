import { useState } from "react";
import type { Team } from "../types";

interface TeamBadgeProps {
  team: Pick<Team, "short_name" | "code" | "logo_url" | "primary_color">;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "w-5 h-5 text-[9px]",
  md: "w-6 h-6 text-[10px]",
  lg: "w-10 h-10 text-xs",
};

export function TeamBadge({ team, size = "md" }: TeamBadgeProps) {
  const [imgError, setImgError] = useState(false);

  if (team.logo_url && !imgError) {
    return (
      <img
        src={team.logo_url}
        alt={team.short_name}
        onError={() => setImgError(true)}
        className={`${SIZE_CLASSES[size]} object-contain shrink-0 select-none`}
        loading="lazy"
      />
    );
  }

  const bgColor =
    team.primary_color === "#000000" ? "#3f3f46" : team.primary_color;

  return (
    <span
      className={`${SIZE_CLASSES[size]} inline-flex items-center justify-center rounded-full font-mono font-bold text-white border border-white/20 shrink-0 select-none`}
      style={{ backgroundColor: bgColor }}
      title={team.short_name}
    >
      {team.code.slice(0, 3)}
    </span>
  );
}
