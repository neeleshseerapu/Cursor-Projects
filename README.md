# Local UCLA Todo Server

Run a local Node server that stores todos per-username as JSON files under `data/`.

## Quick start

1. Install deps

```
cd /workspace
npm install
```

2. Start the server

```
npm run dev
```

This starts on `http://localhost:3001`.

## API

- GET `/api/users/:username/todos` → `[Todo]`
- PUT `/api/users/:username/todos` with JSON body `[Todo]` → persisted

Notes:
- Each user is stored at `data/:username.json`.
- No auth. Username is case-sensitive.

## Frontend

Open `todo/index.html` in a browser. Use the user switcher in the header to choose a username.
