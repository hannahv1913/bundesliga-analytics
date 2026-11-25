export type VenueFilter = "all" | "home" | "away";
export type FormResult = "W" | "D" | "L";

export interface KeyPlayer {
  name: string;
  number: number;
  position: string;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  code: string;
  logo_url: string | null;
  primary_color: string;
  key_player?: KeyPlayer | null;
}

export interface StandingRow {
  rank: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  ppg: number;
  form: FormResult[];
}

export interface StandingsResponse {
  venue: VenueFilter;
  up_to_matchday: number;
  max_played_matchday: number;
  last_updated: string | null;
  standings: StandingRow[];
}

export interface QuadrantClub {
  team: Team;
  rank: number;
  played: number;
  points: number;
  gf: number;
  ga: number;
  gf_per_game: number;
  ga_per_game: number;
}

export interface QuadrantResponse {
  venue: VenueFilter;
  up_to_matchday: number;
  avg_gf_per_game: number;
  avg_ga_per_game: number;
  clubs: QuadrantClub[];
}

export interface MatchItem {
  id: number;
  season: string;
  matchday: number;
  match_date: string;
  home_goals: number | null;
  away_goals: number | null;
  status: "finished" | "scheduled";
  home_team: Team;
  away_team: Team;
}

export interface MatchesResponse {
  available_matchdays: number[];
  current_matchday: number;
  matches: MatchItem[];
}

export interface TrajectoryPoint {
  matchday: number;
  points: number;
  cumulative_points: number;
  league_avg_cumulative_points: number;
}

export interface TeamFixtureItem {
  id: number;
  matchday: number;
  match_date: string;
  is_home: boolean;
  opponent: string;
  opponent_code: string;
  opponent_logo: string | null;
  home_goals: number | null;
  away_goals: number | null;
  status: "finished" | "scheduled";
  result?: FormResult;
}

export interface BiggestWin {
  matchday: number;
  match_date: string;
  opponent: string;
  is_home: boolean;
  score_display: string;
  margin: number;
}

export interface TeamSummaryResponse {
  team: Team;
  trajectory: TrajectoryPoint[];
  splits: {
    all: StandingRow;
    home: StandingRow;
    away: StandingRow;
  };
  biggest_win: BiggestWin | null;
  recent_fixtures: TeamFixtureItem[];
  upcoming_fixtures: TeamFixtureItem[];
}

export interface SyncResponse {
  status: string;
  season: string;
  teams_count: number;
  upserted_matches: number;
  last_updated: string;
}

export interface ClubInfo {
  stadium: string;
  city: string;
  founded: number;
  coach: string;
  sponsor: string;
}

export interface PlayerSeasonStats {
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  shots_per_90: number;
  shot_accuracy: number;
  key_passes_per_90: number;
  pass_accuracy: number;
  dribbles_per_90: number;
  duels_won_pct: number;
  rating: number;
}

export interface PlayerAttributes {
  finishing: number;
  creativity: number;
  pressing: number;
  physical: number;
  progression: number;
}

export interface PlayerProfile {
  name?: string;
  number?: number;
  position?: string;
  nationality: string;
  age: number;
  height: string;
  foot: string;
  role: string;
  bio: string;
  stats?: PlayerSeasonStats;
  attributes?: PlayerAttributes;
}

export interface MatchExtremum {
  matchday: number;
  opponent: string;
  is_home: boolean;
  score_display: string;
}

export interface AdvancedStats {
  played: number;
  win_rate: number;
  draw_rate: number;
  loss_rate: number;
  avg_gf: number;
  avg_ga: number;
  clean_sheets: number;
  clean_sheet_pct: number;
  failed_to_score: number;
  btts_count: number;
  btts_pct: number;
  over_2_5_count: number;
  over_2_5_pct: number;
  scored_2_plus: number;
  conceded_2_plus: number;
  current_streak: string;
  unbeaten_run: number;
  biggest_win: MatchExtremum | null;
  heaviest_loss: MatchExtremum | null;
}

export interface TeamDetailsResponse {
  team: Team;
  club_info: ClubInfo;
  player_profile: PlayerProfile;
  splits: {
    all: StandingRow;
    home: StandingRow;
    away: StandingRow;
  };
  advanced_stats: AdvancedStats;
  match_log: TeamFixtureItem[];
  upcoming_fixtures: TeamFixtureItem[];
}

export interface SquadPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  position_group: "GK" | "DEF" | "MID" | "FWD";
  role: string;
  foot: string;
  age: number;
  height: string;
  nationality: string;
  appearances: number;
  starts: number;
  sub_appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  shots: number;
  shots_per_90: number;
  shot_accuracy: number;
  key_passes_per_90: number;
  progressive_passes_per_90: number;
  pass_accuracy: number;
  dribbles_per_90: number;
  tackles_per_90: number;
  interceptions_per_90: number;
  duels_won_pct: number;
  aerial_duels_pct: number;
  yellow_cards: number;
  red_cards: number;
  rating: number;
  attributes: PlayerAttributes;
  recent_ratings: { matchday: number; rating: number }[];
  is_key_player: boolean;
}

export interface SquadStatsResponse {
  team: Team;
  squad_count: number;
  summary: {
    avg_age: number;
    total_goals: number;
    total_assists: number;
    top_scorer: { name: string; goals: number } | null;
    top_rated: { name: string; rating: number } | null;
  };
  players: SquadPlayer[];
}
