from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from app.api.dependencies import get_db
from app.models.schema import Creator, CreatorScoreHistory, SeriesEpisode
from app.services.ranking_service import compute_rank_change
from app.services.scoring_service import compute_sub_scores
from app.schemas.api_models import LeaderboardCreatorResponse

router = APIRouter()

@router.get("/", response_model=List[LeaderboardCreatorResponse])
def get_leaderboard(
    genre: Optional[str] = None,
    language: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    today = date.today()
    
    # Base query for creators
    creator_query = db.query(Creator)
    
    if genre or language or year:
        episode_filters = []
        if genre:
            episode_filters.append(func.lower(SeriesEpisode.genre) == genre.lower())
        if language:
            episode_filters.append(func.lower(SeriesEpisode.language) == language.lower())
        if year:
            episode_filters.append(SeriesEpisode.year == year)
            
        creator_query = creator_query.join(SeriesEpisode).filter(*episode_filters).distinct()
        
    creators = creator_query.all()
    leaderboard = []
    
    for creator in creators:
        latest_history = db.query(CreatorScoreHistory).filter(
            CreatorScoreHistory.creator_id == creator.id
        ).order_by(CreatorScoreHistory.date.desc()).first()
        
        if not latest_history:
            continue
            
        previous_history = db.query(CreatorScoreHistory).filter(
            CreatorScoreHistory.creator_id == creator.id,
            CreatorScoreHistory.date < today
        ).order_by(CreatorScoreHistory.date.desc()).first()
        
        prev_rank = previous_history.rank if previous_history else None
        curr_rank = latest_history.rank
        
        rank_change = compute_rank_change(curr_rank, prev_rank)
        
        episodes_q = db.query(SeriesEpisode).filter(SeriesEpisode.creator_id == creator.id)
        if genre:
            episodes_q = episodes_q.filter(func.lower(SeriesEpisode.genre) == genre.lower())
        if language:
            episodes_q = episodes_q.filter(func.lower(SeriesEpisode.language) == language.lower())
        if year:
            episodes_q = episodes_q.filter(SeriesEpisode.year == year)
            
        eps = episodes_q.order_by(SeriesEpisode.posted_at.asc()).all()
        
        total_views = sum(e.views for e in eps)
        avg_views = int(total_views / len(eps)) if eps else 0
        max_subs = max((e.subscriber for e in eps), default=0) if eps else 0
        
        comp_rates = [e.completion_rate for e in eps if e.completion_rate is not None]
        avg_comp = (sum(comp_rates) / len(comp_rates) * 100) if comp_rates else 0.0

        # Sub-scores
        eng_sc, ret_sc, gro_sc, con_sc = compute_sub_scores(eps)

        # Trend logic
        trend = "stable"
        if len(eps) >= 2:
            last_ep = eps[-1]
            prev_ep = eps[-2]
            if last_ep.views > prev_ep.views:
                trend = "up"
            elif last_ep.views < prev_ep.views:
                trend = "down"

        # Data Confidence logic
        eps_count = len(eps)
        if eps_count == 0:
            confidence = "none"
        elif eps_count <= 2:
            confidence = "low"
        elif eps_count <= 9:
            confidence = "medium"
        else:
            confidence = "high"
        
        leaderboard.append(LeaderboardCreatorResponse(
            id=creator.id,
            name=creator.name,
            handle=creator.handle,
            platform=creator.platform,
            created_at=creator.created_at,
            latest_score=latest_history.score,
            latest_rank=latest_history.rank,
            rank_change=rank_change,
            trend=trend,
            data_confidence=confidence,
            insights=latest_history.insights,
            views=avg_views,
            completion_rate=round(avg_comp, 1),
            subscribers=max_subs,
            engagement_score=round(eng_sc, 1),
            retention_score=round(ret_sc, 1),
            growth_score=round(gro_sc, 1),
            consistency_score=round(con_sc, 1)
        ))
        
    # By default, sort strictly by score to maintain an honest AI leaderboard regardless of past rankings
    leaderboard.sort(key=lambda x: x.latest_score, reverse=True)
    
    return leaderboard
