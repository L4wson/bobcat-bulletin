"""
Scrapes UC Merced police daily activity logs via Playwright (bypasses Akamai)
and pushes incidents to the API.

Run from GitHub Actions or locally:
  ADMIN_KEY=xxx API_URL=https://... python scripts/scrape_and_push.py
"""

import os
import re
import sys
from datetime import date, timedelta

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

API_URL = os.environ.get("API_URL", "https://bobcat-bulletin-api.fly.dev")
ADMIN_KEY = os.environ.get("ADMIN_KEY", "")

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
    print(f"  Fetching {url} via Playwright...")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            page = context.new_page()
            resp = page.goto(url, wait_until="domcontentloaded", timeout=30000)
            if resp and resp.status == 403:
                print(f"  403 Forbidden for {url}", file=sys.stderr)
                browser.close()
                return None
            # Wait for body content to be present
            page.wait_for_selector("body", timeout=10000)
            html = page.content()
            browser.close()
    except PlaywrightTimeout:
        print(f"  Timeout fetching {url}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}", file=sys.stderr)
        return None

    soup = BeautifulSoup(html, "html.parser")
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
    current_date = None
    lines = text.splitlines()
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        date_match = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", line)
        if date_match and re.search(r"\d{4}", line):
            try:
                m, d_, y = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
                if 1 <= m <= 12 and 1 <= d_ <= 31:
                    current_date = date(y, m, d_).isoformat()
            except ValueError:
                pass
            i += 1
            continue

        if re.match(r"[\*=\-]{5,}", line):
            i += 1
            continue

        inc_match = re.match(r"(\d{2}:\d{2})\s{2,}(.+?)\s{2,}(\d{8,12})\s*$", line)
        if not inc_match:
            inc_match = re.match(r"(\d{2}:\d{2})\s+(.+?)\s+(\d{10})\s*$", line)

        if inc_match and current_date:
            time_str = inc_match.group(1)
            incident_type = inc_match.group(2).strip()
            case_number = inc_match.group(3)

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

            incidents.append({
                "case_number": case_number,
                "date": current_date,
                "time": time_str,
                "incident_type": incident_type,
                "category": categorize(incident_type),
                "location": location,
                "disposition": disposition,
            })
        else:
            i += 1

    return incidents


def push_incidents(incidents: list[dict]) -> int:
    if not incidents:
        return 0
    resp = requests.post(
        f"{API_URL}/api/incidents/bulk",
        json=incidents,
        headers={"X-Admin-Key": ADMIN_KEY, "Content-Type": "application/json"},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["added"]


def scrape_recent_months() -> int:
    today = date.today()
    months = [(today.year, today.month)]
    prev = (date(today.year, today.month, 1) - timedelta(days=1)).replace(day=1)
    months.append((prev.year, prev.month))

    total_added = 0
    for year, month in months:
        print(f"Scraping {year}-{month:02d}...")
        text = fetch_month_text(year, month)
        if not text:
            print(f"  No data for {year}-{month:02d}")
            continue
        incidents = parse_log_text(text, year, month)
        print(f"  Parsed {len(incidents)} incidents")
        if incidents:
            added = push_incidents(incidents)
            print(f"  Added {added} new incidents to DB")
            total_added += added

    return total_added


if __name__ == "__main__":
    if not ADMIN_KEY:
        print("ERROR: ADMIN_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)
    total = scrape_recent_months()
    print(f"\nDone. Total new incidents: {total}")
