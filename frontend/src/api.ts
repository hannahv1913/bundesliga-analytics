import type {
  MatchesResponse,
  QuadrantResponse,
  SquadStatsResponse,
  StandingsResponse,
  SyncResponse,
  TeamDetailsResponse,
  TeamSummaryResponse,
  VenueFilter,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "";
export const IS_STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";

const staticCache: Record<string, unknown> = {};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function fetchStatic<T>(file: string): Promise<T> {
  if (staticCache[file]) {
    return staticCache[file] as T;
  }
  const res = await fetch(`./data/${file}`);
  if (!res.ok) {
    throw new Error(`Failed to load static snapshot ${file}`);
  }
  const data = (await res.json()) as T;
  staticCache[file] = data;
  return data;
}

export async function getStandings(
  venue: VenueFilter,
  upToMatchday: number
): Promise<StandingsResponse> {
  if (IS_STATIC_MODE) {
    const all = await fetchStatic<Record<string, Record<string, StandingsResponse>>>(
      "standings.json"
    );
    const byMd = all[venue] || all["all"];
    const keys = Object.keys(byMd).map(Number).sort((a, b) => a - b);
    const clamped = Math.min(Math.max(1, upToMatchday), keys[keys.length - 1] ?? 1);
    return byMd[String(clamped)];
  }
  return fetchJson(
    `/api/standings?venue=${venue}&up_to_matchday=${upToMatchday}`
  );
}

export async function getQuadrant(
  venue: VenueFilter,
  upToMatchday: number
): Promise<QuadrantResponse> {
  if (IS_STATIC_MODE) {
    const all = await fetchStatic<Record<string, Record<string, QuadrantResponse>>>(
      "quadrant.json"
    );
    const byMd = all[venue] || all["all"];
    const keys = Object.keys(byMd).map(Number).sort((a, b) => a - b);
    const clamped = Math.min(Math.max(1, upToMatchday), keys[keys.length - 1] ?? 1);
    return byMd[String(clamped)];
  }
  return fetchJson(
    `/api/analytics/quadrant?venue=${venue}&up_to_matchday=${upToMatchday}`
  );
}

export async function getMatches(params: {
  matchday?: number;
  teamId?: number;
}): Promise<MatchesResponse> {
  if (IS_STATIC_MODE) {
    const all = await fetchStatic<MatchesResponse>("matches.json");
    let filtered = all.matches;
    if (params.matchday !== undefined) {
      filtered = filtered.filter((m) => m.matchday === params.matchday);
    }
    if (params.teamId !== undefined) {
      filtered = filtered.filter(
        (m) => m.home_team.id === params.teamId || m.away_team.id === params.teamId
      );
    }
    return {
      available_matchdays: all.available_matchdays,
      current_matchday: all.current_matchday,
      matches: filtered,
    };
  }
  const search = new URLSearchParams();
  if (params.matchday !== undefined) {
    search.set("matchday", String(params.matchday));
  }
  if (params.teamId !== undefined) {
    search.set("team_id", String(params.teamId));
  }
  const qs = search.toString();
  return fetchJson(`/api/matches${qs ? `?${qs}` : ""}`);
}

export async function getTeamSummary(teamId: number): Promise<TeamSummaryResponse> {
  if (IS_STATIC_MODE) {
    const all = await fetchStatic<Record<string, TeamSummaryResponse>>("summaries.json");
    return all[String(teamId)];
  }
  return fetchJson(`/api/teams/${teamId}/summary`);
}

export async function getTeamDetails(teamId: number): Promise<TeamDetailsResponse> {
  if (IS_STATIC_MODE) {
    const all = await fetchStatic<Record<string, TeamDetailsResponse>>("details.json");
    return all[String(teamId)];
  }
  return fetchJson(`/api/teams/${teamId}/details`);
}

export async function getTeamSquad(teamId: number): Promise<SquadStatsResponse> {
  if (IS_STATIC_MODE) {
    const all = await fetchStatic<Record<string, SquadStatsResponse>>("squads.json");
    return all[String(teamId)];
  }
  return fetchJson(`/api/teams/${teamId}/squad`);
}

export async function syncData(): Promise<SyncResponse> {
  if (IS_STATIC_MODE) {
    const st = await getStandings("all", 34);
    return {
      status: "ok",
      season: "2026-27",
      teams_count: st.standings.length,
      upserted_matches: 306,
      last_updated: st.last_updated || new Date().toISOString(),
    };
  }
  return fetchJson(`/api/sync`, { method: "POST" });
}
