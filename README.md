# Bobcat Bulletin

A real-time campus activity dashboard for UC Merced, powered by the [UC Merced Police Department daily activity logs](https://police.ucmerced.edu/daily-activity-logs).

![Dark mode dashboard showing incident cards, category filters, and stats bar](docs/screenshot-placeholder.md)

## Features

- **23,000+ incidents** loaded from the past year, updated every 6 hours automatically
- **Filter by category** — Medical, Traffic, Theft, Alarm, Welfare, Patrol, Disturbance, Suspicious, Vandalism, Drug/Alcohol, Lost/Found
- **Exclude incident types** — hide noise like routine patrol checks with a searchable dropdown
- **Search** — full-text across incident type, location, disposition, and report number
- **Date range** — narrow to any custom window
- **Stats bar** — total incidents, this month, this week, and top category at a glance
- **Auto-refresh** — frontend polls every 5 minutes; manual "Refresh" button triggers an immediate scrape
- **Dark mode** design with UC Merced branding

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite |
| Scraper | `requests` + `BeautifulSoup4`, APScheduler (6-hour interval) |
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query |
| Deployment | Docker + Docker Compose |

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- Docker Compose plugin — if missing, the `make setup` step installs it

```bash
git clone https://github.com/L4wson/bobcat-bulletin.git
cd bobcat-bulletin
make setup   # installs the Docker Compose plugin if needed
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

Environment variables are set in `docker-compose.yml`:

| Variable | Default | Description |
|---|---|---|
| `DB_PATH` | `/data/bobcat.db` | Path to the SQLite database inside the container |
| `SCRAPE_INTERVAL_HOURS` | `6` | How often to check for new log data |

## API Reference

The backend exposes a REST API at `http://localhost:8000`.

See [docs/api.md](docs/api.md) for the full endpoint reference.

## Project Structure

```
bobcat-bulletin/
├── backend/
│   ├── main.py          # FastAPI app, startup, scheduler
│   ├── scraper.py       # HTTP fetching + text parsing + categorization
│   ├── models.py        # SQLAlchemy ORM models
│   ├── database.py      # Engine + session factory
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── StatsBar.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── ExcludeTypes.jsx
│   │   │   ├── IncidentCard.jsx
│   │   │   └── Pagination.jsx
│   │   └── lib/
│   │       ├── api.js
│   │       └── categories.js
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
└── docs/
    └── api.md
```

## Data Source

All data is sourced from the [UC Merced Police Department Daily Activity Logs](https://police.ucmerced.edu/daily-activity-logs). Bobcat Bulletin is not affiliated with or endorsed by the UC Merced Police Department.

## License

MIT
