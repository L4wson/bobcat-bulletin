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

## `GET /api/incidents/{case_number}`

Returns a single incident plus up to six related incidents (same location, within ±30 days). Returns `404` if the case number is unknown.

### Response

```json
{
  "incident": {
    "id": 962,
    "case_number": "2605190011",
    "date": "2026-05-19",
    "time": "06:20",
    "incident_type": "Alarm",
    "category": "Alarm",
    "location": "Officer initiated activity at Ucmpd, Services Ln, Merced, CA. Accidental trip",
    "disposition": "False Alarm"
  },
  "related": []
}
```

---

## `GET /api/incidents/{case_number}/comments`

Returns approved anonymous comments for an incident, oldest first. Pending and rejected comments are never exposed.

### Response

```json
[
  {
    "id": 3,
    "case_number": "2605190011",
    "body": "I was in the building when this happened — it was a burnt bagel in the second-floor kitchen.",
    "submitted_at": "2026-07-12T21:14:02"
  }
]
```

---

## `POST /api/incidents/{case_number}/comments`

Submits an anonymous comment. Comments start as `pending` and only appear publicly after a moderator approves them. Rate limited to 5 per hour per IP. Body must be 10–1000 characters. Returns `404` if the case number is unknown.

### Request Body

```json
{ "body": "What you know about this incident." }
```

The optional `website` field is a honeypot — leave it empty (bots that fill it get a fake success and the comment is discarded).

### Response

```json
{ "ok": true, "status": "pending" }
```

---

## `GET /api/admin/comments` 🔒

Lists comments by moderation status. Requires the `X-Admin-Key` header.

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `status` | string | `pending` | One of `pending`, `approved`, `rejected`. |

### Example

```bash
curl -H "X-Admin-Key: $ADMIN_KEY" "http://localhost:8000/api/admin/comments?status=pending"
```

---

## `POST /api/admin/comments/{id}` 🔒

Approves or rejects a comment. Requires the `X-Admin-Key` header.

### Request Body

```json
{ "action": "approve" }
```

`action` is `approve` or `reject`.

### Example

```bash
curl -X POST -H "X-Admin-Key: $ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"action":"approve"}' http://localhost:8000/api/admin/comments/3
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
