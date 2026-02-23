import numpy as np
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from app.models.schema import Creator, SeriesEpisode, CreatorScoreHistory
from app.services import insight_service, ranking_service
from app.ml.predictor import predict_views

def compute_sub_scores(episodes: List[SeriesEpisode]) -> tuple[float, float, float, float]:
    if not episodes:
        return 0.0, 0.0, 0.0, 50.0

    # 1. Engagement Score: likes + watchlist additions relative to views
    total_views = sum(e.views for e in episodes)
    total_likes = sum(e.likes for e in episodes)
    total_watchlist = sum(e.watchlist for e in episodes)
    
    engagement_rate = ((total_likes + total_watchlist * 2) / max(total_views, 1)) * 100
    engagement_score = min(100.0, max(0.0, engagement_rate * 5)) # Scaled up for 0-100 bounds

    # 2. Retention Score: completion_rate and watch_time vs episode_duration
    comp_rates = [e.completion_rate for e in episodes if e.completion_rate is not None]
    avg_comp_rate = (sum(comp_rates) / len(comp_rates) * 100) if comp_rates else 0.0
    
    wt_ratios = []
    for e in episodes:
        ed = e.episode_duration or 0.0
        wt = e.watch_time or 0.0
        if ed > 0:
            wt_ratios.append(wt / ed)
    avg_wt_ratio = (sum(wt_ratios) / len(wt_ratios) * 100) if wt_ratios else 0.0
    
    retention_score = min(100.0, max(0.0, (avg_comp_rate * 0.5) + (avg_wt_ratio * 0.5)))

    # 3. Growth Score: subscriber count & view momentum
    total_subs = max((e.subscriber for e in episodes), default=0)
    if len(episodes) > 1:
        half = len(episodes) // 2
        first_half_views = sum(e.views for e in episodes[:half])
        second_half_views = sum(e.views for e in episodes[half:])
        momentum = (second_half_views - first_half_views) / max(first_half_views, 1)
    else:
        momentum = 0.0
    
    growth_score = min(100.0, max(0.0, 50 + (momentum * 50) + (total_subs / 1000)))

    # 4. Consistency Score: inverse of view variance
    views_arr = [e.views for e in episodes]
    if len(views_arr) > 1:
        cv = np.std(views_arr) / max(np.mean(views_arr), 1) # coefficient of variation
        consistency_score = min(100.0, max(0.0, 100 - (cv * 50)))
    else:
        consistency_score = 50.0

    return engagement_score, retention_score, growth_score, consistency_score

def calculate_creator_score(db: Session, creator_id: str):
    creator = db.query(Creator).filter(Creator.id == creator_id).first()
    if not creator:
        return None

    today = date.today()
    episodes = db.query(SeriesEpisode).filter(SeriesEpisode.creator_id == creator_id).order_by(SeriesEpisode.posted_at.asc()).all()

    if not episodes:
        return _save_zero_score(db, creator_id, today)

    engagement_score, retention_score, growth_score, consistency_score = compute_sub_scores(episodes)

    # Composite Score
    score = (
        (engagement_score * 0.30) +
        (retention_score * 0.25) +
        (growth_score * 0.25) +
        (consistency_score * 0.20)
    )

    # Generate insights
    insights = insight_service.generate_insights(
        engagement_score, retention_score, growth_score, consistency_score
    )

    # ML Prediction (Mocked or real)
    predicted_views = predict_views(creator_id, db)

    # Save to history
    history = db.query(CreatorScoreHistory).filter(
        CreatorScoreHistory.creator_id == creator_id,
        CreatorScoreHistory.date == today
    ).first()

    if not history:
        history = CreatorScoreHistory(
            creator_id=creator_id,
            date=today
        )
        db.add(history)

    history.score = round(score, 2)
    history.insights = insights
    history.predicted_views_7d = predicted_views
    
    db.commit()

    # Update global ranking
    ranking_service.update_rankings(db, today)
    
    db.refresh(history)
    return history


def _save_zero_score(db: Session, creator_id: str, date_obj: date):
    history = CreatorScoreHistory(
        creator_id=creator_id,
        date=date_obj,
        score=0.0,
        insights=["New creator. Not enough data."],
        predicted_views_7d=0
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history
