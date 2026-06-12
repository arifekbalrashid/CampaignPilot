"""Authentication API — Google OAuth token verification."""

import logging

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GoogleLoginRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    email: str
    name: str
    picture: str | None = None


@router.post("/google", response_model=UserResponse)
async def google_login(req: GoogleLoginRequest):
    """Verify a Google ID token and return user info."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": req.credential},
            )

        if resp.status_code != 200:
            logger.warning(f"Google token verification failed: {resp.text}")
            raise HTTPException(401, "Invalid Google token")

        data = resp.json()

        # Verify the token has required fields
        email = data.get("email")
        name = data.get("name", email)
        picture = data.get("picture")

        if not email:
            raise HTTPException(401, "Token missing email claim")

        if data.get("email_verified") != "true":
            raise HTTPException(401, "Email not verified")

        logger.info(f"Google login successful for {email}")

        return UserResponse(email=email, name=name, picture=picture)

    except httpx.RequestError as e:
        logger.error(f"Failed to verify Google token: {e}")
        raise HTTPException(502, "Could not verify Google token")
