from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.schema import Video, VideoMetric, Creator
from app.schemas.api_models import VideoCreate, VideoResponse, VideoMetricUpdate

router = APIRouter()

@router.post("/", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
def create_video(video_in: VideoCreate, db: Session = Depends(get_db)):
    # Check if creator exists
    creator = db.query(Creator).filter(Creator.id == video_in.creator_id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator not found")

    db_video = Video(
        creator_id=video_in.creator_id,
        video_url=video_in.video_url,
        title=video_in.title
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)

    # Initialize empty metrics
    db_metrics = VideoMetric(video_id=db_video.id)
    db.add(db_metrics)
    db.commit()

    return db_video

@router.post("/{video_id}/metrics")
def update_video_metrics(video_id: str, metrics_in: VideoMetricUpdate, db: Session = Depends(get_db)):
    metrics = db.query(VideoMetric).filter(VideoMetric.video_id == video_id).first()
    if not metrics:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video metrics not found")

    update_data = metrics_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(metrics, key, value)
    
    # Recalculate engagement rate if views, likes, comments, shares are updated
    if any(k in update_data for k in ['views', 'likes', 'comments', 'shares']):
        if metrics.views > 0:
            metrics.engagement_rate = (metrics.likes + metrics.comments + metrics.shares) / metrics.views
        else:
            metrics.engagement_rate = 0.0

    db.add(metrics)
    db.commit()
    db.refresh(metrics)
    
    return metrics
