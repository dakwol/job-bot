from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict
from ..models.database import SessionLocal, Resume, Application
from ..services.auto_applier import AutoApplier
from ..services.hh_service import HeadHunterService

router = APIRouter(prefix="/bot", tags=["automation"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/start-auto-apply")
async def start_auto_apply(
    background_tasks: BackgroundTasks,
    resume_id: int,
    min_similarity: float = 0.3,
    max_applications: int = 50,
    db: Session = Depends(get_db)
):
    """Start automated job application process"""
    
    # Get resume data
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get matched vacancies
    hh_service = HeadHunterService()
    auto_applier = AutoApplier(hh_service)
    
    # Start background task
    background_tasks.add_task(
        auto_applier.start_auto_application,
        resume.__dict__,
        [],  # Will be populated with matched vacancies
        min_similarity,
        max_applications
    )
    
    return {"message": "Auto application started", "resume_id": resume_id}

@router.get("/application-status")
async def get_application_status(db: Session = Depends(get_db)):
    """Get current application status"""
    
    applications = db.query(Application).order_by(Application.applied_at.desc()).limit(50).all()
    
    stats = {
        "total_applications": len(applications),
        "pending": len([a for a in applications if a.status == "pending"]),
        "sent": len([a for a in applications if a.status == "sent"]),
        "failed": len([a for a in applications if a.status == "failed"]),
        "recent_applications": [
            {
                "vacancy_id": app.vacancy_id,
                "status": app.status,
                "applied_at": app.applied_at.isoformat(),
                "auto_applied": app.auto_applied
            }
            for app in applications[:10]
        ]
    }
    
    return stats

@router.post("/stop-auto-apply")
async def stop_auto_apply():
    """Stop automated application process"""
    # Implementation to stop background tasks
    return {"message": "Auto application stopped"}