from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

from backend.src.config.logger import get_logger
logger = get_logger(__name__)

DATABASE_URL = os.environ["DATABASE_URL"]

logger.info("Initializing database engine")
engine = create_engine(
    DATABASE_URL, pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get the database session
def get_db():
    logger.debug("Acquiring database session")
    db = SessionLocal()
    try:
        yield db
    finally:
        logger.debug("Closing database session")
        db.close()
