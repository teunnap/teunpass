import pytest
from fastapi.testclient import TestClient
from backend.src.main import app
import uuid

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Teunpass test test"}

def test_create_vault_item(client):
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
    
    assert response.status_code == 200
    data = response.json()
    assert data["e_title"] == "Pytest Secret"
    assert "vaultitem_id" in data
    assert len(data["custom_fields"]) == 1
    assert data["custom_fields"][0]["e_key"] == "recovery_code"

def test_get_vault_items(client):
    response = client.get("/vaultitems/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # At least the one we just created should be present
    assert len(data) >= 1
