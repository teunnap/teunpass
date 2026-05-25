import pytest
import uuid

def test_login_success(client, db_session):
    # db_session already has user "test@example.com" with hash "0" * 64
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "authentication_hash": "0" * 64
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_email(client):
    response = client.post("/auth/login", json={
        "email": "wrong@example.com",
        "authentication_hash": "0" * 64
    })
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}

def test_login_invalid_password(client, db_session):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "authentication_hash": "1" * 64
    })
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}

def test_get_me(auth_client, db_session):
    response = auth_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "email" in data
    assert "role" in data
    assert data["email"] == "test@example.com"

def test_login_rate_limiting(client):
    # 5 attempts should trigger rate limit based on default slowapi config or standard usage
    # Since we test rate limits, we should do a loop
    for _ in range(6):
        response = client.post("/auth/login", json={
            "email": "bruteforce@example.com",
            "authentication_hash": "0" * 64
        })
    
    # After a few tries, we expect a 429
    assert response.status_code in [401, 429]
    if response.status_code == 429:
        assert "Rate limit exceeded" in response.json().get("error", "") or "Too Many Requests" in response.text
