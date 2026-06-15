import re
import logging
from datetime import date, datetime, timedelta

from bs4 import BeautifulSoup
from curl_cffi import requests as cffi_requests
from sqlalchemy.orm import Session

from models import Incident, ScrapeLog

logger = logging.getLogger(__name__)

_session = cffi_requests.Session()

BASE_URL = "https://police.ucmerced.edu/daily-activity-logs"

CATEGORY_MAP = [
    ("Medical",      ["medical", "injury", "first aid", "sick", "ems", "ambulance"]),
    ("Traffic",      ["vehicle stop", "traffic", "dui", "hit and run", "parking", "collision"]),
    ("Theft",        ["theft", "burglary", "robbery", "stolen", "larceny", "fraud", "embezzle"]),
    ("Welfare",      ["welfare check", "missing", "suicid", "mental health", "crisis"]),
    ("Alarm",        ["alarm"]),
    ("Patrol",       ["building/area check", "area check", "foot patrol", "security check"]),
    ("Assault",      ["assault", "battery", "fight"]),
    ("Disturbance",  ["disturbance", "domestic", "noise"]),
    ("Suspicious",   ["suspicious", "prowler", "trespass"]),
    ("Vandalism",    ["vandal", "graffiti", "damage to property"]),
    ("Drug/Alcohol", ["drug", "narcotic", "controlled substance", "marijuana", "alcohol",
                      "drunk", "intoxicat", "dui"]),
    ("Lost/Found",   ["lost", "found property"]),
]


def categorize(incident_type: str) -> str:
    t = incident_type.lower()
    for category, keywords in CATEGORY_MAP:
        if any(k in t for k in keywords):
            return category
    return "Other"


def fetch_month_text(year: int, month: int) -> str | None:
    url = f"{BASE_URL}/{year:04d}-{month:02d}"
    try:
        resp = _session.get(url, impersonate="chrome124", timeout=20)
        resp.raise_for_status()
    except Exception as e:
        logger.warning("Failed to fetch %s: %s", url, e)
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Try common Drupal content selectors in order
    for selector in [
        "div.field--name-body",
        "div.field-items",
        "article .field",
        "div.node__content",
        "main article",
        "article",
        "main",
    ]:
        node = soup.select_one(selector)
        if node:
            return node.get_text("\n")

    return soup.get_text("\n")


def parse_log_text(text: str, fallback_year: int, fallback_month: int) -> list[dict]:
    incidents = []
    current_date: date | None = None
    lines = text.splitlines()
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # Date header — "04/01/2025" optionally wrapped in ** or other noise
        date_match = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", line)
        if date_match and re.search(r"\d{4}", line):
            try:
                m, d_, y = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
                if 1 <= m <= 12 and 1 <= d_ <= 31:
                    current_date = date(y, m, d_)
            except ValueError:
                pass
            i += 1
            continue

        # Separator line
        if re.match(r"[\*=\-]{5,}", line):
            i += 1
            continue

        # Incident header line: HH:MM  <type>  <10-digit case number>
        inc_match = re.match(r"(\d{2}:\d{2})\s{2,}(.+?)\s{2,}(\d{8,12})\s*$", line)
        if not inc_match:
            # Also try with single spaces around type (some months differ)
            inc_match = re.match(r"(\d{2}:\d{2})\s+(.+?)\s+(\d{10})\s*$", line)

        if inc_match and current_date:
            time_str = inc_match.group(1)
            incident_type = inc_match.group(2).strip()
            case_number = inc_match.group(3)

            # Collect body lines until the next separator or next incident header
            i += 1
            body_lines = []
            while i < len(lines):
                body_line = lines[i].strip()
                if re.match(r"[\*=\-]{5,}", body_line):
                    break
                if re.match(r"\d{2}:\d{2}\s+", body_line):
                    break
                body_lines.append(body_line)
                i += 1

            body = " ".join(bl for bl in body_lines if bl)

            disp_match = re.search(r"Disposition:\s*([^\.]+\.?)\s*$", body, re.IGNORECASE)
            if disp_match:
                disposition = disp_match.group(1).strip().rstrip(".")
                location = body[: disp_match.start()].strip().rstrip(".")
            else:
                disposition = ""
                location = body.strip().rstrip(".")

            incidents.append(
                {
                    "case_number": case_number,
                    "date": current_date,
                    "time": time_str,
                    "incident_type": incident_type,
                    "category": categorize(incident_type),
                    "location": location,
                    "disposition": disposition,
                }
            )
        else:
            i += 1

    return incidents


def scrape_month(db: Session, year: int, month: int) -> int:
    text = fetch_month_text(year, month)
    if not text:
        return 0

    parsed = parse_log_text(text, year, month)
    added = 0
    seen: set[str] = set()

    for data in parsed:
        cn = data["case_number"]
        if not cn or cn in seen:
            continue
        seen.add(cn)
        if not db.query(Incident).filter_by(case_number=cn).first():
            db.add(Incident(**data))
            added += 1

    if added:
        db.commit()

    db.add(ScrapeLog(year_month=f"{year:04d}-{month:02d}", incidents_added=added))
    db.commit()

    logger.info("Scraped %d-%02d: %d new incidents", year, month, added)
    return added


def scrape_past_year(db: Session) -> int:
    today = date.today()
    total = 0
    year, month = today.year, today.month
    for _ in range(13):  # current month + 12 months back
        already = db.query(ScrapeLog).filter_by(year_month=f"{year:04d}-{month:02d}").first()
        if not already:
            total += scrape_month(db, year, month)
        # Walk back one calendar month
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return total


def scrape_recent(db: Session) -> int:
    """Scrape current month and the previous month to catch late-added entries."""
    today = date.today()
    total = scrape_month(db, today.year, today.month)
    prev = (date(today.year, today.month, 1) - timedelta(days=1)).replace(day=1)
    total += scrape_month(db, prev.year, prev.month)
    return total
