# API Reference

Base URL: `http://localhost:8000`

All endpoints return JSON.

---

## `GET /api/incidents`

Returns a paginated list of incidents.

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `category` | string | — | Filter by broad category (e.g. `Medical`, `Traffic`, `Theft`). Case-insensitive. Pass `all` or omit to skip. |
| `incident_type` | string | — | Filter to an exact incident type (e.g. `Vehicle Stop`). Case-insensitive. |
| `exclude_type` | string (repeatable) | — | Exclude one or more incident types. Repeat the parameter for multiple values. |
| `search` | string | — | Full-text search across `incident_type`, `location`, `disposition`, and `case_number`. |
| `start_date` | date (`YYYY-MM-DD`) | — | Only return incidents on or after this date. |
| `end_date` | date (`YYYY-MM-DD`) | — | Only return incidents on or before this date. |
| `page` | integer ≥ 1 | `1` | Page number (1-indexed). |
| `per_page` | integer 1–200 | `50` | Results per page. |

### Response

```json
{
  "total": 23048,
  "page": 1,
  "per_page": 50,
  "pages": 461,
  "incidents": [
    {
      "id": 962,
      "case_number": "2605190011",
      "date": "2026-05-19",
      "time": "06:20",
      "incident_type": "Alarm",
      "category": "Alarm",
      "location": "Officer initiated activity at Ucmpd, Services Ln, Merced, CA. Accidental trip",
      "disposition": "False Alarm"
    }
  ]
}
```

### Examples

```bash
# All incidents, page 1
curl http://localhost:8000/api/incidents

# Medical incidents this month
curl "http://localhost:8000/api/incidents?category=Medical&start_date=2026-05-01"

# Exclude routine patrols and area checks
curl "http://localhost:8000/api/incidents?exclude_type=Building%2FArea+Check&exclude_type=Foot+Patrol"

# Search by report number
curl "http://localhost:8000/api/incidents?search=2605190011"

# Full-text search
curl "http://localhost:8000/api/incidents?search=granite+pass"
```

---

## `GET /api/categories`

Returns all incident categories with counts, sorted by frequency.

### Response

```json
[
  { "name": "Patrol",   "count": 14445 },
  { "name": "Other",    "count": 1877  },
  { "name": "Traffic",  "count": 845   }
]
```

---

## `GET /api/incident-types`

Returns all distinct incident types with their category and count.

### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `category` | string | Optionally filter to types within a category. |

### Response

```json
[
  { "name": "Building/Area Check", "category": "Patrol", "count": 14310 },
  { "name": "Vehicle Stop",        "category": "Traffic", "count": 712   }
]
```

---

## `GET /api/stats`

Returns high-level summary statistics.

### Response

```json
{
  "total": 23048,
  "this_week": 39,
  "this_month": 962,
  "top_category": "Patrol",
  "last_updated": "2026-05-20T00:38:06"
}
```

---

## `POST /api/scrape`

Triggers an immediate scrape of the current month and the previous month. Useful for pulling in data without waiting for the scheduled 6-hour interval.

### Response

```json
{ "message": "Scrape complete. 12 new incidents added." }
```

---

## `GET /api/health`

Liveness probe used by Docker Compose.

### Response

```json
{ "status": "ok" }
```
