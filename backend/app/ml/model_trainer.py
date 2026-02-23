import pandas as pd
import logging
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error
from sqlalchemy.orm import Session
import os
import pickle
from datetime import date, timedelta
from app.models.schema import DailyCreatorStat

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def train_view_predictor(db: Session):
    """
    Train a Scikit-Learn Linear Regression model to predict next 7_days total views.
    Target: Future 7 Days Views
    Features: total_views (today), total_engagement, growth_velocity, consistency_score
    """
    stats = db.query(DailyCreatorStat).all()
    if len(stats) < 10:
        return {"message": "Not enough data to train."}

    df = pd.DataFrame([{
        "creator_id": s.creator_id,
        "date": s.date,
        "total_views": s.total_views,
        "total_engagement": s.total_engagement,
        "growth_velocity": s.growth_velocity,
        "consistency_score": s.consistency_score,
    } for s in stats])

    # Convert date and sort
    df["date"] = pd.to_datetime(df["date"]).dt.date
    df.sort_values(by=["date", "creator_id"], inplace=True) # Time-aware sorting

    features = ["total_views", "total_engagement", "growth_velocity", "consistency_score"]

    # Graceful handling of missing values
    initial_len = len(df)
    df = df.dropna(subset=features)
    if len(df) < initial_len:
        logger.warning(f"Skipped {initial_len - len(df)} rows due to missing feature values.")

    targets = []
    valid_rows = []
    today = date.today()
    
    for _, row in df.iterrows():
        row_date = row["date"]
        
        # Prevent data leakage: Only train on rows where a full 7-day future window exists
        if row_date > today - timedelta(days=7):
            continue
            
        # Get stats for the same creator in the next 7 days
        future_window = df[
            (df["creator_id"] == row["creator_id"]) & 
            (df["date"] > row_date) &
            (df["date"] <= row_date + timedelta(days=7))
        ]
        
        target_views = future_window["total_views"].sum()
        targets.append(target_views)
        valid_rows.append(row)

    if len(valid_rows) < 5:
        return {"message": "Not enough valid rows with full 7-day windows to train."}

    train_data = pd.DataFrame(valid_rows)
    train_data["target"] = targets
    train_data.sort_values(by="date", inplace=True) # Guarantee time-order
    
    X = train_data[features]
    y = train_data["target"]

    # Time-aware validation split (80% train, 20% validation) WITHOUT shuffling
    split_idx = int(len(X) * 0.8)
    if split_idx == 0 or split_idx == len(X):
        X_train, X_val = X, X
        y_train, y_val = y, y
    else:
        X_train, X_val = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_val = y.iloc[:split_idx], y.iloc[split_idx:]

    # Model with feature scaling (Pipeline)
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', LinearRegression())
    ])

    pipeline.fit(X_train, y_train)

    # Calculate MAE on validation set
    val_preds = pipeline.predict(X_val)
    val_mae = mean_absolute_error(y_val, val_preds)

    # Expose feature importance
    coefs = pipeline.named_steps['regressor'].coef_
    importance = {features[i]: float(coefs[i]) for i in range(len(features))}
    logger.info(f"Feature Importances (scaled): {importance}")

    # Persist evaluation metadata inside model pickle
    payload = {
        "model": pipeline,
        "metadata": {
            "training_date": str(today),
            "samples": len(train_data),
            "val_mae": float(val_mae),
            "feature_importance": importance,
            "features": features
        }
    }

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(payload, f)
        
    return {
        "message": "Model trained successfully.",
        "samples": len(train_data),
        "validation_mae": float(val_mae),
        "feature_importances": importance
    }
