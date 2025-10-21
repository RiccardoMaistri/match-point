import os
from sqlalchemy import create_engine, Column, String, JSON, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

    class TournamentDB(Base):
        __tablename__ = "tournaments"
        id = Column(String, primary_key=True)
        user_id = Column(String, index=True)
        data = Column(JSON)

    class UserDB(Base):
        __tablename__ = "users"
        id = Column(String, primary_key=True)
        email = Column(String, unique=True, index=True)
        data = Column(JSON)

    Base.metadata.create_all(bind=engine)

    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
