from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel
from datetime import date

class Person(Base):
    __tablename__ = "persons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)

class SmokingRecord(Base):
    __tablename__ = "smoking_records"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    person = Column(String, nullable=False, index=True)
    count = Column(Integer, nullable=False)

class SmokingRecordCreate(BaseModel):
    date: date
    person: str
    count: int

class SmokingRecordResponse(BaseModel):
    id: int
    date: date
    person: str
    count: int
    
    class Config:
        from_attributes = True

class PersonCreate(BaseModel):
    name: str

class PersonResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True