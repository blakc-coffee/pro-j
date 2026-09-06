from __future__ import annotations
from datetime import date, datetime, time
from datetime import date as dt_date, time as dt_time
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, Time, UniqueConstraint
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from database import Base
from pydantic import BaseModel

class Users(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    roll_no = Column(String(11), unique=True, nullable=True)
    email_id = Column(String(100), unique=True, nullable=True)
    name = Column(String(50), nullable=False)
    gender = Column(String(10), nullable=True)
    phone_no = Column(String(15), nullable=True)
    google_sub = Column(String(255), unique=True, nullable=True)


class CabQuery(Base):
    __tablename__ = "cab_query"

    cab_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    travel_date = Column(Date, nullable=False)
    dep_time = Column(Time, nullable=False)
    from_loc = Column(String(50), nullable=False)
    to_loc = Column(String(50), nullable=False)
    status = Column(String(10), nullable=False)
    seats_avbl = Column(Integer, nullable=False)

    user = relationship("Users", foreign_keys=[user_id])

    @property
    def user_name(self):
        return self.user.name if self.user else None

    @property
    def creator_name(self):
        return self.user.name if self.user else None

    @property
    def date(self):
        return self.travel_date

    @property
    def time(self):
        return self.dep_time


class CabRequests(Base):
    __tablename__ = "cab_requests"
    __table_args__ = (
        UniqueConstraint("cab_id", "req_user_id"),
    )

    cab_id = Column(Integer, ForeignKey("cab_query.cab_id"), nullable=False)
    req_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    req_id = Column(Integer, primary_key=True, nullable=False)
    status = Column(String(10), nullable=False)
    created_at = Column(DateTime, nullable=False)

    ride = relationship("CabQuery", foreign_keys=[cab_id], lazy="joined")
    req_user = relationship("Users", foreign_keys=[req_user_id], lazy="joined")

    @property
    def from_loc(self):
        return self.ride.from_loc if self.ride else None

    @property
    def to_loc(self):
        return self.ride.to_loc if self.ride else None

    @property
    def travel_date(self):
        return self.ride.travel_date if self.ride else None

    @property
    def date(self):
        return self.travel_date

    @property
    def dep_time(self):
        return self.ride.dep_time if self.ride else None

    @property
    def time(self):
        return self.dep_time

    @property
    def seats_avbl(self):
        return self.ride.seats_avbl if self.ride else None

    @property
    def creator_name(self):
        return self.ride.creator_name if self.ride else None

    @property
    def user_name(self):
        return self.req_user.name if self.req_user else None

    @property
    def name(self):
        return self.req_user.name if self.req_user else None

    @property
    def roll_no(self):
        return self.req_user.roll_no if self.req_user else None

    @property
    def user_id(self):
        return self.req_user_id

    @property
    def request_id(self):
        return self.req_id

    @property
    def id(self):
        return self.req_id


# =====================================================================
# HACK FIND SQLALCHEMY MODELS
# =====================================================================

class HackFindTeam(Base):
    __tablename__ = "hackfind_teams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    hackathon = Column(String(100), nullable=False)
    problem_statement = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    skills = Column(String(500), nullable=True)
    tech_stack = Column(String(500), nullable=True)
    max_members = Column(Integer, nullable=False, default=4)
    leader_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    contact = Column(String(200), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    leader = relationship("Users", foreign_keys=[leader_id])
    members = relationship("HackFindTeamMember", back_populates="team", cascade="all, delete-orphan")
    requests = relationship("HackFindTeamRequest", back_populates="team", cascade="all, delete-orphan")


class HackFindTeamMember(Base):
    __tablename__ = "hackfind_team_members"
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_hackfind_team_member"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey("hackfind_teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    role = Column(String(50), nullable=False, default="Member")
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    team = relationship("HackFindTeam", back_populates="members")
    user = relationship("Users", foreign_keys=[user_id])


class HackFindTeamRequest(Base):
    __tablename__ = "hackfind_team_requests"
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_hackfind_team_request"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey("hackfind_teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    role = Column(String(50), nullable=False, default="Applicant")
    skills = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # 'pending', 'accepted', 'rejected'
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    team = relationship("HackFindTeam", back_populates="requests")
    user = relationship("Users", foreign_keys=[user_id])


class HackFindProfile(Base):
    __tablename__ = "hackfind_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    role = Column(String(100), nullable=False)
    hackathon = Column(String(100), nullable=True, default="")
    skills = Column(String(500), nullable=True)
    tech_stack = Column(String(500), nullable=True)
    experience = Column(String(500), nullable=True)
    about = Column(Text, nullable=True)
    portfolio = Column(String(200), nullable=True)
    contact = Column(String(200), nullable=True)
    status = Column(String(20), nullable=False, default="open")  # 'open', 'occupied'
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("Users", foreign_keys=[user_id])


# =====================================================================
# LOST & FOUND SQLALCHEMY MODELS
# =====================================================================

class LostFoundItem(Base):
    __tablename__ = "lost_found_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)  # 'lost' | 'found'
    category = Column(String(50), nullable=False)  # 'Electronics', 'Cards & IDs', 'Keys', 'Clothing', 'Books', 'Other'
    location = Column(String(200), nullable=False)
    item_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    contact_info = Column(String(200), nullable=True)
    image_url = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    status = Column(String(20), nullable=False, default="open")  # 'open' | 'claimed' | 'resolved'
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("Users", foreign_keys=[user_id])
    messages = relationship("LostFoundMessage", back_populates="item", cascade="all, delete-orphan", order_by="LostFoundMessage.created_at.asc()")


class LostFoundMessage(Base):
    __tablename__ = "lost_found_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("lost_found_items.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    item = relationship("LostFoundItem", back_populates="messages")
    user = relationship("Users", foreign_keys=[user_id])


# =====================================================================
# PYDANTIC SCHEMAS
# =====================================================================

class UserLogin(BaseModel):
    email_id: str
    password: str
    
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
    model_config = {"from_attributes": True}

class UserContactUpdate(BaseModel):
    phone_no: str | None = None


class CabQueryOut(BaseModel):
    cab_id: int
    travel_date: dt_date
    user_id: int
    from_loc: str
    to_loc: str
    dep_time: dt_time
    status: str
    seats_avbl: int
    user_name: str | None = None
    creator_name: str | None = None
    date: dt_date | None = None
    time: dt_time | None = None
    model_config = {"from_attributes": True}

class CabQueryCreate(BaseModel):
    from_loc: str
    to_loc: str
    travel_date: dt_date | None = None
    date: dt_date | None = None
    dep_time: dt_time | None = None
    time: dt_time | None = None
    seats_avbl: int | None = None
    seats: int | None = None
    price: float | None = None
    notes: str | None = None

class CabQueryUpdate(BaseModel):
    travel_date: date | None = None
    from_loc: str | None = None
    to_loc: str | None = None
    dep_time: time | None = None
    seats_avbl: int | None = None


class CabRequestOut(BaseModel):
    cab_id: int
    req_user_id: int
    req_id: int
    status: str
    created_at: datetime
    from_loc: str | None = None
    to_loc: str | None = None
    travel_date: dt_date | None = None
    date: dt_date | None = None
    dep_time: dt_time | None = None
    time: dt_time | None = None
    seats_avbl: int | None = None
    creator_name: str | None = None
    user_name: str | None = None
    name: str | None = None
    roll_no: str | None = None
    user_id: int | None = None
    request_id: int | None = None
    id: int | None = None
    model_config = {"from_attributes": True}

class CabRequestUpdate(BaseModel):
    status: str


# =====================================================================
# HACK FIND PYDANTIC SCHEMAS
# =====================================================================

class TeamMemberOut(BaseModel):
    id: str
    name: str
    role: str = "Member"
    roll_no: str | None = None
    rollNo: str | None = None
    email: str | None = None

class TeamCreate(BaseModel):
    name: str
    hackathon: str
    problem_statement: str | None = None
    problemStatement: str | None = None
    description: str | None = None
    skills: list[str] | str | None = None
    tech_stack: list[str] | str | None = None
    techStack: list[str] | str | None = None
    max_members: int = 4
    maxMembers: int | None = None
    contact: str | None = None

class TeamOut(BaseModel):
    id: str
    name: str
    hackathon: str
    problem_statement: str | None = None
    problemStatement: str | None = None
    description: str | None = None
    skills: list[str] = []
    tech_stack: list[str] = []
    techStack: list[str] = []
    max_members: int = 4
    maxMembers: int = 4
    status: str = "looking_for_members"
    leader_id: str
    leaderId: str
    leader_name: str
    leaderName: str
    contact: str | None = None
    created_at: str
    createdAt: str
    members: list[TeamMemberOut] = []

class PersonCreate(BaseModel):
    role: str
    skills: list[str] | str
    contact: str
    hackathon: str | None = None
    tech_stack: list[str] | str | None = None
    techStack: list[str] | str | None = None
    experience: str | None = None
    about: str | None = None
    portfolio: str | None = None
    status: str = "open"

class PersonUpdate(BaseModel):
    role: str | None = None
    skills: list[str] | str | None = None
    contact: str | None = None
    hackathon: str | None = None
    tech_stack: list[str] | str | None = None
    techStack: list[str] | str | None = None
    experience: str | None = None
    about: str | None = None
    portfolio: str | None = None
    status: str | None = None

class PersonOut(BaseModel):
    id: str
    user_id: str
    userId: str
    name: str
    roll_no: str | None = None
    rollNo: str | None = None
    role: str
    hackathon: str | None = None
    skills: list[str] = []
    tech_stack: list[str] = []
    techStack: list[str] = []
    experience: str | None = None
    about: str | None = None
    portfolio: str | None = None
    contact: str | None = None
    status: str = "open"
    created_at: str
    createdAt: str

class JoinRequestCreate(BaseModel):
    notes: str | None = None
    role: str | None = "Team Member"
    skills: list[str] | str | None = None

class TeamInviteCreate(BaseModel):
    user_id: int | str | None = None
    userId: int | str | None = None
    candidate_id: int | str | None = None
    candidateId: int | str | None = None
    role: str | None = "Member"
    notes: str | None = None

class JoinRequestRespond(BaseModel):
    action: str | None = None
    status: str | None = None

class JoinRequestOut(BaseModel):
    id: str
    team_id: str
    teamId: str
    user_id: str
    userId: str
    name: str
    roll_no: str | None = None
    rollNo: str | None = None
    role: str = "Applicant"
    skills: list[str] = []
    notes: str | None = None
    status: str = "pending"
    created_at: str
    createdAt: str

class PendingRequestWithTeamOut(BaseModel):
    request: JoinRequestOut | None = None
    team: TeamOut | None = None
    id: str | None = None
    team_id: str | None = None
    teamId: str | None = None
    team_name: str | None = None
    teamName: str | None = None
    team_hackathon: str | None = None
    teamHackathon: str | None = None
    role: str = "Applicant"
    status: str = "pending"
    notes: str | None = None
    created_at: str | None = None
    createdAt: str | None = None

class MyTeamsOut(BaseModel):
    leading: list[TeamOut] = []
    joined: list[TeamOut] = []
    pending: list[PendingRequestWithTeamOut] = []


# =====================================================================
# LOST & FOUND PYDANTIC SCHEMAS
# =====================================================================

class MessageCreate(BaseModel):
    message: str

class MessageOut(BaseModel):
    id: int
    item_id: int
    user_id: int
    message: str
    created_at: datetime
    user_name: str | None = None
    user_roll_no: str | None = None
    model_config = {"from_attributes": True}

class ItemCreate(BaseModel):
    title: str
    type: str  # 'lost' | 'found'
    category: str  # 'Electronics' | 'Cards & IDs' | 'Keys' | 'Clothing' | 'Books' | 'Other'
    location: str
    item_date: date
    description: str | None = None
    contact_info: str | None = None
    image_url: str | None = None

class ItemUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    category: str | None = None
    location: str | None = None
    item_date: date | None = None
    description: str | None = None
    contact_info: str | None = None
    image_url: str | None = None

class ItemStatusUpdate(BaseModel):
    status: str  # 'open' | 'claimed' | 'resolved'

class ItemOut(BaseModel):
    id: int
    user_id: int
    title: str
    type: str
    category: str
    location: str
    item_date: date
    description: str | None = None
    contact_info: str | None = None
    image_url: str | None = None
    status: str
    created_at: datetime
    user_name: str | None = None
    user_roll_no: str | None = None
    messages: list[MessageOut] = []
    model_config = {"from_attributes": True}