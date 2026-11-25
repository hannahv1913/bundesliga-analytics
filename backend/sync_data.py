from __future__ import annotations

import difflib
import hashlib
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from database import DB_PATH, get_connection, init_db

OPENLIGADB_URL = "https://api.openligadb.de/getmatchdata/bl1/2026"
OPENFOOTBALL_URL = (
    "https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/de.1.json"
)
ESPN_TEAMS_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/teams"
SEASON_LABEL = "2026-27"

CANONICAL_TEAM_NAMES = {
    "TSG Hoffenheim": "TSG 1899 Hoffenheim",
}

KEY_PLAYERS: dict[str, tuple[str, int, str]] = {
    "VfB Stuttgart": ("Deniz Undav", 26, "ST"),
    "FC Bayern München": ("Harry Kane", 9, "ST"),
    "Borussia Dortmund": ("Serhou Guirassy", 9, "ST"),
    "Bayer 04 Leverkusen": ("Patrik Schick", 14, "ST"),
    "RB Leipzig": ("Xavi Simons", 10, "AM"),
    "Eintracht Frankfurt": ("Hugo Ekitiké", 11, "ST"),
    "SC Freiburg": ("Ritsu Dōan", 42, "RW"),
    "SV Werder Bremen": ("Marvin Ducksch", 7, "ST"),
    "1. FSV Mainz 05": ("Silvan Widmer", 30, "RB"),
    "FC Augsburg": ("Alexis Claude-Maurice", 19, "AM"),
    "Borussia Mönchengladbach": ("Tim Kleindienst", 11, "ST"),
    "1. FC Union Berlin": ("Benedict Hollerbach", 16, "ST"),
    "TSG 1899 Hoffenheim": ("Andrej Kramarić", 27, "AM"),
    "1. FC Köln": ("Dejan Ljubičić", 7, "CM"),
    "FC Schalke 04": ("Dominick Drexler", 24, "AM"),
    "Hamburger SV": ("Davie Selke", 27, "ST"),
    "SC Paderborn 07": ("Markus Schubert", 1, "GK"),
    "SV 07 Elversberg": ("Fisnik Asllani", 10, "ST"),
}

FALLBACK_PALETTE = [
    "#D20515",
    "#E11D48",
    "#2563EB",
    "#059669",
    "#D97706",
    "#7C3AED",
    "#0891B2",
    "#DB2777",
]

NAME_ALIASES = {
    "munchen": "munich",
    "koln": "cologne",
    "nurnberg": "nuremberg",
    "monchengladbach": "monchengladbach",
    "gladbach": "monchengladbach",
    "st": "saint",
    "hamburger": "hamburg",
}

STRIP_TOKENS = {
    "1",
    "fc",
    "sv",
    "vfl",
    "vfb",
    "tsg",
    "fsv",
    "sc",
    "bv",
    "bvb",
    "spvgg",
    "tsv",
    "rb",
    "04",
    "05",
    "98",
    "1846",
    "1848",
    "1899",
    "1900",
    "1904",
    "1909",
    "ev",
}


def _normalize_name(name: str) -> str:
    """Normalize a club name for fuzzy matching across German/English sources."""
    replacements = {
        "ä": "a",
        "ö": "o",
        "ü": "u",
        "ß": "ss",
        "Ä": "A",
        "Ö": "O",
        "Ü": "U",
    }
    text = name
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    tokens = [NAME_ALIASES.get(tok, tok) for tok in text.split()]
    core_tokens = [tok for tok in tokens if tok not in STRIP_TOKENS]
    return " ".join(core_tokens) if core_tokens else " ".join(tokens)


def _generate_initials(name: str) -> str:
    """Generate a 3-letter club code from a team name when ESPN metadata is unavailable."""
    cleaned = _normalize_name(name)
    tokens = cleaned.split()
    if not tokens:
        return "BLG"
    if len(tokens) == 1:
        return tokens[0][:3].upper()
    code = "".join(tok[0] for tok in tokens[:3])
    if len(code) < 3 and len(tokens[-1]) >= 2:
        code = tokens[0][0] + tokens[-1][:2]
    return code[:3].upper()


def _fallback_color(name: str) -> str:
    digest = hashlib.sha256(name.encode("utf-8")).hexdigest()
    idx = int(digest[:8], 16) % len(FALLBACK_PALETTE)
    return FALLBACK_PALETTE[idx]


def _format_color(raw_color: str | None, team_name: str) -> str:
    if not raw_color:
        return _fallback_color(team_name)
    color = raw_color.strip()
    if not color.startswith("#"):
        color = f"#{color}"
    if re.fullmatch(r"#[0-9a-fA-F]{6}", color):
        return color.upper()
    return _fallback_color(team_name)


def _parse_matchday(round_str: str) -> int:
    match = re.search(r"(\d+)", round_str or "")
    return int(match.group(1)) if match else 1


def _fetch_espn_teams(client: httpx.Client) -> list[dict[str, Any]]:
    try:
        resp = client.get(ESPN_TEAMS_URL, timeout=20.0)
        resp.raise_for_status()
        payload = resp.json()
        sports = payload.get("sports") or []
        if not sports:
            return []
        leagues = sports[0].get("leagues") or []
        if not leagues:
            return []
        raw_teams = leagues[0].get("teams") or []
        parsed: list[dict[str, Any]] = []
        for entry in raw_teams:
            team = entry.get("team") or entry
            logos = team.get("logos") or []
            logo_url = logos[0].get("href") if logos else None
            display_name = team.get("displayName") or team.get("name") or ""
            short_name = (
                team.get("shortDisplayName") or team.get("name") or display_name
            )
            parsed.append(
                {
                    "display_name": display_name,
                    "short_name": short_name,
                    "code": (
                        team.get("abbreviation") or _generate_initials(display_name)
                    )[:4].upper(),
                    "logo_url": logo_url,
                    "primary_color": _format_color(team.get("color"), display_name),
                    "norm_full": _normalize_name(display_name),
                    "norm_short": _normalize_name(short_name),
                }
            )
        return parsed
    except Exception:
        return []


def _match_espn_team(team_name: str, espn_teams: list[dict[str, Any]]) -> dict[str, Any]:
    norm_target = _normalize_name(team_name)
    best_score = 0.0
    best_match: dict[str, Any] | None = None

    for espn in espn_teams:
        for candidate in (espn["norm_full"], espn["norm_short"]):
            if not candidate:
                continue
            if norm_target == candidate:
                return espn
            if norm_target in candidate or candidate in norm_target:
                score = 0.92
            else:
                score = difflib.SequenceMatcher(None, norm_target, candidate).ratio()
            if score > best_score:
                best_score = score
                best_match = espn

    if best_match and best_score >= 0.62:
        return best_match

    return {
        "short_name": team_name,
        "code": _generate_initials(team_name),
        "logo_url": None,
        "primary_color": _fallback_color(team_name),
    }


def _fetch_openligadb_matches(client: httpx.Client) -> list[dict[str, Any]]:
    resp = client.get(OPENLIGADB_URL, timeout=30.0)
    resp.raise_for_status()
    raw = resp.json()
    normalized: list[dict[str, Any]] = []
    for m in raw:
        t1 = (m.get("team1") or {}).get("teamName")
        t2 = (m.get("team2") or {}).get("teamName")
        if not t1 or not t2:
            continue
        home_name = CANONICAL_TEAM_NAMES.get(t1, t1)
        away_name = CANONICAL_TEAM_NAMES.get(t2, t2)
        matchday = int((m.get("group") or {}).get("groupOrderID") or 1)
        dt_raw = m.get("matchDateTime") or ""
        match_date = dt_raw[:16] if len(dt_raw) >= 16 else dt_raw

        home_goals = None
        away_goals = None
        status = "scheduled"
        if m.get("matchIsFinished"):
            results = m.get("matchResults") or []
            ft = next(
                (r for r in results if r.get("resultTypeID") == 2),
                results[-1] if results else None,
            )
            if ft and ft.get("pointsTeam1") is not None and ft.get("pointsTeam2") is not None:
                home_goals = int(ft["pointsTeam1"])
                away_goals = int(ft["pointsTeam2"])
                status = "finished"

        normalized.append(
            {
                "matchday": matchday,
                "match_date": match_date,
                "home_name": home_name,
                "away_name": away_name,
                "home_goals": home_goals,
                "away_goals": away_goals,
                "status": status,
            }
        )
    return normalized


def _fetch_openfootball_matches(client: httpx.Client) -> list[dict[str, Any]]:
    resp = client.get(OPENFOOTBALL_URL, timeout=30.0)
    resp.raise_for_status()
    of_data = resp.json()
    normalized: list[dict[str, Any]] = []
    for m in of_data.get("matches") or []:
        t1 = m.get("team1")
        t2 = m.get("team2")
        if not t1 or not t2:
            continue
        home_name = CANONICAL_TEAM_NAMES.get(t1, t1)
        away_name = CANONICAL_TEAM_NAMES.get(t2, t2)
        matchday = _parse_matchday(m.get("round", ""))
        date_str = m.get("date") or ""
        time_str = m.get("time") or ""
        match_date = f"{date_str}T{time_str}" if time_str else date_str

        score = m.get("score") or {}
        ft = score.get("ft") if isinstance(score, dict) else None
        if isinstance(ft, list) and len(ft) == 2 and ft[0] is not None and ft[1] is not None:
            home_goals = int(ft[0])
            away_goals = int(ft[1])
            status = "finished"
        else:
            home_goals = None
            away_goals = None
            status = "scheduled"

        normalized.append(
            {
                "matchday": matchday,
                "match_date": match_date,
                "home_name": home_name,
                "away_name": away_name,
                "home_goals": home_goals,
                "away_goals": away_goals,
                "status": status,
            }
        )
    return normalized


def sync_bundesliga_data(db_path: Path = DB_PATH) -> dict[str, Any]:
    """Fetch 2026-27 Bundesliga fixtures and club metadata and upsert into SQLite."""
    init_db(db_path)

    with httpx.Client(follow_redirects=True) as client:
        source_used = "openligadb"
        try:
            matches = _fetch_openligadb_matches(client)
        except Exception:
            source_used = "openfootball"
            matches = _fetch_openfootball_matches(client)
        espn_teams = _fetch_espn_teams(client)

    team_names: set[str] = set()
    for m in matches:
        team_names.add(m["home_name"])
        team_names.add(m["away_name"])

    conn = get_connection(db_path)
    try:
        team_id_map: dict[str, int] = {}
        for name in sorted(team_names):
            meta = _match_espn_team(name, espn_teams)
            kp_name, kp_num, kp_pos = KEY_PLAYERS.get(name, (None, None, None))
            conn.execute(
                """
                INSERT INTO teams (
                    name, short_name, code, logo_url, primary_color,
                    key_player_name, key_player_number, key_player_position
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    short_name = excluded.short_name,
                    code = excluded.code,
                    logo_url = excluded.logo_url,
                    primary_color = excluded.primary_color,
                    key_player_name = excluded.key_player_name,
                    key_player_number = excluded.key_player_number,
                    key_player_position = excluded.key_player_position
                """,
                (
                    name,
                    meta["short_name"],
                    meta["code"],
                    meta["logo_url"],
                    meta["primary_color"],
                    kp_name,
                    kp_num,
                    kp_pos,
                ),
            )
            row = conn.execute(
                "SELECT id FROM teams WHERE name = ?", (name,)
            ).fetchone()
            team_id_map[name] = int(row["id"])

        upserted_matches = 0
        for m in matches:
            conn.execute(
                """
                INSERT INTO matches (
                    season, matchday, match_date,
                    home_team_id, away_team_id,
                    home_goals, away_goals, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(season, matchday, home_team_id, away_team_id) DO UPDATE SET
                    match_date = excluded.match_date,
                    home_goals = excluded.home_goals,
                    away_goals = excluded.away_goals,
                    status = excluded.status
                """,
                (
                    SEASON_LABEL,
                    m["matchday"],
                    m["match_date"],
                    team_id_map[m["home_name"]],
                    team_id_map[m["away_name"]],
                    m["home_goals"],
                    m["away_goals"],
                    m["status"],
                ),
            )
            upserted_matches += 1

        last_updated = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """
            INSERT INTO sync_metadata (key, value)
            VALUES ('last_updated', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (last_updated,),
        )
        conn.commit()

        return {
            "status": "ok",
            "source": source_used,
            "season": SEASON_LABEL,
            "teams_count": len(team_id_map),
            "upserted_matches": upserted_matches,
            "last_updated": last_updated,
        }
    finally:
        conn.close()


if __name__ == "__main__":
    result = sync_bundesliga_data()
    print(
        f"Synced {result['teams_count']} teams and {result['upserted_matches']} matches "
        f"via {result['source']} (last_updated={result['last_updated']})"
    )
