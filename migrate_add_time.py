#!/usr/bin/env python3
"""
Database migration script to add time column to smoking_records table
"""

from sqlalchemy import text
from database import engine, get_db

def migrate_add_time_column():
    """Add time column to smoking_records table"""
    
    try:
        with engine.connect() as connection:
            # Check if time column already exists
            result = connection.execute(text("""
                SELECT COUNT(*) as count 
                FROM pragma_table_info('smoking_records') 
                WHERE name = 'time'
            """)).fetchone()
            
            if result.count == 0:
                print("Adding time column to smoking_records table...")
                # Add time column
                connection.execute(text("""
                    ALTER TABLE smoking_records 
                    ADD COLUMN time TIME
                """))
                
                # Create index on time column
                connection.execute(text("""
                    CREATE INDEX ix_smoking_records_time 
                    ON smoking_records (time)
                """))
                
                connection.commit()
                print("✅ Time column added successfully!")
            else:
                print("⚠️  Time column already exists, skipping migration.")
                
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    print("Starting database migration to add time column...")
    migrate_add_time_column()
    print("Migration completed!")