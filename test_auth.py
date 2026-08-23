import os
from security import create_access_token, get_current_user, JWT_SECRET
import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from model import Base, Users
from time import sleep

class MockUser:
    def __init__(self, user_id):
        self.user_id = user_id

def mock_get_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    test_user = Users(user_id=1, roll_no="123", email_id="test@test.com", name="Test", gender="M", phone_no="1234567890")
    session.add(test_user)
    session.commit()
    return session

def test_jwt():
    db = mock_get_db()
    
    # 1. verify JWT creation
    data = {"sub": "1"}
    token = create_access_token(data)
    print("JWT Creation: SUCCESS")
    print(f"Token: {token}")

    # 2. verify JWT verification
    decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    if decoded.get("sub") == "1":
        print("JWT Verification: SUCCESS")
    
    # 3. verify get_current_user
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = get_current_user(credentials=creds, db=db)
    if user.user_id == 1:
        print("get_current_user with valid token: SUCCESS")
    
    # 4. verify invalid token rejection
    try:
        invalid_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid_token")
        get_current_user(credentials=invalid_creds, db=db)
        print("Invalid token rejection: FAILED")
    except HTTPException as e:
        if e.status_code == 401:
            print("Invalid token rejection: SUCCESS")
            
    # 5. verify expired token rejection
    import security
    security.ACCESS_TOKEN_EXPIRE_MINUTES = 0 # force expiration
    expired_token = security.create_access_token({"sub": "1"})
    sleep(1) # Ensure time passes slightly
    try:
        expired_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_token)
        security.get_current_user(credentials=expired_creds, db=db)
        print("Expired token rejection: FAILED")
    except HTTPException as e:
        if e.status_code == 401 and e.detail == "Token has expired":
            print("Expired token rejection: SUCCESS")

if __name__ == "__main__":
    test_jwt()
