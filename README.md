# games-api

REST API for managing a games catalogue, built with **Node.js** and **Express**, with interactive **Swagger** documentation and role-based access.

## Endpoints
| Method | Route | Access |
|---|---|---|
| GET | `/games` | public |
| GET | `/games/:id` | public |
| POST | `/games` | authenticated |
| PUT | `/games/:id` | admin |
| DELETE | `/games/:id` | admin |
| POST | `/auth/register` | public |
| POST | `/auth/login` | public |
| POST | `/auth/logout` | authenticated |
| GET | `/users` | admin |
| PUT | `/users/:id/role` | admin |
| DELETE | `/users/:id` | admin |

Interactive docs are served at `/docs`.

## Authentication
Register with `POST /auth/register`, then log in with `POST /auth/login` to get a token (valid for 1 hour)
and send it as `Authorization: Bearer <token>`. Passwords are hashed with scrypt and tokens are random
values generated with Node's built-in `crypto`, so no extra dependencies are needed.

Two demo accounts are created at startup from `.env` (copied from `.env.example`):

| Role | Username | Password |
|---|---|---|
| admin | `admin` | `Adm1n-Games-2026` |
| user | `user` | `Us3r-Games-2026` |

> This is a study project, so the demo credentials are published here on purpose. Never do this in a real project.

## Quick test guide

Start the server (`npm start`) and open **http://localhost:8080/docs**.

### In Swagger UI
1. Open `POST /auth/login`, click **Try it out**, send `{"username": "admin", "password": "Adm1n-Games-2026"}` and copy the `token` from the response.
2. Click **Authorize** (top right), paste `Bearer <token>` and confirm. Now the lock icons on protected routes are closed.
3. Try the protected routes (`POST /games`, `PUT`/`DELETE /games/{id}`, `/users`).
4. To check the `user` role, log in as `user` / `Us3r-Games-2026` and authorize with that token instead. `PUT`/`DELETE` and `/users` must return `403`.

### With curl
```bash
# log in and keep the token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login   -H "Content-Type: application/json"   -d '{"username":"admin","password":"Adm1n-Games-2026"}' | sed -E 's/.*"token":"([^"]+)".*//')

# public: list games
curl http://localhost:8080/games

# authenticated: add a game
curl -X POST http://localhost:8080/games   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"name":"Hades","price":24.5}'

# admin only: update and delete
curl -X PUT http://localhost:8080/games/1   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"name":"Witcher 3 GOTY","price":19}'
curl -X DELETE http://localhost:8080/games/1 -H "Authorization: Bearer $TOKEN"
```

### Expected status codes
| Situation | Status |
|---|---|
| No token on a protected route, or token expired / logged out | `401` |
| Logged in as `user` on an admin route | `403` |
| Wrong login or password | `401` |
| Missing fields or invalid values (e.g. negative price, short password) | `400` |
| Game or user not found | `404` |
| Duplicate game title or username | `409` |

### Troubleshooting
- **`401` right after it worked before:** tokens live for 1 hour and are dropped on logout, user deletion and server restart. Log in again.
- **Admin cannot log in:** make sure `.env` exists (`cp .env.example .env`) and the server was restarted after changing it.
- **Port already in use:** change `PORT` in `.env`.
- **Data disappeared:** games and users are stored in memory and reset on every restart.

## Getting started
```bash
git clone https://github.com/Tefix/games-api.git
cd games-api
npm install
cp .env.example .env
npm start
```

Data is kept in memory and resets on restart.

## Tech stack
Node.js · Express 5 · Swagger UI · dotenv
