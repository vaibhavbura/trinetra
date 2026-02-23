import pickle
import os
import pandas as pd
from sqlalchemy.orm import Session
from datetime import date
from app.models.schema import DailyCreatorStat

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def get_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            data = pickle.load(f)
            # Support both raw models and new metadata payloads
            if isinstance(data, dict) and "model" in data:
                return data["model"]
            return data
    return None

def predict_views(creator_id: str, db: Session) -> int:
    """
    Predict next 7 days views based on today's stats.
    Fallback to a simple heuristic if no model is trained yet.
    """
    model = get_model()
    
    today = date.today()
    stat = db.query(DailyCreatorStat).filter(
        DailyCreatorStat.creator_id == creator_id,
        DailyCreatorStat.date == today
    ).first()

    if not stat:
        return None
        
    if model:
        # Pass features as a DataFrame to keep valid feature names for the Pipeline
        features_df = pd.DataFrame([{
            "total_views": stat.total_views,
            "total_engagement": stat.total_engagement,
            "growth_velocity": stat.growth_velocity,
            "consistency_score": stat.consistency_score
        }])
        try:
            prediction = model.predict(features_df)[0]
            if pd.isna(prediction):
                return None
            return max(0, int(prediction))
        except Exception:
            return None
        
    return None
