import pytest
from fastapi.testclient import TestClient
from backend.src.main import app
import uuid
import jwt
from datetime import datetime, timedelta, timezone
from backend.src.config.database import Base, engine, get_db, DATABASE_URL
from backend.src.config.settings import settings
from backend.src.models.user import User, UserRole
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = DATABASE_URL + "_test"
TEST_USER_ID = uuid.UUID(int=1)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    temp_engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT")
    with temp_engine.connect() as conn:
        conn.execute(text("DROP DATABASE IF EXISTS teunpass_test"))
        conn.execute(text("CREATE DATABASE teunpass_test"))
    temp_engine.dispose()

    test_engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=test_engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    new_user = User(
        id=TEST_USER_ID,
        email="test@example.com",
        master_password_hash="0" * 64,
        auth_salt="1" * 64,
        role=UserRole.premium
    )
    db.add(new_user)
    db.commit()
    db.close()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db

    yield

    # 4. Cleanup
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()

@pytest.fixture(scope="session")
def auth_token():
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode = {"sub": str(TEST_USER_ID), "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@pytest.fixture(scope="module")
def client(auth_token):
    with TestClient(app, headers={"Authorization": f"Bearer {auth_token}"}) as c:
        yield c

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Teunpass test test"}

def test_unauthenticated_access_is_rejected():
    with TestClient(app) as c:
        response = c.get("/vaultitems/")
    assert response.status_code == 403

created_item_id = None

def test_create_vault_item(client):
    global created_item_id
    response = client.post("/vaultitems/create", json={
        "e_title": "Pytest Secret",
        "e_url": "https://pytest.org",
        "e_username": "testuser",
        "e_password": "supersecretpassword",
        "custom_fields": [
            {
                "e_key": "recovery_code",
                "e_value": "12345-67890"
            }
        ]
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["e_title"] == "Pytest Secret"
    assert "vaultitem_id" in data
    assert len(data["custom_fields"]) == 1
    assert data["custom_fields"][0]["e_key"] == "recovery_code"
    
    created_item_id = data["vaultitem_id"]

def test_get_vault_items(client):
    response = client.get("/vaultitems/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    retrieved_ids = [item["vaultitem_id"] for item in data]
    assert created_item_id in retrieved_ids

def test_update_vault_item(client):
    response = client.put(f"/vaultitems/{created_item_id}", json={
        "e_title": "Updated Secret",
        "e_url": "https://updated.com",
        "e_username": "updateduser",
        "e_password": "updatedpassword",
        "custom_fields": [
            {
                "e_key": "recovery_code",
                "e_value": "12345-67890"
            }
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["e_title"] == "Updated Secret"
    assert data["e_url"] == "https://updated.com"

    response_get = client.get(f"/vaultitems/")
    assert response_get.status_code == 200
    data_get = response_get.json()
    vaultitem = next((item for item in data_get if item["vaultitem_id"] == created_item_id), None)
    assert vaultitem is not None, f"Updated vault item with id {created_item_id} was not found in /vaultitems/ response"
    assert vaultitem["e_title"] == "Updated Secret"
    assert vaultitem["e_url"] == "https://updated.com"

def test_update_vault_item_nonexistent(client):
    random_uuid = str(uuid.uuid4())
    response = client.put(f"/vaultitems/{random_uuid}", json={
        "e_title": "Updated Secret",
        "e_url": "https://updated.com",
        "e_username": "updateduser",
        "e_password": "updatedpassword",
        "custom_fields": [
            {
                "e_key": "recovery_code",
                "e_value": "12345-67890"
            }
        ]
    })
    
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Vault item not found"

def test_update_vault_item_invalid_url(client):
    response = client.put(f"/vaultitems/{created_item_id}", json={
        "e_title": "Updated Secret",
        "e_url": "invalid-url",
        "e_username": "updateduser",
        "e_password": "updatedpassword",
        "custom_fields": [
            {
                "e_key": "recovery_code",
                "e_value": "12345-67890"
            }
        ]
    })

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid URL format"}

def test_delete_vault_item(client):
    response = client.delete(f"/vaultitems/{created_item_id}")
    assert response.status_code == 204
    
    response_get = client.get("/vaultitems/")
    data = response_get.json()
    retrieved_ids = [item["vaultitem_id"] for item in data]
    assert created_item_id not in retrieved_ids

def test_delete_nonexistent_vault_item(client):
    random_uuid = str(uuid.uuid4())
    response = client.delete(f"/vaultitems/{random_uuid}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Vault item not found"}
