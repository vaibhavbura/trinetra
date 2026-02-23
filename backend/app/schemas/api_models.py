from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List

# --- CREATOR ---
class CreatorBase(BaseModel):
    name: str
    handle: str
    platform: str

class CreatorCreate(CreatorBase):
    pass

class CreatorResponse(CreatorBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- VIDEO METRICS ---
class VideoMetricBase(BaseModel):
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    watch_time: int = 0

    engagement_rate: float = 0.0
    completion_rate: float = 0.0
    retention_score: float = 0.0

class VideoMetricUpdate(BaseModel):
    views: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    watch_time: Optional[int] = None
    completion_rate: Optional[float] = None
    retention_score: Optional[float] = None

class VideoMetricResponse(VideoMetricBase):
    id: str
    video_id: str
    measured_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- VIDEO ---
class VideoBase(BaseModel):
    video_url: str
    title: str

class VideoCreate(VideoBase):
    creator_id: str

class VideoResponse(VideoBase):
    id: str
    creator_id: str
    published_at: datetime
    metrics: Optional[VideoMetricResponse] = None
    model_config = ConfigDict(from_attributes=True)

# --- STATS & HISTORY ---
class DailyStatResponse(BaseModel):
    date: date
    total_views: int
    total_engagement: int
    growth_velocity: float
    consistency_score: float
    model_config = ConfigDict(from_attributes=True)

class ScoreHistoryResponse(BaseModel):
    date: date
    score: float
    rank: Optional[int] = None
    predicted_views_7d: Optional[int] = None
    insights: List[str]
    model_config = ConfigDict(from_attributes=True)

# --- SERIES EPISODE ---
class SeriesEpisodeResponse(BaseModel):
    id: str
    season_id: Optional[str] = None
    series_name: Optional[str] = None
    year: Optional[int] = None
    language: Optional[str] = None
    watchlist: int = 0
    subscriber: int = 0
    episode_number: int = 0
    series_duration: float = 0.0
    episode_duration: float = 0.0
    genre: Optional[str] = None
    views: int = 0
    likes: int = 0
    watch_time: float = 0.0
    completion_rate: float = 0.0
    posted_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- LEADERBOARD & FULL ANALYTICS ---
class LeaderboardCreatorResponse(CreatorResponse):
    latest_score: float
    latest_rank: Optional[int]
    rank_change: str = "stable" # "up", "down", "stable"
    trend: str = "stable"
    data_confidence: str = "none" # "none", "low", "medium", "high"
    insights: List[str]
    views: int = 0
    completion_rate: float = 0.0
    subscribers: int = 0
    engagement_score: float = 0.0
    retention_score: float = 0.0
    growth_score: float = 0.0
    consistency_score: float = 0.0
    model_config = ConfigDict(from_attributes=True)

class CreatorAnalyticsResponse(CreatorResponse):
    videos: List[VideoResponse]
    daily_stats: List[DailyStatResponse]
    score_history: List[ScoreHistoryResponse]
    episodes: List[SeriesEpisodeResponse] = []
    model_config = ConfigDict(from_attributes=True)
