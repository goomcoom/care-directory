# Care Directory

**Live demo:** https://goomcoom.github.io/care-directory/ (runs in simulated mode, no API calls are made)

A prototype directory assistant for local health services. You describe what you need in plain words ("a pharmacy open late tonight", "a dentist taking NHS patients", "I've cut my hand") and an AI agent searches a seeded directory for the fictional town of Ashford Vale and directs you to the best providers. The app sells nothing and books nothing; it only points you to where to go.

Sibling of [Doctor's Secretary](https://github.com/goomcoom/doctors-secretary), built with the same stack and conventions.

## What it does

- **Find** (`/find`): a chat with the assistant. Each turn, Claude is given a `search_providers` tool over the directory, calls it as many times as it needs (the searches are shown as steps), then replies with prose plus up to four recommended providers with a reason for each. It asks a clarifying question when it needs to know which part of town you are in, adds a 999/A&E safety line for possible emergencies, and declines requests that are not about health services.
- **Directory** (`/directory`): browse every provider with filters for service, area, open now, NHS, walk-in and step-free access. The schematic map filters by district.
- **Provider** (`/directory/:id`): details, opening hours, position on the map and other services in the same district.

All providers are placeholders (Pharmacy A, Dental Practice B, Dr X's Practice) in a fictional town with six districts. Phone numbers use Ofcom's reserved drama range.

## Running it

```bash
cp .env.example .env
# add your key to .env: ANTHROPIC_API_KEY=sk-ant-...
npm install
npm run dev
```

The web app runs on http://localhost:5174 and the API on http://localhost:3002 (so it can run beside Doctor's Secretary on 5173/3001).

### Simulated mode

If no key is configured, or the server is not running at all (for example a static deployment of `dist/`), the app switches to **simulated mode** and a "Simulated AI" badge appears in the top bar. A small intent parser maps the request to the same `searchProviders()` call the live agent would make, runs it against the same directory, and templates a reply, so recommendations stay consistent between modes. Clarifying questions, the emergency path and out-of-scope requests are all handled. Set `VITE_SIMULATE=true` in `.env` to force simulated mode even with a key.

"Open now" is judged on the clock you send (Europe/London), so results change with the time of day. Only Pharmacy C is open late; only Dental Practice B takes new NHS patients; the Urgent Treatment Centre is open 24 hours.

The conversation lives in the browser's localStorage. Use **Reset** in the top bar to clear it.

## Stack

- React 18 + Vite + TypeScript, plain CSS with design tokens, `lucide-react` icons, `react-router-dom`. The map is inline SVG drawn from coordinates in the seed data; there is no map provider.
- `shared/` holds the types, zod schemas, seeded directory and search function, imported by both the client and the server.
- A small Express server holds the API key and exposes `POST /api/chat`, which runs the agent loop: `@anthropic-ai/sdk` `messages.parse` with a `search_providers` tool and a `zodOutputFormat` structured answer, looping on `tool_use` until Claude answers. Model is `claude-opus-5`; override with `CLAUDE_MODEL` in `.env`.

## Deploying

Pushes to `main` are built and published to GitHub Pages by `.github/workflows/deploy.yml`. The build sets `VITE_BASE=/care-directory/` so assets and routes resolve under the repository sub-path, and copies `index.html` to `404.html` so deep links into the single-page app load. With no server behind it the site runs in simulated mode.

## Layout

```
shared/   types, zod schemas, seeded directory, search (client + server)
server/   express app, Claude agent loop, system prompt
src/      React app: pages, components, store (localStorage), simulated agent
```
