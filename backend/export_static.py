from __future__ import annotations

import json
from pathlib import Path

from main import (
    get_matches,
    get_quadrant,
    get_standings,
    get_team_details,
    get_team_squad,
    get_team_summary,
)

OUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "data"


def export_all() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    base_standings = get_standings(venue="all", up_to_matchday=34)
    max_md = max(1, int(base_standings["max_played_matchday"]))
    team_ids = [row["team"]["id"] for row in base_standings["standings"]]

    standings_map: dict[str, dict[str, object]] = {}
    quadrant_map: dict[str, dict[str, object]] = {}

    for venue in ("all", "home", "away"):
        standings_map[venue] = {}
        quadrant_map[venue] = {}
        for md in range(1, max_md + 1):
            standings_map[venue][str(md)] = get_standings(
                venue=venue, up_to_matchday=md
            )
            quadrant_map[venue][str(md)] = get_quadrant(
                venue=venue, up_to_matchday=md
            )

    matches_all = get_matches(matchday=None, team_id=None)

    summaries: dict[str, object] = {}
    details: dict[str, object] = {}
    squads: dict[str, object] = {}

    for tid in team_ids:
        print(f"Exporting team {tid}...")
        summaries[str(tid)] = get_team_summary(tid)
        details[str(tid)] = get_team_details(tid)
        squads[str(tid)] = get_team_squad(tid)

    (OUT_DIR / "standings.json").write_text(
        json.dumps(standings_map, ensure_ascii=False), encoding="utf-8"
    )
    (OUT_DIR / "quadrant.json").write_text(
        json.dumps(quadrant_map, ensure_ascii=False), encoding="utf-8"
    )
    (OUT_DIR / "matches.json").write_text(
        json.dumps(matches_all, ensure_ascii=False), encoding="utf-8"
    )
    (OUT_DIR / "summaries.json").write_text(
        json.dumps(summaries, ensure_ascii=False), encoding="utf-8"
    )
    (OUT_DIR / "details.json").write_text(
        json.dumps(details, ensure_ascii=False), encoding="utf-8"
    )
    (OUT_DIR / "squads.json").write_text(
        json.dumps(squads, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Exported static dataset for {len(team_ids)} teams (MD 1-{max_md}) to {OUT_DIR}")


if __name__ == "__main__":
    export_all()
