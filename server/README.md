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

For PostgreSQL, run `server/schema.sql`, set `DATABASE_URL`, and set a strong `SONG_ADMIN_TOKEN`.
Without `DATABASE_URL`, the server uses the bundled catalog as a local development fallback.

Admin endpoints require `Authorization: Bearer <token>` from an account whose `role` is `admin`:

- `POST /api/admin/songs` creates or updates one song.
- `PUT /api/songs/:id` replaces one song.
- `DELETE /api/songs/:id` removes one song.
- `POST /api/admin/songs/import` imports `{ "songs": [...] }`.

Accounts use `POST /api/auth/register` and `POST /api/auth/login`. Passwords are hashed with Node `scrypt`; the returned bearer token is valid for 12 hours. Promote an account to admin directly in PostgreSQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Run the local mock:

```sh
node server/index.js
```

Then start Expo with:

```sh
EXPO_PUBLIC_SONG_API_URL=http://localhost:8787 npx expo start
```

On a physical device, replace `localhost` with the computer's LAN IP.
