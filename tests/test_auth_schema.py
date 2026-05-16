import pytest
from pydantic import ValidationError
from backend.src.schemas.auth import LoginRequest, RegisterRequest


def test_register_request_accepts_64_char_hex_values():
    payload = {
        "email": "test@example.com",
        "authentication_hash": "a" * 64,
        "auth_salt": "B" * 64
    }
    model = RegisterRequest.model_validate(payload)
    assert model.authentication_hash == payload["authentication_hash"]
    assert model.auth_salt == payload["auth_salt"]


@pytest.mark.parametrize(
    "authentication_hash,auth_salt",
    [
        ("", "a" * 64),
        ("a" * 63, "a" * 64),
        ("a" * 65, "a" * 64),
        ("g" * 64, "a" * 64),
        ("a" * 64, ""),
        ("a" * 64, "a" * 63),
        ("a" * 64, "a" * 65),
        ("a" * 64, "z" * 64),
    ],
)
def test_register_request_rejects_invalid_hash_or_salt(authentication_hash, auth_salt):
    with pytest.raises(ValidationError):
        RegisterRequest.model_validate(
            {
                "email": "test@example.com",
                "authentication_hash": authentication_hash,
                "auth_salt": auth_salt,
            }
        )


@pytest.mark.parametrize("authentication_hash", ["", "a" * 63, "a" * 65, "x" * 64])
def test_login_request_rejects_invalid_authentication_hash(authentication_hash):
    with pytest.raises(ValidationError):
        LoginRequest.model_validate(
            {
                "email": "test@example.com",
                "authentication_hash": authentication_hash,
            }
        )
