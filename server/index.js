require('dotenv').config({ path: '.env.local' });

const http = require('node:http');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const { createStore } = require('./catalogStore');

const port = Number(process.env.PORT || 8787);
const store = createStore();
const sessions = new Map();
const verificationCode = () => String(crypto.randomInt(100000, 1000000));

async function sendVerificationEmail(email, code) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('Email delivery is not configured. Set SMTP_USER and SMTP_PASSWORD.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    to: email,
    subject: 'Verify your Fretly account',
    text: `Your Fretly verification code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your Fretly verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 15 minutes.</p>`,
  });
}

async function sendPasswordResetEmail(email, code) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('Email delivery is not configured. Set SMTP_USER and SMTP_PASSWORD.');
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    to: email,
    subject: 'Reset your Fretly password',
    text: `Your Fretly password reset code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your Fretly password reset code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 15 minutes.</p>`,
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; if (body.length > 2_000_000) reject(new Error('Request body is too large.')); });
    request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Request body must be valid JSON.')); } });
    request.on('error', reject);
  });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, derived) => error ? reject(error) : resolve(`${salt}:${derived.toString('hex')}`)));
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, derived) => {
    if (error) return reject(error);
    resolve(crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived));
  }));
}

function issueToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { ...user, expiresAt: Date.now() + 1000 * 60 * 60 * 12 });
  return token;
}

function getUser(request) {
  const token = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : '';
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) return null;
  return session;
}

function requireAdmin(request, response) {
  const user = getUser(request);
  if (!user || user.role !== 'admin') { sendJson(response, 401, { error: 'Admin authorization required.' }); return null; }
  return user;
}

function requireUser(request, response) {
  const user = getUser(request);
  if (!user) { sendJson(response, 401, { error: 'Authentication required.' }); return null; }
  return user;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === 'OPTIONS') return sendJson(response, 204, {});
    if (url.pathname === '/health') return sendJson(response, 200, { status: 'ok', catalogMode: store.mode });
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      const { email, password } = await readBody(request);
      if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) return sendJson(response, 400, { error: 'Email and a password of at least 8 characters are required.' });
      if (store.mode !== 'postgres') return sendJson(response, 503, { error: 'Accounts require PostgreSQL.' });
      if (await store.getUser(email)) return sendJson(response, 409, { error: 'An account with that email already exists.' });
      const code = verificationCode();
      const user = await store.createUser(email, password, code);
      await sendVerificationEmail(user.email, code);
      return sendJson(response, 201, { verificationRequired: true, email: user.email });
    }
    if (url.pathname === '/api/auth/verify-email' && request.method === 'POST') {
      const { email, code } = await readBody(request);
      if (typeof email !== 'string' || !/^\d{6}$/.test(String(code))) return sendJson(response, 400, { error: 'A valid email and six-digit verification code are required.' });
      const user = await store.verifyEmail(email, String(code));
      if (!user) return sendJson(response, 400, { error: 'The verification code is invalid or expired.' });
      return sendJson(response, 200, { user: { id: user.id, email: user.email, role: user.role }, token: issueToken(user) });
    }
    if (url.pathname === '/api/auth/resend-verification' && request.method === 'POST') {
      const { email } = await readBody(request);
      const user = typeof email === 'string' ? await store.getUser(email) : null;
      if (!user || user.email_verified_at) return sendJson(response, 200, { sent: true });
      const code = verificationCode();
      await store.setVerificationCode(user.id, code);
      await sendVerificationEmail(user.email, code);
      return sendJson(response, 200, { sent: true });
    }
    if (url.pathname === '/api/auth/request-password-reset' && request.method === 'POST') {
      const { email } = await readBody(request);
      if (typeof email !== 'string' || !email.includes('@')) return sendJson(response, 400, { error: 'A valid email address is required.' });
      const code = verificationCode();
      const user = await store.setPasswordResetCode(email, code);
      if (user) await sendPasswordResetEmail(user.email, code);
      return sendJson(response, 200, { sent: true });
    }
    if (url.pathname === '/api/auth/reset-password' && request.method === 'POST') {
      const { email, code, password } = await readBody(request);
      if (typeof email !== 'string' || !/^\d{6}$/.test(String(code)) || typeof password !== 'string' || password.length < 8) {
        return sendJson(response, 400, { error: 'A valid email, six-digit code, and password of at least 8 characters are required.' });
      }
      const user = await store.resetPassword(email, String(code), password);
      if (!user) return sendJson(response, 400, { error: 'The reset code is invalid or expired.' });
      for (const [token, session] of sessions) if (session.id === user.id) sessions.delete(token);
      return sendJson(response, 200, { reset: true });
    }
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const { email, password } = await readBody(request);
      const user = store.mode === 'postgres' ? await store.getUser(email) : null;
      if (!user || !(await verifyPassword(password, user.password_hash))) return sendJson(response, 401, { error: 'Invalid email or password.' });
      if (!user.email_verified_at) return sendJson(response, 403, { error: 'Please verify your email before signing in.' });
      return sendJson(response, 200, { user: { id: user.id, email: user.email, role: user.role }, token: issueToken(user) });
    }
    if (url.pathname === '/api/progress' && request.method === 'GET') {
      const user = requireUser(request, response);
      if (!user) return;
      return sendJson(response, 200, await store.getProgress(user.id));
    }
    if (url.pathname === '/api/progress' && request.method === 'PUT') {
      const user = requireUser(request, response);
      if (!user) return;
      const progress = await readBody(request);
      if (!Array.isArray(progress.completedLessons) || !Array.isArray(progress.learnedChords) || !Array.isArray(progress.practicedSongs) || !Number.isInteger(progress.practiceTimeMinutes) || progress.practiceTimeMinutes < 0) {
        return sendJson(response, 400, { error: 'Invalid progress payload.' });
      }
      return sendJson(response, 200, await store.saveProgress(user.id, { completedLessons: progress.completedLessons.map(String), learnedChords: progress.learnedChords.map(String), practicedSongs: progress.practicedSongs.map(String), practiceTimeMinutes: progress.practiceTimeMinutes, currentStreak: Number.isInteger(progress.currentStreak) ? progress.currentStreak : 0, lastPracticeDate: progress.lastPracticeDate || undefined }));
    }
    if (url.pathname === '/api/songs' && request.method === 'GET') {
      const page = Math.max(1, Number(url.searchParams.get('page') || 1));
      const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
      return sendJson(response, 200, await store.list({ query: (url.searchParams.get('q') || '').toLowerCase(), difficulty: url.searchParams.get('difficulty') || '', genre: url.searchParams.get('genre') || '', chord: url.searchParams.get('chord') || '', page, pageSize }));
    }
    const songMatch = url.pathname.match(/^\/api\/songs\/([^/]+)$/);
    if (songMatch && request.method === 'GET') { const song = await store.get(decodeURIComponent(songMatch[1])); return sendJson(response, song ? 200 : 404, song || { error: 'Song not found.' }); }
    if (url.pathname === '/api/admin/songs/import' && request.method === 'POST') {
      if (!requireAdmin(request, response)) return;
      const payload = await readBody(request);
      if (!Array.isArray(payload.songs)) return sendJson(response, 400, { error: 'Expected a songs array.' });
      const imported = [];
      for (const song of payload.songs) imported.push(await store.upsert(song));
      return sendJson(response, 200, { imported: imported.length, songs: imported });
    }
    if (url.pathname === '/api/admin/songs' && request.method === 'POST') {
      if (!requireAdmin(request, response)) return;
      return sendJson(response, 201, await store.upsert(await readBody(request)));
    }
    if (songMatch && request.method === 'PUT') {
      if (!requireAdmin(request, response)) return;
      return sendJson(response, 200, await store.upsert({ ...(await readBody(request)), id: decodeURIComponent(songMatch[1]) }));
    }
    if (songMatch && request.method === 'DELETE') {
      if (!requireAdmin(request, response)) return;
      return sendJson(response, await store.remove(decodeURIComponent(songMatch[1])) ? 204 : 404, {});
    }
    return sendJson(response, 404, { error: 'Not found.' });
  } catch (error) {
    sendJson(response, error.message.includes('required') || error.message.includes('must be') || error.message.includes('invalid') ? 400 : 500, { error: error.message });
  }
});

server.listen(port, () => console.log(`Fretly song API listening on http://localhost:${port} (${store.mode} catalog)`));
