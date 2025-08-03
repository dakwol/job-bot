from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLITE_DATABASE_URL = "sqlite:///./job_bot.db"
engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content = Column(Text)
    skills = Column(Text)  # JSON string
    experience_years = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Vacancy(Base):
    __tablename__ = "vacancies"
    
    id = Column(String, primary_key=True, index=True)  # HH vacancy ID
    name = Column(String, index=True)
    company = Column(String)
    description = Column(Text)
    salary_from = Column(Integer, nullable=True)
    salary_to = Column(Integer, nullable=True)
    experience_required = Column(String)
    similarity_score = Column(Float)
    hh_url = Column(String)
    fetched_at = Column(DateTime, default=datetime.utcnow)

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    vacancy_id = Column(String, index=True)
    resume_id = Column(Integer)
    status = Column(String, default="pending")  # pending, sent, failed
    applied_at = Column(DateTime, default=datetime.utcnow)
    cover_letter = Column(Text)
    auto_applied = Column(Boolean, default=False)

# Создание таблиц
Base.metadata.create_all(bind=engine)