from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import models
from database import get_db

router = APIRouter()

@router.get("/records", response_model=List[models.SmokingRecordResponse])
def get_records(
    person: Optional[str] = None,
    date_gte: Optional[date] = None,
    date_lte: Optional[date] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.SmokingRecord)
    
    if person:
        query = query.filter(models.SmokingRecord.person == person)
    if date_gte:
        query = query.filter(models.SmokingRecord.date >= date_gte)
    if date_lte:
        query = query.filter(models.SmokingRecord.date <= date_lte)
    
    records = query.order_by(models.SmokingRecord.date.desc()).limit(limit).all()
    return records

@router.post("/records", response_model=models.SmokingRecordResponse)
def create_record(
    date: str = Form(...),
    person: str = Form(...),
    count: int = Form(...),
    db: Session = Depends(get_db)
):
    try:
        parsed_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    record_data = models.SmokingRecordCreate(
        date=parsed_date,
        person=person,
        count=count
    )
    
    db_record = models.SmokingRecord(**record_data.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return db_record

@router.put("/records/{record_id}", response_model=models.SmokingRecordResponse)
def update_record(
    record_id: int,
    record: models.SmokingRecordCreate,
    db: Session = Depends(get_db)
):
    db_record = db.query(models.SmokingRecord).filter(models.SmokingRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    for key, value in record.model_dump().items():
        setattr(db_record, key, value)
    
    db.commit()
    db.refresh(db_record)
    return db_record

@router.delete("/records/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    db_record = db.query(models.SmokingRecord).filter(models.SmokingRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(db_record)
    db.commit()
    return {"message": "Record deleted successfully"}