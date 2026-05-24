from backend.src.middleware.security_headers import SecurityHeadersMiddleware
from fastapi import FastAPI
from fastapi.testclient import TestClient

def test_security_headers_middleware():
    app = FastAPI()
    app.add_middleware(SecurityHeadersMiddleware)
    
    @app.get("/")
    def root():
        return {"msg": "ok"}
        
    client = TestClient(app)
    response = client.get("/")
    
    assert response.status_code == 200
    headers = response.headers
    
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert "Strict-Transport-Security" in headers
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Permissions-Policy" in headers
