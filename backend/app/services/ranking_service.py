from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.models.schema import CreatorScoreHistory

def update_rankings(db: Session, target_date: date):
    """
    Recalculates rank for all creators based on their score on target_date.
    Higher score gets better (lower numeric) rank.
    """
    histories = db.query(CreatorScoreHistory).filter(
        CreatorScoreHistory.date == target_date
    ).order_by(CreatorScoreHistory.score.desc()).all()
    
    current_rank = 1
    for history in histories:
        history.rank = current_rank
        current_rank += 1
        
    db.commit()

def compute_rank_change(current_rank: int, previous_rank: int) -> str:
    """Returns 'up', 'down', or 'stable'"""
    if current_rank is None or previous_rank is None:
        return "stable"
        
    if current_rank < previous_rank: # 1 is better than 5
        return "up"
    elif current_rank > previous_rank:
        return "down"
    return "stable"
