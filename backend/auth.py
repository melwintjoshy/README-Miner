from datetime import datetime, timedelta
from fastapi import HTTPException
from jose import jwt, JWTError
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.config import get_settings
from backend.models import User

settings = get_settings()

class TokenData(BaseModel):
    sub: str
    email: str
    exp: int

ALGORITHM = "HS256"
TOKEN_HOURS = 12


def create_jwt(user_id: str, email: str, hours: int = TOKEN_HOURS) -> str:
    exp = datetime.utcnow() + timedelta(hours=hours)
    payload = {"sub": user_id, "email": email, "exp": int(exp.timestamp())}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def verify_jwt(token: str) -> TokenData:
    try:
        data = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return TokenData(**data)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def exchange_google_credential(credential: str, db: Session) -> str:
    try:
        info = id_token.verify_oauth2_token(
            credential, grequests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Google token invalid")

    user_id = info["sub"]
    email = info["email"]
    name = info.get("name", "")

    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        user = User(id=user_id, email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)

    return create_jwt(user_id, email)
