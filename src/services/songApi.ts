import { SkillLevel, Song } from '../types';

export interface SongPage {
  songs: Song[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const apiUrl = process.env.EXPO_PUBLIC_SONG_API_URL;

export async function fetchSongs(options: {
  query?: string;
  difficulty?: 'all' | SkillLevel;
  genre?: string;
  chord?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}): Promise<SongPage | null> {
  if (!apiUrl) return null;

  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 20),
  });
  if (options.query?.trim()) params.set('q', options.query.trim());
  if (options.difficulty && options.difficulty !== 'all') params.set('difficulty', options.difficulty);
  if (options.genre) params.set('genre', options.genre);
  if (options.chord) params.set('chord', options.chord);

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/songs?${params.toString()}`, {
    signal: options.signal,
  });
  if (!response.ok) {
    throw new Error(`Song catalog request failed with status ${response.status}.`);
  }

  const payload = await response.json() as SongPage;
  if (!Array.isArray(payload.songs) || typeof payload.total !== 'number') {
    throw new Error('Song catalog response has an invalid shape.');
  }
  return payload;
}

export async function fetchSong(songId: string): Promise<Song | null> {
  if (!apiUrl) return null;
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/songs/${encodeURIComponent(songId)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Song request failed with status ${response.status}.`);
  }
  return await response.json() as Song;
}
