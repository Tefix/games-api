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
