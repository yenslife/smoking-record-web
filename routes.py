from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, time
import models
from database import get_db

router = APIRouter()

# Person routes
@router.get("/persons", response_model=List[models.PersonResponse])
def get_persons(db: Session = Depends(get_db)):
    persons = db.query(models.Person).order_by(models.Person.name).all()
    return persons

@router.post("/persons", response_model=models.PersonResponse)
def create_person(
    name: str = Form(...),
    db: Session = Depends(get_db)
):
    # Check if person already exists
    existing_person = db.query(models.Person).filter(models.Person.name == name).first()
    if existing_person:
        raise HTTPException(status_code=400, detail="Person with this name already exists")
    
    person_data = models.PersonCreate(name=name)
    db_person = models.Person(**person_data.model_dump())
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    
    return db_person

@router.put("/persons/{person_id}", response_model=models.PersonResponse)
def update_person(
    person_id: int,
    name: str = Form(...),
    db: Session = Depends(get_db)
):
    db_person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not db_person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Check if new name already exists (but not for the same person)
    existing_person = db.query(models.Person).filter(
        models.Person.name == name,
        models.Person.id != person_id
    ).first()
    if existing_person:
        raise HTTPException(status_code=400, detail="Person with this name already exists")
    
    old_name = db_person.name
    db_person.name = name
    
    # Update all records with the old name to use the new name
    db.query(models.SmokingRecord).filter(
        models.SmokingRecord.person == old_name
    ).update({"person": name})
    
    db.commit()
    db.refresh(db_person)
    return db_person

@router.delete("/persons/{person_id}")
def delete_person(person_id: int, db: Session = Depends(get_db)):
    db_person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not db_person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Check if person has records
    records_count = db.query(models.SmokingRecord).filter(models.SmokingRecord.person == db_person.name).count()
    if records_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete person with existing records")
    
    db.delete(db_person)
    db.commit()
    return {"message": "Person deleted successfully"}

# Smoking record routes

@router.get("/records", response_model=List[models.SmokingRecordResponse])
def get_records(
    person: Optional[str] = None,
    date: Optional[str] = None,
    date_gte: Optional[date] = None,
    date_lte: Optional[date] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.SmokingRecord)
    
    if person:
        query = query.filter(models.SmokingRecord.person == person)
    if date:
        try:
            parsed_date = datetime.strptime(date, '%Y-%m-%d').date()
            query = query.filter(models.SmokingRecord.date == parsed_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    if date_gte:
        query = query.filter(models.SmokingRecord.date >= date_gte)
    if date_lte:
        query = query.filter(models.SmokingRecord.date <= date_lte)
    
    records = query.order_by(models.SmokingRecord.date.desc(), models.SmokingRecord.time.desc()).limit(limit).all()
    return records

@router.post("/records", response_model=models.SmokingRecordResponse)
def create_record(
    date: str = Form(...),
    person: str = Form(...),
    count: int = Form(...),
    time: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        parsed_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    parsed_time = None
    if time:
        try:
            parsed_time = datetime.strptime(time, '%H:%M:%S').time()
        except ValueError:
            try:
                parsed_time = datetime.strptime(time, '%H:%M').time()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM or HH:MM:SS")
    
    record_data = models.SmokingRecordCreate(
        date=parsed_date,
        time=parsed_time,
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