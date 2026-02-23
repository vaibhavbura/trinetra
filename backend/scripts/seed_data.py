import sys
import os
from datetime import date, timedelta
import random

# Add parent dir to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.models.schema import Creator, Video, VideoMetric, DailyCreatorStat, CreatorScoreHistory, SeriesEpisode
from app.services.scoring_service import calculate_creator_score

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Cleaning old data...")
    db.query(SeriesEpisode).delete()
    db.query(CreatorScoreHistory).delete()
    db.query(DailyCreatorStat).delete()
    db.query(VideoMetric).delete()
    db.query(Video).delete()
    db.query(Creator).delete()
    db.commit()

    print("Seeding Creators...")
    creators_data = [
        {"name": "Aarav Tech", "handle": "@aaravtech", "platform": "Trinetra Mini"},
        {"name": "Priya Vlogs", "handle": "@priyavlogs", "platform": "Trinetra Mini"},
        {"name": "Gaming Monk", "handle": "@gamingmonk", "platform": "Trinetra Mini"},
        {"name": "Code With Me", "handle": "@codewithme", "platform": "Trinetra Mini"},
        {"name": "Daily Laughs", "handle": "@dailylaughs", "platform": "Trinetra Mini"}
    ]
    
    db_creators = []
    for cd in creators_data:
        creator = Creator(**cd)
        db.add(creator)
        db_creators.append(creator)
    db.commit()

    print("Seeding Videos & Metrics...")
    for creator in db_creators:
        for i in range(3):
            video = Video(
                creator_id=creator.id,
                video_url=f"https://example.com/video/{creator.handle}_{i}.mp4",
                title=f"{creator.name} Video {i+1}"
            )
            db.add(video)
            db.commit()
            db.refresh(video)
            
            # Seed Metrics
            views = random.randint(1000, 50000)
            likes = int(views * random.uniform(0.05, 0.2))
            comments = int(likes * random.uniform(0.1, 0.5))
            shares = int(views * random.uniform(0.01, 0.05))
            watch_time = views * random.randint(10, 60)
            
            metric = VideoMetric(
                video_id=video.id,
                views=views,
                likes=likes,
                comments=comments,
                shares=shares,
                watch_time=watch_time,
                engagement_rate=(likes + comments + shares) / views,
                completion_rate=random.uniform(20.0, 90.0),
                retention_score=random.uniform(30.0, 85.0),
            )
            db.add(metric)
            db.commit()

    print("Seeding Daily Stats & Score History...")
    today = date.today()
    for creator in db_creators:
        # Generate last 7 days of stats
        for i in range(7, -1, -1):
            target_date = today - timedelta(days=i)
            
            total_views = random.randint(5000, 100000) + (i * 1000)
            total_engagement = int(total_views * random.uniform(0.08, 0.15))
            growth_velocity = random.uniform(-0.1, 0.6)
            consistency_score = random.uniform(50.0, 100.0)
            
            stat = DailyCreatorStat(
                creator_id=creator.id,
                date=target_date,
                total_views=total_views,
                total_engagement=total_engagement,
                growth_velocity=growth_velocity,
                consistency_score=consistency_score
            )
            db.add(stat)
            db.commit()
            
            # Calculate Score for each day to build history and populate ranking dynamically
            if i == 0:
                calculate_creator_score(db, creator.id)

    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_db()
