from sqlalchemy import UniqueConstraint,Column, Integer, String,ForeignKey,Date,Time,DateTime
from database import Base
from pydantic import BaseModel
from datetime import date, datetime,time
class Users(Base):
    __tablename__ ="users"

    user_id=Column(Integer,primary_key=True)
    roll_no=Column(String(11),unique=True,nullable=True)
    email_id=Column(String(100),unique=True,nullable=True)
    name=Column(String(50),nullable=False)
    gender=Column(String(10),nullable=True)
    phone_no=Column(String(15),nullable=True)
    google_sub=Column(String(255),unique=True,nullable=True)

class CabQuery(Base):
    __tablename__ ="cab_query"

    cab_id=Column(Integer,primary_key=True)
    user_id=Column(Integer,ForeignKey("users.user_id"),nullable= False)
    travel_date = Column(Date, nullable=False)
    dep_time = Column(Time, nullable=False)
    from_loc=Column(String(50),nullable=False)
    to_loc=Column(String(50),nullable=False)
    status=Column(String(10),nullable=False)
    seats_avbl=Column(Integer,nullable=False)

class CabRequests(Base):
    __tablename__="cab_requests"
    __table_args__ = (
            UniqueConstraint("cab_id","req_user_id"),
        )

    cab_id=Column(Integer,ForeignKey("cab_query.cab_id"),nullable=False)
    req_user_id=Column(Integer,ForeignKey("users.user_id"),nullable=False)
    req_id=Column(Integer,primary_key=True,nullable=False)
    status=Column(String(10),nullable=False)
    created_at=Column(DateTime,nullable=False)


class UserLogin(BaseModel):
    email_id: str
    password:str
    
class GoogleAuthRequest(BaseModel):
    id_token: str

class AuthResponse(BaseModel):
    access_token: str
    user_id: int
    roll_no: str | None = None
    email_id: str | None = None
    name: str
    onboarding_required: bool

class UserPublicOut(BaseModel):
    user_id: int
    roll_no: str | None = None
    name: str
    phone_no: str | None = None
    email_id: str | None = None
    gender: str | None = None
    model_config={"from_attributes":True}


class CabQueryOut(BaseModel):

    cab_id: int
    travel_date:date
    user_id:int
    from_loc: str
    to_loc: str
    dep_time: time
    status: str
    seats_avbl: int
    model_config={"from_attributes":True}

class CabQueryCreate(BaseModel):

    travel_date:date
    from_loc: str
    to_loc: str
    dep_time: time
    seats_avbl: int

class CabQueryUpdate(BaseModel):

    travel_date:date | None =None
    from_loc: str | None =None
    to_loc: str |None =None
    dep_time: time |None =None
    seats_avbl: int |None =None


class CabRequestOut(BaseModel):
    cab_id: int
    req_user_id:int
    req_id: int
    status:str
    created_at: datetime
    model_config={"from_attributes":True}

class CabRequestUpdate(BaseModel):
    status:str 

    