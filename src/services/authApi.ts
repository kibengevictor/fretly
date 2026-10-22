export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

const apiUrl = process.env.EXPO_PUBLIC_SONG_API_URL;
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export async function login(email: string, password: string) {
  if (!apiUrl) throw new Error('The account API is not configured.');
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Unable to sign in.');
  setAuthToken(body.token);
  return body as { user: AuthUser; token: string };
}

export async function register(email: string, password: string) {
  if (!apiUrl) throw new Error('The account API is not configured.');
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Unable to create account.');
  return body as { verificationRequired: boolean; email: string };
}

export async function verifyEmail(email: string, code: string) {
  if (!apiUrl) throw new Error('The account API is not configured.');
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Unable to verify email.');
  setAuthToken(body.token);
  return body as { user: AuthUser; token: string };
}

export async function resendVerification(email: string) {
  if (!apiUrl) throw new Error('The account API is not configured.');
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Unable to resend verification email.');
}

export async function requestPasswordReset(email: string) {
  if (!apiUrl) throw new Error('The account API is not configured.');
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/auth/request-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Unable to request password reset.');
}

export async function resetPassword(email: string, code: string, password: string) {
  if (!apiUrl) throw new Error('The account API is not configured.');
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, password }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Unable to reset password.');
}

export function logout() {
  setAuthToken(null);
}
