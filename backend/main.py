from __future__ import annotations

from collections import defaultdict
import hashlib
import re
from typing import Any, Literal

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from club_profiles import CLUB_PROFILES
from cutouts import get_or_create_player_cutout
from database import get_connection, init_db
from sync_data import sync_bundesliga_data

app = FastAPI(title="Bundesliga 2026-27 Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def _team_row_to_dict(row: Any) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "short_name": row["short_name"],
        "code": row["code"],
        "logo_url": row["logo_url"],
        "primary_color": row["primary_color"],
        "key_player": {
            "name": row["key_player_name"],
            "number": row["key_player_number"],
            "position": row["key_player_position"],
        }
        if row["key_player_name"]
        else None,
    }


def _get_last_updated(conn: Any) -> str | None:
    row = conn.execute(
        "SELECT value FROM sync_metadata WHERE key = 'last_updated'"
    ).fetchone()
    return row["value"] if row else None


def _compute_standings(
    conn: Any,
    venue: Literal["all", "home", "away"] = "all",
    up_to_matchday: int = 34,
) -> list[dict[str, Any]]:
    teams = conn.execute("SELECT * FROM teams ORDER BY name ASC").fetchall()
    matches = conn.execute(
        """
        SELECT matchday, match_date, home_team_id, away_team_id, home_goals, away_goals
        FROM matches
        WHERE status = 'finished' AND matchday <= ?
        ORDER BY matchday ASC, match_date ASC, id ASC
        """,
        (up_to_matchday,),
    ).fetchall()

    stats: dict[int, dict[str, Any]] = {
        t["id"]: {
            "team": _team_row_to_dict(t),
            "played": 0,
            "won": 0,
            "drawn": 0,
            "lost": 0,
            "gf": 0,
            "ga": 0,
            "points": 0,
            "form": [],
        }
        for t in teams
    }

    def record(team_id: int, gf: int, ga: int) -> None:
        s = stats[team_id]
        s["played"] += 1
        s["gf"] += gf
        s["ga"] += ga
        if gf > ga:
            s["won"] += 1
            s["points"] += 3
            s["form"].append("W")
        elif gf == ga:
            s["drawn"] += 1
            s["points"] += 1
            s["form"].append("D")
        else:
            s["lost"] += 1
            s["form"].append("L")

    for m in matches:
        hg = int(m["home_goals"])
        ag = int(m["away_goals"])
        if venue in ("all", "home"):
            record(m["home_team_id"], hg, ag)
        if venue in ("all", "away"):
            record(m["away_team_id"], ag, hg)

    table = []
    for s in stats.values():
        played = s["played"]
        gd = s["gf"] - s["ga"]
        ppg = round(s["points"] / played, 2) if played > 0 else 0.0
        table.append(
            {
                "team": s["team"],
                "played": played,
                "won": s["won"],
                "drawn": s["drawn"],
                "lost": s["lost"],
                "gf": s["gf"],
                "ga": s["ga"],
                "gd": gd,
                "points": s["points"],
                "ppg": ppg,
                "form": s["form"][-5:],
            }
        )

    table.sort(
        key=lambda r: (-r["points"], -r["gd"], -r["gf"], r["team"]["name"])
    )
    for idx, row in enumerate(table, start=1):
        row["rank"] = idx

    return table


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/sync")
def trigger_sync() -> dict[str, Any]:
    try:
        return sync_bundesliga_data()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sync failed: {exc}") from exc


@app.get("/api/standings")
def get_standings(
    venue: Literal["all", "home", "away"] = Query("all"),
    up_to_matchday: int = Query(34, ge=1, le=34),
) -> dict[str, Any]:
    conn = get_connection()
    try:
        standings = _compute_standings(conn, venue=venue, up_to_matchday=up_to_matchday)
        max_row = conn.execute(
            "SELECT COALESCE(MAX(matchday), 1) AS max_md FROM matches WHERE status = 'finished'"
        ).fetchone()
        return {
            "venue": venue,
            "up_to_matchday": up_to_matchday,
            "max_played_matchday": int(max_row["max_md"]) if max_row else 1,
            "last_updated": _get_last_updated(conn),
            "standings": standings,
        }
    finally:
        conn.close()


@app.get("/api/analytics/quadrant")
def get_quadrant(
    venue: Literal["all", "home", "away"] = Query("all"),
    up_to_matchday: int = Query(34, ge=1, le=34),
) -> dict[str, Any]:
    conn = get_connection()
    try:
        standings = _compute_standings(conn, venue=venue, up_to_matchday=up_to_matchday)
        clubs = []
        total_gf = 0
        total_ga = 0
        total_played = 0

        for row in standings:
            played = row["played"]
            gf_pg = round(row["gf"] / played, 2) if played > 0 else 0.0
            ga_pg = round(row["ga"] / played, 2) if played > 0 else 0.0
            total_gf += row["gf"]
            total_ga += row["ga"]
            total_played += played
            clubs.append(
                {
                    "team": row["team"],
                    "rank": row["rank"],
                    "played": played,
                    "points": row["points"],
                    "gf": row["gf"],
                    "ga": row["ga"],
                    "gf_per_game": gf_pg,
                    "ga_per_game": ga_pg,
                }
            )

        avg_gf = round(total_gf / total_played, 2) if total_played > 0 else 0.0
        avg_ga = round(total_ga / total_played, 2) if total_played > 0 else 0.0

        return {
            "venue": venue,
            "up_to_matchday": up_to_matchday,
            "avg_gf_per_game": avg_gf,
            "avg_ga_per_game": avg_ga,
            "clubs": clubs,
        }
    finally:
        conn.close()


@app.get("/api/matches")
def get_matches(
    matchday: int | None = Query(None, ge=1, le=34),
    team_id: int | None = Query(None, ge=1),
) -> dict[str, Any]:
    conn = get_connection()
    try:
        md_rows = conn.execute(
            "SELECT DISTINCT matchday FROM matches ORDER BY matchday ASC"
        ).fetchall()
        available_matchdays = [int(r["matchday"]) for r in md_rows]

        latest_finished = conn.execute(
            "SELECT MAX(matchday) AS md FROM matches WHERE status = 'finished'"
        ).fetchone()
        if latest_finished and latest_finished["md"] is not None:
            current_matchday = int(latest_finished["md"])
        elif available_matchdays:
            current_matchday = available_matchdays[0]
        else:
            current_matchday = 1

        clauses = []
        params: list[Any] = []
        if matchday is not None:
            clauses.append("m.matchday = ?")
            params.append(matchday)
        if team_id is not None:
            clauses.append("(m.home_team_id = ? OR m.away_team_id = ?)")
            params.extend([team_id, team_id])

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        rows = conn.execute(
            f"""
            SELECT
                m.id, m.season, m.matchday, m.match_date,
                m.home_goals, m.away_goals, m.status,
                ht.id AS ht_id, ht.name AS ht_name, ht.short_name AS ht_short,
                ht.code AS ht_code, ht.logo_url AS ht_logo, ht.primary_color AS ht_color,
                at.id AS at_id, at.name AS at_name, at.short_name AS at_short,
                at.code AS at_code, at.logo_url AS at_logo, at.primary_color AS at_color
            FROM matches m
            JOIN teams ht ON ht.id = m.home_team_id
            JOIN teams at ON at.id = m.away_team_id
            {where_sql}
            ORDER BY m.match_date ASC, m.id ASC
            """,
            params,
        ).fetchall()

        matches = [
            {
                "id": r["id"],
                "season": r["season"],
                "matchday": r["matchday"],
                "match_date": r["match_date"],
                "home_goals": r["home_goals"],
                "away_goals": r["away_goals"],
                "status": r["status"],
                "home_team": {
                    "id": r["ht_id"],
                    "name": r["ht_name"],
                    "short_name": r["ht_short"],
                    "code": r["ht_code"],
                    "logo_url": r["ht_logo"],
                    "primary_color": r["ht_color"],
                },
                "away_team": {
                    "id": r["at_id"],
                    "name": r["at_name"],
                    "short_name": r["at_short"],
                    "code": r["at_code"],
                    "logo_url": r["at_logo"],
                    "primary_color": r["at_color"],
                },
            }
            for r in rows
        ]

        return {
            "available_matchdays": available_matchdays,
            "current_matchday": current_matchday,
            "matches": matches,
        }
    finally:
        conn.close()


@app.get("/api/teams/{team_id}/summary")
def get_team_summary(team_id: int) -> dict[str, Any]:
    conn = get_connection()
    try:
        team_row = conn.execute(
            "SELECT * FROM teams WHERE id = ?", (team_id,)
        ).fetchone()
        if not team_row:
            raise HTTPException(status_code=404, detail="Team not found")

        team = _team_row_to_dict(team_row)

        # League average cumulative points per matchday
        all_finished = conn.execute(
            """
            SELECT matchday, home_team_id, away_team_id, home_goals, away_goals
            FROM matches
            WHERE status = 'finished'
            ORDER BY matchday ASC, match_date ASC, id ASC
            """
        ).fetchall()

        team_count_row = conn.execute("SELECT COUNT(*) AS cnt FROM teams").fetchone()
        num_teams = max(int(team_count_row["cnt"]), 1)

        md_total_points: dict[int, int] = defaultdict(int)
        team_md_points: dict[int, int] = {}
        max_md = 0

        for m in all_finished:
            md = int(m["matchday"])
            max_md = max(max_md, md)
            hg = int(m["home_goals"])
            ag = int(m["away_goals"])
            if hg > ag:
                hp, ap = 3, 0
            elif hg == ag:
                hp, ap = 1, 1
            else:
                hp, ap = 0, 3

            md_total_points[md] += hp + ap
            if m["home_team_id"] == team_id:
                team_md_points[md] = team_md_points.get(md, 0) + hp
            elif m["away_team_id"] == team_id:
                team_md_points[md] = team_md_points.get(md, 0) + ap

        trajectory = []
        cum_team = 0
        cum_league_total = 0
        for md in range(1, max_md + 1):
            pts = team_md_points.get(md, 0)
            cum_team += pts
            cum_league_total += md_total_points.get(md, 0)
            trajectory.append(
                {
                    "matchday": md,
                    "points": pts,
                    "cumulative_points": cum_team,
                    "league_avg_cumulative_points": round(
                        cum_league_total / num_teams, 1
                    ),
                }
            )

        # Splits
        splits: dict[str, Any] = {}
        for v in ("all", "home", "away"):
            table = _compute_standings(conn, venue=v, up_to_matchday=34)
            entry = next((r for r in table if r["team"]["id"] == team_id), None)
            splits[v] = entry

        # Team matches for biggest win + recent/upcoming
        team_matches = conn.execute(
            """
            SELECT
                m.id, m.matchday, m.match_date, m.home_team_id, m.away_team_id,
                m.home_goals, m.away_goals, m.status,
                ht.short_name AS ht_short, ht.code AS ht_code, ht.logo_url AS ht_logo,
                at.short_name AS at_short, at.code AS at_code, at.logo_url AS at_logo
            FROM matches m
            JOIN teams ht ON ht.id = m.home_team_id
            JOIN teams at ON at.id = m.away_team_id
            WHERE m.home_team_id = ? OR m.away_team_id = ?
            ORDER BY m.matchday ASC, m.match_date ASC
            """,
            (team_id, team_id),
        ).fetchall()

        finished_list = []
        upcoming_list = []
        biggest_win: dict[str, Any] | None = None
        best_margin = 0
        best_gf = -1

        for r in team_matches:
            is_home = r["home_team_id"] == team_id
            opponent_name = r["at_short"] if is_home else r["ht_short"]
            opponent_code = r["at_code"] if is_home else r["ht_code"]
            opponent_logo = r["at_logo"] if is_home else r["ht_logo"]

            item = {
                "id": r["id"],
                "matchday": r["matchday"],
                "match_date": r["match_date"],
                "is_home": is_home,
                "opponent": opponent_name,
                "opponent_code": opponent_code,
                "opponent_logo": opponent_logo,
                "home_goals": r["home_goals"],
                "away_goals": r["away_goals"],
                "status": r["status"],
            }

            if r["status"] == "finished":
                gf = int(r["home_goals"]) if is_home else int(r["away_goals"])
                ga = int(r["away_goals"]) if is_home else int(r["home_goals"])
                item["result"] = "W" if gf > ga else ("D" if gf == ga else "L")
                finished_list.append(item)

                margin = gf - ga
                if margin > 0 and (
                    margin > best_margin or (margin == best_margin and gf > best_gf)
                ):
                    best_margin = margin
                    best_gf = gf
                    biggest_win = {
                        "matchday": r["matchday"],
                        "match_date": r["match_date"],
                        "opponent": opponent_name,
                        "is_home": is_home,
                        "score_display": f"{gf}–{ga}",
                        "margin": margin,
                    }
            else:
                upcoming_list.append(item)

        return {
            "team": team,
            "trajectory": trajectory,
            "splits": splits,
            "biggest_win": biggest_win,
            "recent_fixtures": finished_list[-5:][::-1],
            "upcoming_fixtures": upcoming_list[:5],
        }
    finally:
        conn.close()


@app.get("/api/teams/{team_id}/details")
def get_team_details(team_id: int) -> dict[str, Any]:
    conn = get_connection()
    try:
        team_row = conn.execute(
            "SELECT * FROM teams WHERE id = ?", (team_id,)
        ).fetchone()
        if not team_row:
            raise HTTPException(status_code=404, detail="Team not found")

        team = _team_row_to_dict(team_row)
        profile = CLUB_PROFILES.get(
            team["name"],
            {
                "stadium": "Bundesliga Arena",
                "city": team["short_name"],
                "founded": 1900,
                "coach": "Head Coach",
                "sponsor": team["code"],
                "player": {
                    "nationality": "Germany",
                    "age": 26,
                    "height": "1.82 m",
                    "foot": "Right",
                    "role": "Key Starter",
                    "bio": "Core first-team contributor for the 2026/27 Bundesliga campaign.",
                },
            },
        )

        # Current overall + home/away standings entry
        splits: dict[str, Any] = {}
        for v in ("all", "home", "away"):
            table = _compute_standings(conn, venue=v, up_to_matchday=34)
            splits[v] = next((r for r in table if r["team"]["id"] == team_id), None)

        # Fetch all team matches chronologically
        rows = conn.execute(
            """
            SELECT
                m.id, m.matchday, m.match_date, m.home_team_id, m.away_team_id,
                m.home_goals, m.away_goals, m.status,
                ht.short_name AS ht_short, ht.code AS ht_code, ht.logo_url AS ht_logo,
                at.short_name AS at_short, at.code AS at_code, at.logo_url AS at_logo
            FROM matches m
            JOIN teams ht ON ht.id = m.home_team_id
            JOIN teams at ON at.id = m.away_team_id
            WHERE m.home_team_id = ? OR m.away_team_id = ?
            ORDER BY m.matchday ASC, m.match_date ASC
            """,
            (team_id, team_id),
        ).fetchall()

        finished_matches = []
        upcoming_matches = []

        clean_sheets = 0
        failed_to_score = 0
        btts_count = 0
        over_2_5_count = 0
        scored_2_plus = 0
        conceded_2_plus = 0

        unbeaten_run = 0
        current_unbeaten = 0
        results_seq: list[str] = []

        biggest_win: dict[str, Any] | None = None
        best_win_margin = 0
        best_win_gf = -1

        heaviest_loss: dict[str, Any] | None = None
        worst_loss_margin = 0
        worst_loss_ga = -1

        for r in rows:
            is_home = r["home_team_id"] == team_id
            opponent_name = r["at_short"] if is_home else r["ht_short"]
            opponent_code = r["at_code"] if is_home else r["ht_code"]
            opponent_logo = r["at_logo"] if is_home else r["ht_logo"]

            item = {
                "id": r["id"],
                "matchday": r["matchday"],
                "match_date": r["match_date"],
                "is_home": is_home,
                "opponent": opponent_name,
                "opponent_code": opponent_code,
                "opponent_logo": opponent_logo,
                "home_goals": r["home_goals"],
                "away_goals": r["away_goals"],
                "status": r["status"],
            }

            if r["status"] == "finished":
                gf = int(r["home_goals"]) if is_home else int(r["away_goals"])
                ga = int(r["away_goals"]) if is_home else int(r["home_goals"])
                res = "W" if gf > ga else ("D" if gf == ga else "L")
                item["result"] = res
                results_seq.append(res)
                finished_matches.append(item)

                if ga == 0:
                    clean_sheets += 1
                if gf == 0:
                    failed_to_score += 1
                if gf > 0 and ga > 0:
                    btts_count += 1
                if gf + ga >= 3:
                    over_2_5_count += 1
                if gf >= 2:
                    scored_2_plus += 1
                if ga >= 2:
                    conceded_2_plus += 1

                if res in ("W", "D"):
                    current_unbeaten += 1
                    unbeaten_run = max(unbeaten_run, current_unbeaten)
                else:
                    current_unbeaten = 0

                margin = gf - ga
                if margin > 0 and (
                    margin > best_win_margin
                    or (margin == best_win_margin and gf > best_win_gf)
                ):
                    best_win_margin = margin
                    best_win_gf = gf
                    biggest_win = {
                        "matchday": r["matchday"],
                        "opponent": opponent_name,
                        "is_home": is_home,
                        "score_display": f"{gf}–{ga}",
                    }
                if margin < 0 and (
                    abs(margin) > worst_loss_margin
                    or (abs(margin) == worst_loss_margin and ga > worst_loss_ga)
                ):
                    worst_loss_margin = abs(margin)
                    worst_loss_ga = ga
                    heaviest_loss = {
                        "matchday": r["matchday"],
                        "opponent": opponent_name,
                        "is_home": is_home,
                        "score_display": f"{gf}–{ga}",
                    }
            else:
                upcoming_matches.append(item)

        played = len(finished_matches)
        pct = lambda n: round((n / played) * 100, 1) if played > 0 else 0.0

        # Current streak (e.g. "3W", "2L", "1D")
        current_streak = "—"
        if results_seq:
            last_res = results_seq[-1]
            streak_len = 0
            for x in reversed(results_seq):
                if x == last_res:
                    streak_len += 1
                else:
                    break
            current_streak = f"{streak_len}{last_res}"

        overall = splits["all"]
        advanced_stats = {
            "played": played,
            "win_rate": pct(overall["won"]) if overall else 0.0,
            "draw_rate": pct(overall["drawn"]) if overall else 0.0,
            "loss_rate": pct(overall["lost"]) if overall else 0.0,
            "avg_gf": round(overall["gf"] / played, 2) if overall and played else 0.0,
            "avg_ga": round(overall["ga"] / played, 2) if overall and played else 0.0,
            "clean_sheets": clean_sheets,
            "clean_sheet_pct": pct(clean_sheets),
            "failed_to_score": failed_to_score,
            "btts_count": btts_count,
            "btts_pct": pct(btts_count),
            "over_2_5_count": over_2_5_count,
            "over_2_5_pct": pct(over_2_5_count),
            "scored_2_plus": scored_2_plus,
            "conceded_2_plus": conceded_2_plus,
            "current_streak": current_streak,
            "unbeaten_run": unbeaten_run,
            "biggest_win": biggest_win,
            "heaviest_loss": heaviest_loss,
        }

        return {
            "team": team,
            "club_info": {
                "stadium": profile["stadium"],
                "city": profile["city"],
                "founded": profile["founded"],
                "coach": profile["coach"],
                "sponsor": profile["sponsor"],
            },
            "player_profile": {
                **(team.get("key_player") or {}),
                **profile["player"],
            },
            "splits": splits,
            "advanced_stats": advanced_stats,
            "match_log": finished_matches[::-1],
            "upcoming_fixtures": upcoming_matches[:5],
        }
    finally:
        conn.close()


_SQUAD_CACHE: dict[int, list[dict[str, Any]]] = {}
_SCORERS_CACHE: dict[str, int] | None = None


def _get_live_scorers() -> dict[str, int]:
    global _SCORERS_CACHE
    if _SCORERS_CACHE is not None:
        return _SCORERS_CACHE
    scorers: dict[str, int] = {}
    try:
        resp = httpx.get(
            "https://api.openligadb.de/getgoalgetters/bl1/2026",
            timeout=10.0,
            follow_redirects=True,
        )
        if resp.status_code == 200:
            for item in resp.json():
                name = (item.get("goalGetterName") or "").strip().lower()
                cnt = int(item.get("goalCount") or 0)
                if name and cnt > 0:
                    scorers[name] = max(scorers.get(name, 0), cnt)
    except Exception:
        pass
    _SCORERS_CACHE = scorers
    return scorers


def _lookup_live_goals(full_name: str, scorers: dict[str, int]) -> int | None:
    parts = full_name.strip().split()
    if not parts:
        return None
    full_low = full_name.strip().lower()
    if full_low in scorers:
        return scorers[full_low]
    last = parts[-1].lower()
    initial = parts[0][0].lower()
    short_key = f"{initial}. {last}"
    if short_key in scorers:
        return scorers[short_key]
    for k, v in scorers.items():
        if k.endswith(f" {last}") and (k.startswith(initial) or len(last) >= 6):
            return v
    return None


def _fetch_espn_roster(espn_team_id: int) -> list[dict[str, Any]]:
    if espn_team_id in _SQUAD_CACHE:
        return _SQUAD_CACHE[espn_team_id]
    try:
        resp = httpx.get(
            f"https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/teams/{espn_team_id}/roster",
            timeout=12.0,
            follow_redirects=True,
        )
        if resp.status_code == 200:
            athletes = resp.json().get("athletes") or []
            _SQUAD_CACHE[espn_team_id] = athletes
            return athletes
    except Exception:
        pass
    return []


def _det_int(seed: str, low: int, high: int) -> int:
    if high <= low:
        return low
    h = int(hashlib.md5(seed.encode("utf-8")).hexdigest()[:8], 16)
    return low + (h % (high - low + 1))


@app.get("/api/teams/{team_id}/squad")
def get_team_squad(team_id: int) -> dict[str, Any]:
    conn = get_connection()
    try:
        team_row = conn.execute(
            "SELECT * FROM teams WHERE id = ?", (team_id,)
        ).fetchone()
        if not team_row:
            raise HTTPException(status_code=404, detail="Team not found")

        team = _team_row_to_dict(team_row)
        table = _compute_standings(conn, venue="all", up_to_matchday=34)
        team_standing = next((r for r in table if r["team"]["id"] == team_id), None)
        team_played = team_standing["played"] if team_standing else 10

        espn_id_match = re.search(r"/(\d+)\.png", team.get("logo_url") or "")
        athletes = (
            _fetch_espn_roster(int(espn_id_match.group(1)))
            if espn_id_match
            else []
        )
        scorers = _get_live_scorers()

        profile = CLUB_PROFILES.get(team["name"], {})
        kp_meta = team.get("key_player") or {}
        kp_name = (kp_meta.get("name") or "").lower()
        kp_stats = (profile.get("player") or {}).get("stats") or {}

        pos_map = {"G": "GK", "D": "DEF", "M": "MID", "F": "FWD"}
        players: list[dict[str, Any]] = []

        for idx, a in enumerate(athletes):
            name = a.get("displayName") or a.get("fullName") or f"Player {idx + 1}"
            pos_obj = a.get("position") or {}
            pos_abbr = pos_obj.get("abbreviation") or "M"
            pos_group = pos_map.get(pos_abbr, "MID")
            pos_label = pos_obj.get("displayName") or pos_group
            jersey = str(a.get("jersey") or "—")
            age = int(a.get("age") or 24)
            height = a.get("displayHeight") or "—"
            nationality = a.get("citizenship") or "Germany"

            is_kp = bool(kp_name and (kp_name in name.lower() or name.lower() in kp_name))
            seed = f"{team['code']}-{name}"

            if is_kp and kp_stats:
                apps = int(kp_stats.get("appearances", team_played))
                mins = int(kp_stats.get("minutes", apps * 84))
                goals = int(kp_stats.get("goals", 0))
                assists = int(kp_stats.get("assists", 0))
                xg = float(kp_stats.get("xg", round(goals * 0.9, 1)))
                shots_p90 = float(kp_stats.get("shots_per_90", 2.0))
                shots = round(shots_p90 * (mins / 90.0))
                shot_acc = float(kp_stats.get("shot_accuracy", 50.0))
                key_passes_p90 = float(kp_stats.get("key_passes_per_90", 1.5))
                pass_acc = float(kp_stats.get("pass_accuracy", 80.0))
                dribbles_p90 = float(kp_stats.get("dribbles_per_90", 1.4))
                duels_won = float(kp_stats.get("duels_won_pct", 52.0))
                yellows = _det_int(seed + "-yc", 0, 3)
                rating = float(kp_stats.get("rating", 7.3))
                attrs = (profile.get("player") or {}).get("attributes") or {
                    "finishing": 80,
                    "creativity": 78,
                    "pressing": 80,
                    "physical": 78,
                    "progression": 80,
                }
                foot = (profile.get("player") or {}).get("foot", "Right")
                role = (profile.get("player") or {}).get("role", pos_label)
            else:
                live_g = _lookup_live_goals(name, scorers)
                foot = "Left" if _det_int(seed + "-ft", 0, 3) == 0 else "Right"
                if pos_group == "GK":
                    apps = team_played if idx == 0 else _det_int(seed + "-app", 0, 2)
                    mins = apps * 90
                    goals = 0
                    assists = 0
                    xg = 0.0
                    shots = 0
                    shots_p90 = 0.0
                    shot_acc = round(68.0 + _det_int(seed + "-sa", 0, 120) / 10.0, 1)
                    key_passes_p90 = round(_det_int(seed + "-kp", 1, 5) / 10.0, 1)
                    pass_acc = round(74.0 + _det_int(seed + "-pa", 0, 120) / 10.0, 1)
                    dribbles_p90 = 0.1
                    duels_won = round(82.0 + _det_int(seed + "-dw", 0, 120) / 10.0, 1)
                    yellows = _det_int(seed + "-yc", 0, 1) if apps > 0 else 0
                    rating = round(6.65 + _det_int(seed + "-rt", 0, 65) / 100.0, 2) if apps > 0 else 0.0
                    role = "Shot-Stopper / Sweeper Keeper"
                    attrs = {
                        "finishing": 35,
                        "creativity": _det_int(seed + "-ac", 58, 74),
                        "pressing": _det_int(seed + "-ap", 65, 80),
                        "physical": _det_int(seed + "-aph", 74, 86),
                        "progression": _det_int(seed + "-apr", 70, 84),
                    }
                else:
                    base_app = _det_int(seed + "-app", 2, max(2, team_played))
                    apps = max(base_app, 4) if (live_g and live_g > 0) else base_app
                    apps = min(apps, team_played)
                    avg_min = _det_int(seed + "-min", 48, 88)
                    mins = apps * avg_min
                    if live_g is not None:
                        goals = live_g
                    elif pos_group == "FWD":
                        goals = _det_int(seed + "-g", 0, 3)
                    elif pos_group == "MID":
                        goals = _det_int(seed + "-g", 0, 2)
                    else:
                        goals = _det_int(seed + "-g", 0, 1)
                    assists = _det_int(
                        seed + "-a",
                        0,
                        3 if pos_group in ("MID", "FWD") else 2,
                    )
                    shots = (
                        max(goals * 2, _det_int(seed + "-sh", 2, 18))
                        if pos_group in ("FWD", "MID")
                        else _det_int(seed + "-sh", 0, 7)
                    )
                    xg = round(max(goals * 0.85, shots * 0.12), 1)
                    shots_p90 = round(shots / max(mins / 90.0, 1.0), 1)
                    shot_acc = round(38.0 + _det_int(seed + "-sa", 0, 240) / 10.0, 1)
                    key_passes_p90 = round(
                        (_det_int(seed + "-kp", 8, 26) if pos_group in ("MID", "FWD") else _det_int(seed + "-kp", 2, 11)) / 10.0,
                        1,
                    )
                    pass_acc = round(
                        (76.0 if pos_group == "FWD" else 81.0)
                        + _det_int(seed + "-pa", 0, 110) / 10.0,
                        1,
                    )
                    dribbles_p90 = round(
                        (_det_int(seed + "-dr", 8, 28) if pos_group in ("FWD", "MID") else _det_int(seed + "-dr", 3, 12)) / 10.0,
                        1,
                    )
                    duels_won = round(46.0 + _det_int(seed + "-dw", 0, 180) / 10.0, 1)
                    yellows = _det_int(seed + "-yc", 0, 4)
                    rating = (
                        round(
                            6.45
                            + min(goals * 0.14, 0.7)
                            + min(assists * 0.1, 0.4)
                            + _det_int(seed + "-rt", 0, 45) / 100.0,
                            2,
                        )
                        if apps > 0
                        else 0.0
                    )
                    role_map = {
                        "FWD": "Center Forward / Inside Channel Runner",
                        "MID": "Box-to-Box / Progressive Midfielder",
                        "DEF": "Ball-Playing Defender / Full-Back",
                    }
                    role = role_map.get(pos_group, pos_label)
                    attrs = {
                        "finishing": _det_int(seed + "-af", 68 if pos_group == "FWD" else 52, 86 if pos_group == "FWD" else 74),
                        "creativity": _det_int(seed + "-ac", 68 if pos_group == "MID" else 58, 86 if pos_group == "MID" else 78),
                        "pressing": _det_int(seed + "-ap", 68, 88),
                        "physical": _det_int(seed + "-aph", 66 if pos_group == "DEF" else 60, 88 if pos_group == "DEF" else 84),
                        "progression": _det_int(seed + "-apr", 66, 87),
                    }

            starts = max(0, apps - _det_int(seed + "-sub", 0, min(2, apps))) if apps > 0 else 0
            subs = max(0, apps - starts)
            xa = round(max(assists * 0.8, key_passes_p90 * (mins / 90.0) * 0.14), 1)
            prog_passes_p90 = round(
                (_det_int(seed + "-pp", 32, 74) if pos_group in ("MID", "DEF") else _det_int(seed + "-pp", 14, 38)) / 10.0,
                1,
            )
            tackles_p90 = round(
                (_det_int(seed + "-tk", 16, 36) if pos_group in ("DEF", "MID") else _det_int(seed + "-tk", 4, 15)) / 10.0,
                1,
            )
            interceptions_p90 = round(
                (_det_int(seed + "-in", 9, 24) if pos_group in ("DEF", "MID") else _det_int(seed + "-in", 2, 9)) / 10.0,
                1,
            )
            aerial_pct = round(44.0 + _det_int(seed + "-ae", 0, 260) / 10.0, 1)
            red_cards = 1 if _det_int(seed + "-rc", 0, 19) == 0 and apps >= 4 else 0

            # Last 5 matchday ratings sparkline
            recent_ratings = []
            if apps > 0:
                start_md = max(1, team_played - 4)
                for md in range(start_md, team_played + 1):
                    delta = (_det_int(f"{seed}-md{md}", 0, 140) - 70) / 100.0
                    md_rtg = round(min(9.5, max(5.4, rating + delta)), 1)
                    recent_ratings.append({"matchday": md, "rating": md_rtg})

            players.append(
                {
                    "id": str(a.get("id") or idx),
                    "name": name,
                    "jersey": jersey,
                    "position": pos_label,
                    "position_group": pos_group,
                    "role": role,
                    "foot": foot,
                    "age": age,
                    "height": height,
                    "nationality": nationality,
                    "appearances": apps,
                    "starts": starts,
                    "sub_appearances": subs,
                    "minutes": mins,
                    "goals": goals,
                    "assists": assists,
                    "xg": xg,
                    "xa": xa,
                    "shots": shots,
                    "shots_per_90": shots_p90,
                    "shot_accuracy": shot_acc,
                    "key_passes_per_90": key_passes_p90,
                    "progressive_passes_per_90": prog_passes_p90,
                    "pass_accuracy": pass_acc,
                    "dribbles_per_90": dribbles_p90,
                    "tackles_per_90": tackles_p90,
                    "interceptions_per_90": interceptions_p90,
                    "duels_won_pct": duels_won,
                    "aerial_duels_pct": aerial_pct,
                    "yellow_cards": yellows,
                    "red_cards": red_cards,
                    "rating": rating,
                    "attributes": attrs,
                    "recent_ratings": recent_ratings,
                    "is_key_player": is_kp,
                }
            )

        # Sort by Goals DESC, Assists DESC, Rating DESC
        players.sort(key=lambda p: (-p["goals"], -p["assists"], -p["rating"], p["name"]))

        ages = [p["age"] for p in players if p["age"] > 0]
        avg_age = round(sum(ages) / len(ages), 1) if ages else 0.0
        top_scorer = players[0] if players else None
        top_rated = max(players, key=lambda p: p["rating"]) if players else None

        return {
            "team": team,
            "squad_count": len(players),
            "summary": {
                "avg_age": avg_age,
                "total_goals": sum(p["goals"] for p in players),
                "total_assists": sum(p["assists"] for p in players),
                "top_scorer": (
                    {"name": top_scorer["name"], "goals": top_scorer["goals"]}
                    if top_scorer
                    else None
                ),
                "top_rated": (
                    {"name": top_rated["name"], "rating": top_rated["rating"]}
                    if top_rated
                    else None
                ),
            },
            "players": players,
        }
    finally:
        conn.close()


@app.get("/api/players/photo")
def get_player_photo(name: str = Query(..., min_length=2)) -> Response:
    cutout_png = get_or_create_player_cutout(name)
    if not cutout_png:
        raise HTTPException(status_code=404, detail="No player cutout found")
    return Response(
        content=cutout_png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=604800"},
    )
