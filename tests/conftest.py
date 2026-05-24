import pytest
from fastapi.testclient import TestClient
from backend.src.main import app
import uuid
import jwt
from datetime import datetime, timedelta, timezone
from backend.src.config.database import Base, get_db, DATABASE_URL
from backend.src.config.settings import settings
from backend.src.models.user import User, UserRole
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = DATABASE_URL + "_test"
TEST_USER_ID = uuid.UUID(int=1)

@pytest.fixture(scope="session")
def test_engine():
    # Setup test database once per session
    temp_engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT")
    with temp_engine.connect() as conn:
        conn.execute(text("DROP DATABASE IF EXISTS teunpass_test"))
        conn.execute(text("CREATE DATABASE teunpass_test"))
    temp_engine.dispose()

    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    
    yield engine

    Base.metadata.drop_all(bind=engine)
    engine.dispose()

@pytest.fixture(scope="function")
def db_session(test_engine):
    # Connect and begin transaction
    connection = test_engine.connect()
    transaction = connection.begin()
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()
    
    # Add a default user for all tests
    new_user = User(
        id=TEST_USER_ID,
        email="test@example.com",
        master_password_hash="0" * 64,
        auth_salt="1" * 64,
        role=UserRole.premium
    )
    session.add(new_user)
    session.commit()
    
    yield session
    
    session.close()
    # Rollback transaction so tests don't affect each other
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def auth_token():
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode = {"sub": str(TEST_USER_ID), "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@pytest.fixture(scope="function")
def auth_client(client, auth_token):
    client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return client
