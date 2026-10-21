const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, derived) => error ? reject(error) : resolve(`${salt}:${derived.toString('hex')}`)));
}

function loadLocalSongs() {
  const sourcePath = path.join(__dirname, '..', 'src', 'data', 'songs.ts');
  const source = fs.readFileSync(sourcePath, 'utf8')
    .replace(/^import .*;\s*/m, '')
    .replace(/export const sampleSongs:\s*Song\[\]\s*=/, 'const sampleSongs =');
  const context = {};
  vm.runInNewContext(`${source}\nthis.sampleSongs = sampleSongs;`, context);
  return context.sampleSongs;
}

function normalizeSong(song) {
  if (!song || typeof song !== 'object') throw new Error('Song must be an object.');
  const required = ['id', 'title', 'artist', 'key', 'tempo', 'difficulty', 'genre', 'chart', 'licenseInfo', 'chordIds'];
  for (const field of required) {
    if (song[field] === undefined || song[field] === null || song[field] === '') {
      throw new Error(`Song field "${field}" is required.`);
    }
  }
  if (!['beginner', 'intermediate', 'advanced'].includes(song.difficulty)) throw new Error('Invalid song difficulty.');
  if (!Number.isInteger(song.tempo) || song.tempo < 30 || song.tempo > 300) throw new Error('Tempo must be an integer between 30 and 300.');
  if (!Array.isArray(song.chordIds)) throw new Error('chordIds must be an array.');
  return {
    id: String(song.id), title: String(song.title), artist: String(song.artist), key: String(song.key),
    tempo: song.tempo, difficulty: song.difficulty, genre: String(song.genre), chart: String(song.chart),
    licenseInfo: String(song.licenseInfo), chordIds: song.chordIds.map(String),
    downloadable: Boolean(song.downloadable), sections: song.sections ?? undefined,
  };
}

function createStore() {
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      return {
        mode: 'postgres',
        async list({ query, difficulty, genre, chord, page, pageSize }) {
          const values = [];
          const where = [];
          if (query) { values.push(`%${query}%`); where.push(`(title ILIKE $${values.length} OR artist ILIKE $${values.length} OR genre ILIKE $${values.length} OR chart ILIKE $${values.length})`); }
          if (difficulty) { values.push(difficulty); where.push(`difficulty = $${values.length}`); }
          if (genre) { values.push(genre); where.push(`genre = $${values.length}`); }
          if (chord) { values.push(chord); where.push(`chord_ids ? $${values.length}`); }
          const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
          const count = await pool.query(`SELECT COUNT(*)::int AS total FROM songs ${clause}`, values);
          values.push(pageSize, (page - 1) * pageSize);
          const rows = await pool.query(`SELECT id,title,artist,key,tempo,difficulty,genre,chart,license_info AS "licenseInfo",chord_ids AS "chordIds",downloadable,sections FROM songs ${clause} ORDER BY updated_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
          return { songs: rows.rows, total: count.rows[0].total, page, pageSize, hasMore: page * pageSize < count.rows[0].total };
        },
        async get(id) { const result = await pool.query('SELECT id,title,artist,key,tempo,difficulty,genre,chart,license_info AS "licenseInfo",chord_ids AS "chordIds",downloadable,sections FROM songs WHERE id = $1', [id]); return result.rows[0] ?? null; },
        async upsert(song) { const s = normalizeSong(song); await pool.query(`INSERT INTO songs (id,title,artist,key,tempo,difficulty,genre,chart,license_info,chord_ids,downloadable,sections) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,artist=EXCLUDED.artist,key=EXCLUDED.key,tempo=EXCLUDED.tempo,difficulty=EXCLUDED.difficulty,genre=EXCLUDED.genre,chart=EXCLUDED.chart,license_info=EXCLUDED.license_info,chord_ids=EXCLUDED.chord_ids,downloadable=EXCLUDED.downloadable,sections=EXCLUDED.sections,updated_at=NOW()`, [s.id,s.title,s.artist,s.key,s.tempo,s.difficulty,s.genre,s.chart,s.licenseInfo,JSON.stringify(s.chordIds),s.downloadable,s.sections ? JSON.stringify(s.sections) : null]); return s; },
        async remove(id) { const result = await pool.query('DELETE FROM songs WHERE id = $1', [id]); return result.rowCount > 0; },
        async createUser(email, password) { const passwordHash = await hashPassword(password); const result = await pool.query('INSERT INTO users (email,password_hash) VALUES ($1,$2) RETURNING id,email,role,password_hash', [email.toLowerCase(), passwordHash]); return result.rows[0]; },
        async getUser(email) { const result = await pool.query('SELECT id,email,role,password_hash FROM users WHERE email = $1', [email.toLowerCase()]); return result.rows[0] ?? null; },
      };
    } catch (error) {
      console.warn(`PostgreSQL unavailable; using local catalog fallback. ${error.message}`);
    }
  }
  const songs = loadLocalSongs().map(normalizeSong);
  return {
    mode: 'local',
    async list({ query, difficulty, genre, chord, page, pageSize }) {
      const filtered = songs.filter((song) => (!difficulty || song.difficulty === difficulty) && (!genre || song.genre.toLowerCase() === genre.toLowerCase()) && (!chord || song.chordIds.includes(chord)) && (!query || `${song.title} ${song.artist} ${song.genre} ${song.chordIds.join(' ')}`.toLowerCase().includes(query)));
      const start = (page - 1) * pageSize;
      return { songs: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize, hasMore: start + pageSize < filtered.length };
    },
    async get(id) { return songs.find((song) => song.id === id) ?? null; },
    async upsert(song) { const normalized = normalizeSong(song); const index = songs.findIndex((item) => item.id === normalized.id); if (index === -1) songs.push(normalized); else songs[index] = normalized; return normalized; },
    async remove(id) { const index = songs.findIndex((song) => song.id === id); if (index === -1) return false; songs.splice(index, 1); return true; },
    async createUser() { throw new Error('Accounts require PostgreSQL.'); },
    async getUser() { return null; },
  };
}

module.exports = { createStore, normalizeSong };
