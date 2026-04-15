import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from backend.src.routes import users
from backend.src.config.database import SessionLocal
from backend.src.models import user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup seed test user
    db = SessionLocal()
    try:
        test_user = db.query(user.User).filter(user.User.email == "test@example.com").first()
        if not test_user:
            new_user = user.User(
                email="test@example.com",
                master_password_hash="0" * 64,
                auth_salt="1" * 64,
                role=user.UserRole.premium
            )
            db.add(new_user)
            db.commit()
            logger.info("Test user created successfully.")
    finally:
        db.close()
    
    yield

app = FastAPI(title="Teunpass API", description="FastAPI + SQLAlchemy", lifespan=lifespan)

app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Teunpass test test"}
