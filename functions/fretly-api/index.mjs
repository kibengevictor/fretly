import crypto from "node:crypto";
import nodemailer from "nodemailer";
import storeModule from "./catalogStore.cjs";
const { createStore } = storeModule;
const store = createStore();
const sessions = new Map();

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  },
});

const code = () => String(crypto.randomInt(100000, 1000000));
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const passwordHash = (password, salt = crypto.randomBytes(16).toString("hex")) =>
  new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, derived) =>
    error ? reject(error) : resolve(`${salt}:${derived.toString("hex")}`)));
const verifyPassword = (password, stored) => {
  const [salt, expected] = stored.split(":");
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, derived) => {
    if (error) return reject(error);
    resolve(crypto.timingSafeEqual(Buffer.from(expected, "hex"), derived));
  }));
};

async function sendEmail(to, subject, resetCode) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("Email delivery is not configured.");
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    text: `Your Fretly code is ${resetCode}. It expires in 15 minutes.`,
  });
}

function sessionUser(request) {
  const value = request.headers.get("authorization") || "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : "";
  const session = sessions.get(token);
  return session && session.expiresAt > Date.now() ? session : null;
}

function issueToken(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { ...user, expiresAt: Date.now() + 43200000 });
  return token;
}

const userResponse = (user) => ({ id: user.id, email: user.email, role: user.role });

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return json({}, 204);
    const url = new URL(request.url);
    try {
      if (url.pathname === "/health") return json({ status: "ok", catalogMode: store.mode });
      if (url.pathname === "/api/songs" && request.method === "GET") {
        const page = Math.max(1, Number(url.searchParams.get("page") || 1));
        const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 20)));
        return json(await store.list({
          query: (url.searchParams.get("q") || "").toLowerCase(),
          difficulty: url.searchParams.get("difficulty") || "",
          genre: url.searchParams.get("genre") || "",
          chord: url.searchParams.get("chord") || "",
          page,
          pageSize,
        }));
      }
      const songMatch = url.pathname.match(/^\/api\/songs\/([^/]+)$/);
      if (songMatch && request.method === "GET") {
        const song = await store.get(decodeURIComponent(songMatch[1]));
        return json(song || { error: "Song not found." }, song ? 200 : 404);
      }
      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        const { email, password } = await request.json();
        if (typeof email !== "string" || typeof password !== "string" || password.length < 8) {
          return json({ error: "Email and a password of at least 8 characters are required." }, 400);
        }
        if (store.mode !== "postgres") return json({ error: "Accounts require PostgreSQL." }, 503);
        if (await store.getUser(email)) return json({ error: "An account with that email already exists." }, 409);
        const verificationCode = code();
        const user = await store.createUser(email, password, verificationCode);
        await sendEmail(user.email, "Verify your Fretly account", verificationCode);
        return json({ verificationRequired: true, email: user.email }, 201);
      }
      if (url.pathname === "/api/auth/verify-email" && request.method === "POST") {
        const { email, code: verificationCode } = await request.json();
        const user = await store.verifyEmail(email, String(verificationCode));
        if (!user) return json({ error: "The verification code is invalid or expired." }, 400);
        return json({ user: userResponse(user), token: issueToken(user) });
      }
      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        const { email, password } = await request.json();
        const user = await store.getUser(email);
        if (!user || !(await verifyPassword(password, user.password_hash))) return json({ error: "Invalid email or password." }, 401);
        if (!user.email_verified_at) return json({ error: "Please verify your email before signing in." }, 403);
        return json({ user: userResponse(user), token: issueToken(user) });
      }
      if (url.pathname === "/api/progress" && request.method === "GET") {
        const user = sessionUser(request);
        if (!user) return json({ error: "Authentication required." }, 401);
        return json(await store.getProgress(user.id));
      }
      if (url.pathname === "/api/progress" && request.method === "PUT") {
        const user = sessionUser(request);
        if (!user) return json({ error: "Authentication required." }, 401);
        const progress = await request.json();
        if (!Array.isArray(progress.completedLessons) || !Array.isArray(progress.learnedChords) || !Array.isArray(progress.practicedSongs) || !Number.isInteger(progress.practiceTimeMinutes) || progress.practiceTimeMinutes < 0) {
          return json({ error: "Invalid progress payload." }, 400);
        }
        return json(await store.saveProgress(user.id, {
          completedLessons: progress.completedLessons.map(String),
          learnedChords: progress.learnedChords.map(String),
          practicedSongs: progress.practicedSongs.map(String),
          practiceTimeMinutes: progress.practiceTimeMinutes,
          currentStreak: Number.isInteger(progress.currentStreak) ? progress.currentStreak : 0,
          lastPracticeDate: progress.lastPracticeDate || undefined,
        }));
      }
      return json({ error: "Not found." }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: error.message }, /required|invalid|must be/i.test(error.message) ? 400 : 500);
    }
  },
};
