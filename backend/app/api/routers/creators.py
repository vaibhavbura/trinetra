from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db
from app.models.schema import Creator, CreatorScoreHistory
from app.schemas.api_models import (
    CreatorCreate, CreatorResponse, CreatorAnalyticsResponse, LeaderboardCreatorResponse
)
from app.services import scoring_service

router = APIRouter()

@router.post("/", response_model=CreatorResponse, status_code=status.HTTP_201_CREATED)
def create_creator(creator_in: CreatorCreate, db: Session = Depends(get_db)):
    # Check if handle exists
    existing_creator = db.query(Creator).filter(Creator.handle == creator_in.handle).first()
    if existing_creator:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Handle already taken.")
    
    db_creator = Creator(
        name=creator_in.name,
        handle=creator_in.handle,
        platform=creator_in.platform
    )
    db.add(db_creator)
    db.commit()
    db.refresh(db_creator)
    return db_creator

@router.get("/{creator_id}", response_model=CreatorAnalyticsResponse)
def get_creator_analytics(creator_id: str, db: Session = Depends(get_db)):
    creator = db.query(Creator).filter(Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator not found")
    
    # Inject episodes so the Pydantic schema maps it
    from app.models.schema import SeriesEpisode
    episodes = db.query(SeriesEpisode).filter(SeriesEpisode.creator_id == creator_id).order_by(SeriesEpisode.posted_at.asc()).all()
    creator.episodes = episodes
    
    return creator

@router.post("/{creator_id}/calculate-score")
def calculate_creator_score(creator_id: str, db: Session = Depends(get_db)):
    creator = db.query(Creator).filter(Creator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator not found")
    
    # Invoke scoring service
    history = scoring_service.calculate_creator_score(db, creator_id)
    return history
