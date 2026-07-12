import logging
import os
import secrets
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import func
from sqlalchemy.orm import Session

from pydantic import BaseModel

from database import Base, SessionLocal, engine, get_db
from models import Comment, Feedback, Incident, ScrapeLog
from scraper import scrape_past_year, scrape_recent

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

os.makedirs(os.path.dirname(os.environ.get("DB_PATH", "/data/bobcat.db")), exist_ok=True)

ADMIN_KEY = os.environ.get("ADMIN_KEY", "")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
SCRAPE_INTERVAL_HOURS = int(os.environ.get("SCRAPE_INTERVAL_HOURS", "6"))

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    startup_scrape()
    scheduler.add_job(scheduled_scrape, "interval", hours=SCRAPE_INTERVAL_HOURS, id="scrape")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Bobcat Bulletin API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Admin-Key"],
    max_age=86400,
)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def require_admin(x_admin_key: str = Header(default="")):
    if not ADMIN_KEY or not secrets.compare_digest(x_admin_key, ADMIN_KEY):
        raise HTTPException(status_code=403, detail="Forbidden")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/incidents")
@limiter.limit("60/minute")
def list_incidents(
    request: Request,
    category: Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None),
    exclude_type: list[str] = Query(default=[]),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None, max_length=200),
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


@app.get("/api/incidents/{case_number}")
@limiter.limit("60/minute")
def get_incident(
    request: Request,
    case_number: str,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.case_number == case_number).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    related = []
    if incident.location:
        window = timedelta(days=30)
        related = (
            db.query(Incident)
            .filter(
                Incident.location == incident.location,
                Incident.id != incident.id,
                Incident.date >= incident.date - window,
                Incident.date <= incident.date + window,
            )
            .order_by(Incident.date.desc(), Incident.time.desc())
            .limit(6)
            .all()
        )

    return {
        "incident": _serialize(incident),
        "related": [_serialize(i) for i in related],
    }


# ---------------------------------------------------------------------------
# Anonymous comments — held for moderation before they appear publicly
# ---------------------------------------------------------------------------

COMMENT_MIN_LEN = 10
COMMENT_MAX_LEN = 1000


class CommentIn(BaseModel):
    body: str
    website: str = ""  # honeypot — real users never fill this


def _serialize_comment(c: Comment, include_moderation: bool = False) -> dict:
    out = {
        "id": c.id,
        "case_number": c.case_number,
        "body": c.body,
        "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
    }
    if include_moderation:
        out["status"] = c.status
        out["moderated_at"] = c.moderated_at.isoformat() if c.moderated_at else None
    return out


@app.get("/api/incidents/{case_number}/comments")
@limiter.limit("60/minute")
def list_comments(request: Request, case_number: str, db: Session = Depends(get_db)):
    items = (
        db.query(Comment)
        .filter(Comment.case_number == case_number, Comment.status == "approved")
        .order_by(Comment.submitted_at)
        .all()
    )
    return [_serialize_comment(c) for c in items]


@app.post("/api/incidents/{case_number}/comments")
@limiter.limit("5/hour")
def submit_comment(
    request: Request,
    case_number: str,
    body: CommentIn,
    db: Session = Depends(get_db),
):
    if body.website.strip():
        # Honeypot tripped — pretend success so bots don't adapt
        return {"ok": True, "status": "pending"}

    if not db.query(Incident).filter(Incident.case_number == case_number).first():
        raise HTTPException(status_code=404, detail="Incident not found")

    text = body.body.strip()
    if len(text) < COMMENT_MIN_LEN:
        raise HTTPException(status_code=422, detail=f"Comment must be at least {COMMENT_MIN_LEN} characters")
    if len(text) > COMMENT_MAX_LEN:
        raise HTTPException(status_code=422, detail=f"Comment must be under {COMMENT_MAX_LEN} characters")

    db.add(Comment(case_number=case_number, body=text))
    db.commit()
    return {"ok": True, "status": "pending"}


@app.get("/api/admin/comments")
@limiter.limit("60/minute")
def list_comments_admin(
    request: Request,
    status: str = Query("pending"),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if status not in {"pending", "approved", "rejected"}:
        raise HTTPException(status_code=422, detail="Invalid status")
    items = (
        db.query(Comment)
        .filter(Comment.status == status)
        .order_by(Comment.submitted_at)
        .all()
    )
    return [_serialize_comment(c, include_moderation=True) for c in items]


class ModerationIn(BaseModel):
    action: str  # approve | reject


@app.post("/api/admin/comments/{comment_id}")
@limiter.limit("120/minute")
def moderate_comment(
    request: Request,
    comment_id: int,
    body: ModerationIn,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if body.action not in {"approve", "reject"}:
        raise HTTPException(status_code=422, detail="Invalid action")
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.status = "approved" if body.action == "approve" else "rejected"
    comment.moderated_at = datetime.utcnow()
    db.commit()
    return _serialize_comment(comment, include_moderation=True)


@app.get("/api/categories")
@limiter.limit("20/minute")
def list_categories(request: Request, db: Session = Depends(get_db)):
    rows = (
        db.query(Incident.category, func.count(Incident.id).label("count"))
        .group_by(Incident.category)
        .order_by(func.count(Incident.id).desc())
        .all()
    )
    return [{"name": r.category, "count": r.count} for r in rows]


@app.get("/api/incident-types")
@limiter.limit("20/minute")
def list_incident_types(
    request: Request,
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
@limiter.limit("30/minute")
def get_stats(request: Request, db: Session = Depends(get_db)):
    today = date.today()
    total = db.query(Incident).count()
    this_month = db.query(Incident).filter(Incident.date >= today.replace(day=1)).count()
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


@app.get("/api/trends")
@limiter.limit("20/minute")
def get_trends(
    request: Request,
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)
    rows = (
        db.query(
            Incident.date,
            Incident.category,
            func.count(Incident.id).label("count"),
        )
        .filter(Incident.date >= cutoff)
        .group_by(Incident.date, Incident.category)
        .order_by(Incident.date)
        .all()
    )
    # Pivot into { date: { category: count } } for easy frontend consumption
    by_date: dict = {}
    for r in rows:
        d = r.date.isoformat()
        by_date.setdefault(d, {})[r.category] = r.count
    return [{"date": d, **counts} for d, counts in sorted(by_date.items())]


class IncidentIn(BaseModel):
    case_number: str
    date: date
    time: str
    incident_type: str
    category: str
    location: str = ""
    disposition: str = ""


@app.post("/api/incidents/bulk")
@limiter.limit("10/hour")
def bulk_ingest(
    request: Request,
    incidents: list[IncidentIn],
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    added = 0
    seen: set[str] = set()
    for data in incidents:
        cn = data.case_number
        if not cn or cn in seen:
            continue
        seen.add(cn)
        if not db.query(Incident).filter_by(case_number=cn).first():
            db.add(Incident(**data.model_dump()))
            added += 1
    if added:
        db.commit()
    db.add(ScrapeLog(year_month="bulk-ingest", incidents_added=added))
    db.commit()
    return {"added": added}


FEEDBACK_TYPES = {"suggestion", "bug", "question", "removal"}


class FeedbackIn(BaseModel):
    type: str
    message: str
    contact: str = ""


@app.post("/api/feedback")
@limiter.limit("5/hour")
def submit_feedback(request: Request, body: FeedbackIn, db: Session = Depends(get_db)):
    if body.type not in FEEDBACK_TYPES:
        raise HTTPException(status_code=422, detail="Invalid type")
    if not body.message.strip():
        raise HTTPException(status_code=422, detail="Message required")
    fb = Feedback(
        type=body.type,
        message=body.message.strip()[:2000],
        contact=body.contact.strip()[:200] or None,
    )
    db.add(fb)
    db.commit()
    return {"ok": True}


@app.get("/api/feedback")
@limiter.limit("30/minute")
def list_feedback(request: Request, db: Session = Depends(get_db), _=Depends(require_admin)):
    items = db.query(Feedback).order_by(Feedback.submitted_at.desc()).all()
    return [
        {
            "id": f.id,
            "type": f.type,
            "message": f.message,
            "contact": f.contact,
            "submitted_at": f.submitted_at.isoformat(),
        }
        for f in items
    ]


@app.post("/api/scrape")
@limiter.limit("5/hour")
def trigger_scrape(request: Request, db: Session = Depends(get_db), _=Depends(require_admin)):
    added = scrape_recent(db)
    return {"message": f"Scrape complete. {added} new incidents added."}


@app.post("/api/recategorize")
@limiter.limit("5/hour")
def recategorize(request: Request, db: Session = Depends(get_db), _=Depends(require_admin)):
    from scraper import categorize
    rows = db.query(Incident).all()
    updated = 0
    for row in rows:
        new_cat = categorize(row.incident_type)
        if row.category != new_cat:
            row.category = new_cat
            updated += 1
    db.commit()
    return {"message": f"Recategorized {updated} incidents."}


@app.get("/api/health")
@limiter.limit("120/minute")
def health(request: Request):
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
