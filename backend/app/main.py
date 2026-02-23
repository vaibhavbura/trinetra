import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.routers import creators, videos, leaderboard, ml, upload
from app.models.schema import Creator
from app.services.scoring_service import calculate_creator_score

async def run_ranking_engine_periodically():
    """Background worker loops every 60s and updates scores/ranks"""
    while True:
        await asyncio.sleep(60) 
        db = SessionLocal()
        try:
            active_creators = db.query(Creator).all()
            if active_creators:
                print(f"[Real-Time Engine] Updating rankings for {len(active_creators)} creators...")
                for creator in active_creators:
                    calculate_creator_score(db, str(creator.id))
        except Exception as e:
            print(f"[Real-Time Engine] Error: {e}")
        finally:
            db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    ranking_task = asyncio.create_task(run_ranking_engine_periodically())
    yield
    # Shutdown tasks
    ranking_task.cancel()

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(creators.router, prefix="/api/creators", tags=["creators"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(ml.router, prefix="/api/ml", tags=["ml"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Trinetra Mini API"}
