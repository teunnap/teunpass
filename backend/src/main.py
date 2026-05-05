import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.src.routes import vault_items, auth
from backend.src.middleware.security_headers import SecurityHeadersMiddleware

from backend.src.config.logger import get_logger

# Setup standard logger
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up...")
    # Startup seed test user
    from backend.src.config.database import SessionLocal
    from backend.src.models import user
    db = SessionLocal()
    try:
        test_user = db.query(user.User).filter(user.User.email == "test@example.com").first()
        import uuid
        if not test_user:
            new_user = user.User(
                id=uuid.UUID(int=1),
                email="test@example.com",
                master_password_hash="0" * 64,
                auth_salt="1" * 64,
                role=user.UserRole.premium
            )
            db.add(new_user)
            db.commit()
            logger.info("Test user created successfully.")
    except Exception:
        logger.exception("Error during startup")
        raise
    finally:
        db.close()
    
    yield
    
    logger.info("Application shutting down...")

app = FastAPI(title="Teunpass API", description="FastAPI + SQLAlchemy", lifespan=lifespan)

app.add_middleware(SecurityHeadersMiddleware)

# Allow React app connecting on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(vault_items.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    logger.debug("Health check / endpoint called")
    return {"message": "Teunpass test test"}
