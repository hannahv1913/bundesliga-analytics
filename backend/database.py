from __future__ import annotations

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "bundesliga.db"


def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """Return a SQLite connection with row_factory configured."""
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Path = DB_PATH) -> None:
    """Create database tables if they do not exist."""
    conn = get_connection(db_path)
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                short_name TEXT NOT NULL,
                code TEXT NOT NULL,
                logo_url TEXT,
                primary_color TEXT NOT NULL DEFAULT '#D20515',
                key_player_name TEXT,
                key_player_number INTEGER,
                key_player_position TEXT
            );

            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                season TEXT NOT NULL,
                matchday INTEGER NOT NULL,
                match_date TEXT NOT NULL,
                home_team_id INTEGER NOT NULL,
                away_team_id INTEGER NOT NULL,
                home_goals INTEGER,
                away_goals INTEGER,
                status TEXT NOT NULL,
                FOREIGN KEY (home_team_id) REFERENCES teams(id),
                FOREIGN KEY (away_team_id) REFERENCES teams(id),
                UNIQUE (season, matchday, home_team_id, away_team_id)
            );

            CREATE TABLE IF NOT EXISTS sync_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_matches_matchday ON matches(matchday);
            CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
            """
        )
        # Ensure new columns exist on existing DBs
        existing_cols = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(teams)").fetchall()
        }
        for col, col_type in [
            ("key_player_name", "TEXT"),
            ("key_player_number", "INTEGER"),
            ("key_player_position", "TEXT"),
        ]:
            if col not in existing_cols:
                conn.execute(f"ALTER TABLE teams ADD COLUMN {col} {col_type}")
        conn.commit()
    finally:
        conn.close()
