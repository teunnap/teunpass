import pytest
import uuid

def test_unauthenticated_access_is_rejected(client):
    response = client.get("/vaultitems/")
    assert response.status_code == 403

def test_create_vault_item(auth_client):
    response = auth_client.post("/vaultitems/create", json={
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

def test_get_vault_items(auth_client):
    # Setup: create an item
    create_resp = auth_client.post("/vaultitems/create", json={
        "e_title": "My Secret", "e_url": "https://example.com",
        "e_username": "user", "e_password": "password",
        "custom_fields": []
    })
    item_id = create_resp.json()["vaultitem_id"]

    response = auth_client.get("/vaultitems/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    retrieved_ids = [item["vaultitem_id"] for item in data]
    assert item_id in retrieved_ids

def test_update_vault_item(auth_client):
    # Setup: create an item
    create_resp = auth_client.post("/vaultitems/create", json={
        "e_title": "Old Secret", "e_url": "https://old.com",
        "e_username": "user", "e_password": "password", "custom_fields": []
    })
    item_id = create_resp.json()["vaultitem_id"]

    response = auth_client.put(f"/vaultitems/{item_id}", json={
        "e_title": "Updated Secret",
        "e_url": "https://updated.com",
        "e_username": "updateduser",
        "e_password": "updatedpassword",
        "custom_fields": [
            {"e_key": "recovery_code", "e_value": "12345"}
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["e_title"] == "Updated Secret"
    assert data["e_url"] == "https://updated.com"

    response_get = auth_client.get(f"/vaultitems/")
    data_get = response_get.json()
    vaultitem = next((item for item in data_get if item["vaultitem_id"] == item_id), None)
    assert vaultitem is not None
    assert vaultitem["e_title"] == "Updated Secret"
    assert vaultitem["e_url"] == "https://updated.com"

def test_update_vault_item_nonexistent(auth_client):
    random_uuid = str(uuid.uuid4())
    response = auth_client.put(f"/vaultitems/{random_uuid}", json={
        "e_title": "Updated Secret", "e_url": "https://updated.com",
        "e_username": "updateduser", "e_password": "updatedpassword",
        "custom_fields": []
    })
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Vault item not found"

def test_update_vault_item_invalid_url(auth_client):
    create_resp = auth_client.post("/vaultitems/create", json={
        "e_title": "My Secret", "e_url": "https://example.com",
        "e_username": "user", "e_password": "password", "custom_fields": []
    })
    item_id = create_resp.json()["vaultitem_id"]

    response = auth_client.put(f"/vaultitems/{item_id}", json={
        "e_title": "Updated Secret", "e_url": "invalid-url",
        "e_username": "updateduser", "e_password": "updatedpassword",
        "custom_fields": []
    })
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid URL format"}

def test_delete_vault_item(auth_client):
    create_resp = auth_client.post("/vaultitems/create", json={
        "e_title": "To Delete", "e_url": "https://example.com",
        "e_username": "user", "e_password": "password", "custom_fields": []
    })
    item_id = create_resp.json()["vaultitem_id"]

    response = auth_client.delete(f"/vaultitems/{item_id}")
    assert response.status_code == 204
    
    response_get = auth_client.get("/vaultitems/")
    data = response_get.json()
    retrieved_ids = [item["vaultitem_id"] for item in data]
    assert item_id not in retrieved_ids

def test_delete_nonexistent_vault_item(auth_client):
    random_uuid = str(uuid.uuid4())
    response = auth_client.delete(f"/vaultitems/{random_uuid}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Vault item not found"}
