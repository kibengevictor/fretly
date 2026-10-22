# Fretly song API contract

The mobile app can load the remote catalog when `EXPO_PUBLIC_SONG_API_URL` is set.

## Endpoint

`GET /api/songs`

Query parameters:

- `q`: title, artist, genre, or chord search
- `difficulty`: `beginner`, `intermediate`, or `advanced`
- `page`: 1-based page number
- `pageSize`: 1-100

Response:

```json
{
  "songs": [],
  "total": 0,
  "page": 1,
  "pageSize": 20,
  "hasMore": false
}
```

`GET /api/songs/:id` returns one song or `404` when it is not in the catalog.

Each song uses the `Song` shape in `src/types/index.ts`. `sections` is optional; when present it contains lyric sections whose lines have `chords` and `lyrics`.

## Database and admin API

For PostgreSQL, run `server/schema.sql`, set `DATABASE_URL`, and configure Gmail SMTP with `SMTP_USER` and `SMTP_PASSWORD` (a Gmail App Password). Set a strong `SONG_ADMIN_TOKEN`.
Without `DATABASE_URL`, the server uses the bundled catalog as a local development fallback.

Admin endpoints require `Authorization: Bearer <token>` from an account whose `role` is `admin`:

- `POST /api/admin/songs` creates or updates one song.
- `PUT /api/songs/:id` replaces one song.
- `DELETE /api/songs/:id` removes one song.
- `POST /api/admin/songs/import` imports `{ "songs": [...] }`.

Accounts use `POST /api/auth/register`, `POST /api/auth/verify-email`, and `POST /api/auth/login`. Registration sends a six-digit code through Gmail SMTP. Configure `SMTP_USER` and `SMTP_PASSWORD`; codes expire after 15 minutes. Passwords are hashed with Node `scrypt`; the returned bearer token is valid for 12 hours. Promote an account to admin directly in PostgreSQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Password recovery uses `POST /api/auth/request-password-reset` and `POST /api/auth/reset-password`. Reset codes are sent through Gmail SMTP, expire after 15 minutes, and all active sessions are invalidated after a successful password change.

Authenticated progress endpoints:

- `GET /api/progress`
- `PUT /api/progress`

Progress sync includes completed lessons, learned chords, practiced songs, practice minutes, streak, and last practice date.

Run the local mock:

```sh
node server/index.js
```

Then start Expo with:

```sh
EXPO_PUBLIC_SONG_API_URL=http://localhost:8787 npx expo start
```

On a physical device, replace `localhost` with the computer's LAN IP.

The API also needs these variables when account verification is enabled:

```sh
DATABASE_URL=postgresql://...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM_EMAIL=your-gmail@gmail.com
EXPO_PUBLIC_SONG_API_URL=http://localhost:8787
```
