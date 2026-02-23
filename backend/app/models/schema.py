from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone

from app.core.database import Base

def get_uuid():
    return str(uuid.uuid4())

class Creator(Base):
    __tablename__ = "creators"

    id = Column(String, primary_key=True, default=get_uuid)
    name = Column(String, nullable=False)
    handle = Column(String, unique=True, index=True, nullable=False)
    platform = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    videos = relationship("Video", back_populates="creator")
    daily_stats = relationship("DailyCreatorStat", back_populates="creator")
    score_history = relationship("CreatorScoreHistory", back_populates="creator")

class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=get_uuid)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False)
    video_url = Column(String, nullable=False)
    title = Column(String, nullable=False)
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("Creator", back_populates="videos")
    metrics = relationship("VideoMetric", back_populates="video", uselist=False)

class VideoMetric(Base):
    __tablename__ = "video_metrics"

    id = Column(String, primary_key=True, default=get_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    watch_time = Column(Integer, default=0) # in seconds
    engagement_rate = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    retention_score = Column(Float, default=0.0)
    measured_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    video = relationship("Video", back_populates="metrics")

class DailyCreatorStat(Base):
    __tablename__ = "daily_creator_stats"

    id = Column(String, primary_key=True, default=get_uuid)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False)
    date = Column(Date, nullable=False)
    total_views = Column(Integer, default=0)
    total_engagement = Column(Integer, default=0)
    growth_velocity = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)

    creator = relationship("Creator", back_populates="daily_stats")

class CreatorScoreHistory(Base):
    __tablename__ = "creator_score_history"

    id = Column(String, primary_key=True, default=get_uuid)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False)
    date = Column(Date, nullable=False)
    score = Column(Float, default=0.0)
    rank = Column(Integer, nullable=True)
    predicted_views_7d = Column(Integer, nullable=True)
    insights = Column(JSON, default=list)

    creator = relationship("Creator", back_populates="score_history")

class SeriesEpisode(Base):
    __tablename__ = "series_episodes"

    id = Column(String, primary_key=True, default=get_uuid)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False)
    season_id = Column(String, nullable=True)
    series_name = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    language = Column(String, nullable=True)
    watchlist = Column(Integer, default=0)
    subscriber = Column(Integer, default=0)
    episode_number = Column(Integer, default=0)
    series_duration = Column(Float, default=0.0)
    episode_duration = Column(Float, default=0.0)
    genre = Column(String, nullable=True)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    watch_time = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("Creator")
