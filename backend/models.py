from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True)
    date = Column(Date, index=True)
    time = Column(String)
    incident_type = Column(String, index=True)
    category = Column(String, index=True)
    location = Column(String)
    disposition = Column(String)
    scraped_at = Column(DateTime, server_default=func.now())


class ScrapeLog(Base):
    __tablename__ = "scrape_log"

    id = Column(Integer, primary_key=True, index=True)
    year_month = Column(String, index=True)
    incidents_added = Column(Integer, default=0)
    scraped_at = Column(DateTime, server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    message = Column(Text)
    contact = Column(String, nullable=True)
    submitted_at = Column(DateTime, server_default=func.now())
