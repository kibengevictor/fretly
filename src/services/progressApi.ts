import type { Progress } from '../contexts/ProgressContext';
import { getAuthToken } from './authApi';

const apiUrl = process.env.EXPO_PUBLIC_SONG_API_URL;

export async function fetchProgress(): Promise<Progress | null> {
  const token = getAuthToken();
  if (!apiUrl || !token) return null;
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/progress`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Progress request failed with status ${response.status}.`);
  return await response.json() as Progress;
}

export async function saveProgress(progress: Progress): Promise<void> {
  const token = getAuthToken();
  if (!apiUrl || !token) return;
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(progress),
  });
  if (!response.ok) throw new Error(`Progress save failed with status ${response.status}.`);
}
