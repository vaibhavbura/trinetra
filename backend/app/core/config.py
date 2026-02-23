import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Trinetra Mini - Creator Intelligence Engine"
    API_V1_STR: str = "/api/v1"
    
    # We will use SQLite for the MVP dev environment if postgres isn't provided
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/trinetra"
    )

settings = Settings()
