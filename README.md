# Bobcat Bulletin

A real-time campus safety dashboard for UC Merced, powered by the [UC Merced Police Department daily activity logs](https://police.ucmerced.edu/daily-activity-logs).

## Features

- **23,000+ incidents** scraped from the past year, updated twice daily via GitHub Actions
- **Filter by category** — Medical, Traffic, Theft, Alarm, Welfare, Patrol, Assault, Disturbance, Suspicious, Vandalism, Drug/Alcohol, Lost/Found
- **Exclude incident types** — hide noise like routine patrol checks with a searchable dropdown
- **Search** — full-text across incident type, location, disposition, and report number
- **Date range** — narrow to any custom window
- **Stats bar** — total incidents, this month, this week, and top category at a glance
- **Incident detail pages** — full incident view with related incidents at the same location
- **Anonymous comments** — per-incident community notes, auto-approved with personal-info screening
- **Feedback** — suggestions, questions, and removal requests via in-app form
- **Admin panel** — `/admin` page to review flagged comments and feedback (key-protected)
- **Dark mode** design with UC Merced branding

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite |
| Scraper | `curl-cffi` (Chrome TLS impersonation) + BeautifulSoup4 |
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query, React Router |
| Deployment | Backend → Fly.io · Frontend → Vercel |
| CI/CD | GitHub Actions (auto-deploy on push, scheduled scrape) |

## Deployment Architecture

```
GitHub Actions (cron: twice daily)
  └─ scripts/scrape_and_push.py → POST /api/incidents  →  Fly.io (backend + SQLite)
                                                               ↑
                                                   Vercel (frontend, SPA)
```

The scraper runs in GitHub Actions twice a day (8 AM and 8 PM PST) instead of in-process, so the backend VM can stay small (256 MB). `curl-cffi` impersonates Chrome's TLS fingerprint to bypass the Akamai WAF on the UCMPD site.

## Quick Start (Docker)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- Docker Compose plugin

```bash
git clone https://github.com/L4wson/bobcat-bulletin.git
cd bobcat-bulletin
make dev     # builds images, starts services, streams logs
```

Open **http://localhost:5173** in your browser.

The first startup scrapes the past 12 months (~23k incidents) which takes about 30 seconds. Subsequent startups are instant.

### Commands

```bash
make dev      # build + start with live logs (Ctrl-C to stop)
make up       # start in background
make down     # stop
make logs     # follow logs
make scrape   # trigger a manual scrape right now
make clean    # remove containers AND the database volume (destructive)
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DB_PATH` | `/data/bobcat.db` | SQLite database path inside the container |
| `SCRAPE_INTERVAL_HOURS` | `6` | In-process scrape interval (Docker mode only) |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS origins |
| `ADMIN_KEY` | — | Secret key required for admin API endpoints |

For production (Fly.io), secrets are set via `flyctl secrets set` and are not stored in the repo.

## API Reference

The backend exposes a REST API at `http://localhost:8000`.

See [docs/api.md](docs/api.md) for the full endpoint reference.

## Project Structure

```
bobcat-bulletin/
├── backend/
│   ├── main.py          # FastAPI app, endpoints, startup
│   ├── scraper.py       # HTTP fetching + parsing + categorization
│   ├── moderation.py    # Personal-info screener for anonymous comments
│   ├── models.py        # SQLAlchemy ORM models
│   ├── database.py      # Engine + session factory
│   ├── fly.toml         # Fly.io deployment config
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Incident feed with filters
│   │   │   ├── IncidentDetail.jsx # Single incident + related + comments
│   │   │   └── Admin.jsx          # Moderation dashboard
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── StatsBar.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── MobileFilterDrawer.jsx
│   │   │   ├── ExcludeTypes.jsx
│   │   │   ├── IncidentCard.jsx
│   │   │   ├── CommentsSection.jsx
│   │   │   ├── FeedbackModal.jsx
│   │   │   ├── HelpModal.jsx
│   │   │   └── Pagination.jsx
│   │   ├── hooks/
│   │   │   ├── useFilterState.js
│   │   │   └── useLocalStorage.js
│   │   └── lib/
│   │       ├── api.js
│   │       ├── categories.js
│   │       └── format.js
│   ├── vercel.json      # SPA rewrite rule
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── scripts/
│   └── scrape_and_push.py  # Standalone scraper for GitHub Actions
├── .github/workflows/
│   ├── deploy-backend.yml  # Auto-deploy to Fly.io on push
│   └── scrape.yml          # Scheduled scrape (twice daily)
├── docker-compose.yml
├── Makefile
└── docs/
    └── api.md
```

## Comment Moderation

Anonymous comments are auto-approved unless the screener (`moderation.py`) detects personal information: email addresses, phone numbers, social media handles, honorifics + names, or common first names mid-sentence. Flagged comments go to a moderator queue at `/admin` and are never shown publicly until approved.

## Data Source

All data is sourced from the [UC Merced Police Department Daily Activity Logs](https://police.ucmerced.edu/daily-activity-logs). Bobcat Bulletin is not affiliated with or endorsed by the UC Merced Police Department.

## License

MIT
