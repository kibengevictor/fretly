const http = require('node:http');
const crypto = require('node:crypto');
const { createStore } = require('./catalogStore');

const port = Number(process.env.PORT || 8787);
const store = createStore();
const sessions = new Map();

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

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === 'OPTIONS') return sendJson(response, 204, {});
    if (url.pathname === '/health') return sendJson(response, 200, { status: 'ok', catalogMode: store.mode });
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      const { email, password } = await readBody(request);
      if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) return sendJson(response, 400, { error: 'Email and a password of at least 8 characters are required.' });
      if (store.mode !== 'postgres') return sendJson(response, 503, { error: 'Accounts require PostgreSQL.' });
      const user = await store.createUser(email, password);
      return sendJson(response, 201, { user: { id: user.id, email: user.email, role: user.role }, token: issueToken(user) });
    }
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const { email, password } = await readBody(request);
      const user = store.mode === 'postgres' ? await store.getUser(email) : null;
      if (!user || !(await verifyPassword(password, user.password_hash))) return sendJson(response, 401, { error: 'Invalid email or password.' });
      return sendJson(response, 200, { user: { id: user.id, email: user.email, role: user.role }, token: issueToken(user) });
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
