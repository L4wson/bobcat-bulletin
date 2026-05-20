import logging
import os
from contextlib import asynccontextmanager
from datetime import date, datetime
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db
from models import Incident, ScrapeLog
from scraper import scrape_past_year, scrape_recent

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

os.makedirs(os.path.dirname(os.environ.get("DB_PATH", "/data/bobcat.db")), exist_ok=True)


def startup_scrape():
    db = SessionLocal()
    try:
        logger.info("Running startup scrape (fills any missing months in the past year)")
        scrape_past_year(db)
    finally:
        db.close()


def scheduled_scrape():
    db = SessionLocal()
    try:
        scrape_recent(db)
    finally:
        db.close()


scheduler = BackgroundScheduler()

SCRAPE_INTERVAL_HOURS = int(os.environ.get("SCRAPE_INTERVAL_HOURS", "6"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    startup_scrape()
    scheduler.add_job(scheduled_scrape, "interval", hours=SCRAPE_INTERVAL_HOURS, id="scrape")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Bobcat Bulletin API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/incidents")
def list_incidents(
    category: Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None),
    exclude_type: list[str] = Query(default=[]),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Incident)

    if category and category.lower() != "all":
        q = q.filter(func.lower(Incident.category) == category.lower())
    if incident_type:
        q = q.filter(func.lower(Incident.incident_type) == incident_type.lower())
    if exclude_type:
        q = q.filter(Incident.incident_type.notin_(exclude_type))
    if start_date:
        q = q.filter(Incident.date >= start_date)
    if end_date:
        q = q.filter(Incident.date <= end_date)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Incident.incident_type.ilike(like)
            | Incident.location.ilike(like)
            | Incident.disposition.ilike(like)
            | Incident.case_number.ilike(like)
        )

    total = q.count()
    items = (
        q.order_by(Incident.date.desc(), Incident.time.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
        "incidents": [_serialize(i) for i in items],
    }


@app.get("/api/categories")
def list_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(Incident.category, func.count(Incident.id).label("count"))
        .group_by(Incident.category)
        .order_by(func.count(Incident.id).desc())
        .all()
    )
    return [{"name": r.category, "count": r.count} for r in rows]


@app.get("/api/incident-types")
def list_incident_types(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Incident.incident_type, Incident.category, func.count(Incident.id).label("count"))
    if category and category.lower() != "all":
        q = q.filter(func.lower(Incident.category) == category.lower())
    rows = (
        q.group_by(Incident.incident_type, Incident.category)
        .order_by(func.count(Incident.id).desc())
        .all()
    )
    return [{"name": r.incident_type, "category": r.category, "count": r.count} for r in rows]


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    today = date.today()
    total = db.query(Incident).count()
    this_month = db.query(Incident).filter(
        Incident.date >= today.replace(day=1)
    ).count()
    this_week_start = today.toordinal() - today.weekday()
    this_week = db.query(Incident).filter(
        Incident.date >= date.fromordinal(this_week_start)
    ).count()
    top_row = (
        db.query(Incident.category, func.count(Incident.id).label("cnt"))
        .group_by(Incident.category)
        .order_by(func.count(Incident.id).desc())
        .first()
    )
    last_log = db.query(ScrapeLog).order_by(ScrapeLog.scraped_at.desc()).first()
    return {
        "total": total,
        "this_week": this_week,
        "this_month": this_month,
        "top_category": top_row.category if top_row else None,
        "last_updated": last_log.scraped_at.isoformat() if last_log else None,
    }


@app.post("/api/scrape")
def trigger_scrape(db: Session = Depends(get_db)):
    added = scrape_recent(db)
    return {"message": f"Scrape complete. {added} new incidents added."}


@app.get("/api/health")
def health():
    return {"status": "ok"}


def _serialize(i: Incident) -> dict:
    return {
        "id": i.id,
        "case_number": i.case_number,
        "date": i.date.isoformat() if i.date else None,
        "time": i.time,
        "incident_type": i.incident_type,
        "category": i.category,
        "location": i.location,
        "disposition": i.disposition,
    }
