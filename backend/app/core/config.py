import os
from pydantic_settings import BaseSettings

db_url = os.getenv("DATABASE_URL", "sqlite:///./trinetra.db")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Trinetra Mini - Creator Intelligence Engine"
    API_V1_STR: str = "/api/v1"
    
    # We will use SQLite for the MVP dev environment if postgres isn't provided
    DATABASE_URL: str = db_url

settings = Settings()
