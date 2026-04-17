import pytest
from fastapi.testclient import TestClient
from backend.src.main import app
import uuid
from backend.src.config.database import Base, engine
import os

@pytest.fixture(scope="session", autouse=True)
def create_test_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Teunpass test test"}

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
    response = client.patch(f"/vaultitems/{created_item_id}", json={
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
    vaultitem = [item for item in data_get if item["vaultitem_id"] == created_item_id][0]
    assert vaultitem is not None
    assert vaultitem["e_title"] == "Updated Secret"
    assert vaultitem["e_url"] == "https://updated.com"

def test_update_vault_item_nonexistent(client):
    random_uuid = str(uuid.uuid4())
    response = client.patch(f"/vaultitems/{random_uuid}", json={
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
    
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Vault item not found"

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
    assert response.status_code == 400
    assert response.json() == {"detail": "Vault item not found"}
