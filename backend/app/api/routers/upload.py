from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io

from app.api.dependencies import get_db
from app.models.schema import SeriesEpisode, Creator

router = APIRouter()

@router.post("/csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.csv', '.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV or Excel files are allowed.")
    
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # We need to map dataframe columns to Database model
        # The expected columns are:
        # creator_id,season_id,series_name,year,language,watchlist,subscriber,
        # episode_number,series_duration,episode_duration,genre,views,likes,
        # watch_time,completion_rate,posted_at
        
        # Validate series duration = sum(episode_duration)
        if 'series_name' in df.columns and 'episode_duration' in df.columns and 'series_duration' in df.columns:
            # Group by series_name to check durations
            grouped = df.groupby('series_name')
            for name, group in grouped:
                try:
                    df['episode_duration'] = pd.to_numeric(df['episode_duration'], errors='coerce').fillna(0)
                    df['series_duration'] = pd.to_numeric(df['series_duration'], errors='coerce').fillna(0)
                    sum_ep = group['episode_duration'].sum()
                    durations = group['series_duration'].dropna().unique()
                    if len(durations) > 1:
                        raise HTTPException(status_code=400, detail=f"Series '{name}' has conflicting series_duration values.")
                    if len(durations) == 1:
                        sd = durations[0]
                        if abs(sd - sum_ep) > 1.0: # 1 second tolerance
                            raise HTTPException(status_code=400, detail=f"Series '{name}' series_duration ({sd}) does not match sum of episode_durations ({sum_ep}).")
                except HTTPException as e:
                    raise e
                except Exception as e:
                    pass

        records_added = 0
        creators_created = 0

        for _, row in df.iterrows():
            # Extract basic data
            creator_v = str(row.get('creator_id', '')).strip()
            
            # Skip empty rows
            if not creator_v or creator_v == 'nan':
                continue
            
            # Validate or stub creator if not exists
            creator = db.query(Creator).filter(Creator.id == creator_v).first()
            if not creator:
                # Priority: creator_name > username > fallback
                name_val = str(row.get('creator_name', '')).strip() if 'creator_name' in row else ''
                if not name_val or name_val == 'nan':
                    name_val = str(row.get('username', '')).strip() if 'username' in row else ''
                if not name_val or name_val == 'nan':
                    name_val = f"Creator_{creator_v[:8]}"
                    
                handle_val = str(row.get('username', '')).strip() if 'username' in row else ''
                if not handle_val or handle_val == 'nan':
                    handle_val = f"user_{creator_v[:8]}"

                # Provide a fallback creator instantiation
                new_creator = Creator(
                    id=creator_v,
                    name=name_val,
                    handle=handle_val,
                    platform="Unknown"
                )
                db.add(new_creator)
                db.flush() # ensure creator is known before adding videos
                creators_created += 1

            # Insert series episode
            episode_data = SeriesEpisode(
                creator_id=creator_v,
                season_id=str(row.get('season_id', '')),
                series_name=str(row.get('series_name', 'Unknown Series')),
                year=int(row.get('year', 0)) if not pd.isna(row.get('year')) else None,
                language=str(row.get('language', '')),
                watchlist=int(row.get('watchlist', 0)) if not pd.isna(row.get('watchlist')) else 0,
                subscriber=int(row.get('subscriber', 0)) if not pd.isna(row.get('subscriber')) else 0,
                episode_number=int(row.get('episode_number', 0)) if not pd.isna(row.get('episode_number')) else 0,
                series_duration=float(row.get('series_duration', 0.0)) if not pd.isna(row.get('series_duration')) else 0.0,
                episode_duration=float(row.get('episode_duration', 0.0)) if not pd.isna(row.get('episode_duration')) else 0.0,
                genre=str(row.get('genre', '')),
                views=int(row.get('views', 0)) if not pd.isna(row.get('views')) else 0,
                likes=int(row.get('likes', 0)) if not pd.isna(row.get('likes')) else 0,
                watch_time=float(row.get('watch_time', 0.0)) if not pd.isna(row.get('watch_time')) else 0.0,
                completion_rate=float(row.get('completion_rate', 0.0)) if not pd.isna(row.get('completion_rate')) else 0.0,
            )
            # handle dates if present
            posted_at_raw = row.get('posted_at')
            if pd.notna(posted_at_raw):
                try:
                    episode_data.posted_at = pd.to_datetime(posted_at_raw).to_pydatetime()
                except:
                    pass

            db.add(episode_data)
            records_added += 1

        db.commit()

        # Generate scores and insights for all touched creators
        from app.services.scoring_service import calculate_creator_score
        touched_creators = df['creator_id'].dropna().unique() if 'creator_id' in df.columns else []
        for c_id in touched_creators:
            c_id_str = str(c_id).strip()
            if c_id_str:
                try:
                    calculate_creator_score(db, c_id_str)
                except Exception as e:
                    pass

        # Simple insight generation logic after upload
        insights = [
            f"Successfully ingested {records_added} episodes into the system.",
        ]
        if creators_created > 0:
            insights.append(f"Auto-generated {creators_created} missing creator profiles.")

        # E.g., highest viewed series uploaded
        highest_viewed = df.sort_values(by="views", ascending=False).head(1)
        if not highest_viewed.empty:
            top_series = highest_viewed.iloc[0].get("series_name", "Unknown")
            top_views = highest_viewed.iloc[0].get("views", 0)
            insights.append(f"Top Series Detected: '{top_series}' with {int(top_views)} views.")

        # Summary Stats
        total_creators_in_csv = int(df['creator_id'].nunique()) if 'creator_id' in df.columns else 0
        total_series_in_csv = int(df['series_name'].nunique()) if 'series_name' in df.columns else 0
        avg_completion_in_csv = float(df['completion_rate'].mean()) if 'completion_rate' in df.columns and not df['completion_rate'].isna().all() else 0.0

        return {
            "message": "Data successfully parsed and imported",
            "records_added": records_added,
            "creators_generated": creators_created,
            "total_creators": total_creators_in_csv,
            "total_series": total_series_in_csv,
            "avg_completion": avg_completion_in_csv,
            "insights": insights
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
