import os
from typing import Optional

import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException, status

PROJECT_REF = "rnfllusylhuzshbcqvsv"

JWKS_URL = os.getenv(
    "SUPABASE_JWKS_URL",
    f"https://{PROJECT_REF}.supabase.co/auth/v1/.well-known/jwks.json",
)
ISSUER = os.getenv(
    "SUPABASE_ISSUER",
    f"https://{PROJECT_REF}.supabase.co/auth/v1",
)

_jwk_client = PyJWKClient(JWKS_URL)

def get_current_user_id(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()

    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token).key
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            issuer=ISSUER,
            options={"verify_aud": False},
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub")
    return user_id
