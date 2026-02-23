from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.ml.model_trainer import train_view_predictor
from app.ml.predictor import predict_views

router = APIRouter()

@router.post("/train")
def trigger_training(db: Session = Depends(get_db)):
    """
    Manually trigger the Scikit-Learn linear regression model training.
    """
    result = train_view_predictor(db)
    if isinstance(result, dict):
        return result
    return {"message": result}

@router.get("/predict/{creator_id}")
def get_prediction(creator_id: str, db: Session = Depends(get_db)):
    """
    Get prediction for a specific creator.
    """
    prediction = predict_views(creator_id, db)
    return {"creator_id": creator_id, "predicted_views_next_7_days": prediction}
