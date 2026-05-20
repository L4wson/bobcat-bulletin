# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Compose                      │
│                                                         │
│  ┌──────────────────────┐   ┌───────────────────────┐  │
│  │  frontend (Node 20)  │   │  backend (Python 3.11) │  │
│  │  Vite dev server     │   │  FastAPI + Uvicorn     │  │
│  │  :5173               │◄──│  :8000                 │  │
│  └──────────────────────┘   │                        │  │
│                             │  APScheduler           │  │
│                             │  (every 6 hours)       │  │
│                             │       │                │  │
│                             │  SQLite (/data/*.db)   │  │
│                             └────────────────────────┘  │
│                                      │                  │
└──────────────────────────────────────┼──────────────────┘
                                       │ scrapes
                         ┌─────────────▼──────────────┐
                         │  police.ucmerced.edu        │
                         │  /daily-activity-logs/YYYY-MM│
                         └─────────────────────────────┘
```

## Backend

### Startup flow

1. `Base.metadata.create_all()` — creates `incidents` and `scrape_log` tables if they don't exist.
2. `startup_scrape()` calls `scrape_past_year()`, which walks back 13 months.  
   - Months already present in `scrape_log` are skipped, so restarts are cheap.
3. APScheduler starts a background job that calls `scrape_recent()` every 6 hours.

### Scraper (`scraper.py`)

`fetch_month_text(year, month)` — fetches the HTML page for a given month and extracts the plain-text log content using a list of Drupal CSS selectors tried in order of specificity.

`parse_log_text(text)` — parses the extracted text line by line:
- Recognises date headers (`MM/DD/YYYY`)
- Recognises incident header lines (`HH:MM  <type>  <10-digit case number>`)
- Collects body lines until the next separator or header
- Extracts `Disposition:` from the body tail
- Calls `categorize()` to assign a broad category

`categorize(incident_type)` — maps raw incident types to one of 11 broad categories using keyword matching.

Duplicate prevention: a `seen` set within each `scrape_month` call prevents duplicate inserts from the same page. The `scrape_log` table prevents re-scraping already-fetched months.

### API (`main.py`)

Standard FastAPI with SQLAlchemy ORM queries. All filtering is done in SQL. Pagination is offset-based.

## Frontend

### Data fetching

TanStack Query manages all server state with a 5-minute stale time and 5-minute refetch interval. The `fetchJSON` helper builds URLs from a params object, supporting both scalar and array values (for `exclude_type` repeated params).

### Filter state

A single `filters` object in `App.jsx` holds all active filters:

```js
{
  category: "",        // broad category name or ""
  search: "",          // free-text search
  start_date: "",      // ISO date string
  end_date: "",        // ISO date string
  exclude_types: [],   // array of incident type strings
  page: 1
}
```

Changing any filter resets `page` to 1 and scrolls to the top.

### Category colours

`src/lib/categories.js` maps each of the 11 categories to a set of Tailwind colour classes and a hex dot colour. Cards use a left border coloured by category; badges use the background/text/border classes.

## Data model

```sql
CREATE TABLE incidents (
  id            INTEGER PRIMARY KEY,
  case_number   TEXT UNIQUE,          -- e.g. "2605190011"
  date          DATE,                 -- parsed from log header
  time          TEXT,                 -- "HH:MM" 24-hour
  incident_type TEXT,                 -- raw type from log
  category      TEXT,                 -- normalised broad category
  location      TEXT,                 -- body text before "Disposition:"
  disposition   TEXT,                 -- outcome
  scraped_at    DATETIME DEFAULT now()
);

CREATE TABLE scrape_log (
  id              INTEGER PRIMARY KEY,
  year_month      TEXT,               -- "YYYY-MM"
  incidents_added INTEGER,
  scraped_at      DATETIME DEFAULT now()
);
```

## Scaling notes

The current setup (SQLite + single-container backend) is sufficient for ~50k incidents and multiple concurrent readers. If the dataset grows significantly or write contention increases, migrating to PostgreSQL is straightforward — change `DATABASE_URL` in `docker-compose.yml` to a `postgresql://` URI and update `requirements.txt` to include `psycopg2-binary`.
