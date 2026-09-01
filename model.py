from datetime import date, datetime, time
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, Time, UniqueConstraint
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
    hackathon = Column(String(100), nullable=False)
    skills = Column(String(500), nullable=True)
    tech_stack = Column(String(500), nullable=True)
    experience = Column(String(500), nullable=True)
    about = Column(Text, nullable=True)
    portfolio = Column(String(200), nullable=True)
    contact = Column(String(200), nullable=True)
    status = Column(String(20), nullable=False, default="open_to_join")  # 'open_to_join', 'team_found'
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

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
    travel_date: date
    user_id: int
    from_loc: str
    to_loc: str
    dep_time: time
    status: str
    seats_avbl: int
    model_config = {"from_attributes": True}

class CabQueryCreate(BaseModel):
    travel_date: date
    from_loc: str
    to_loc: str
    dep_time: time
    seats_avbl: int

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
    hackathon: str
    skills: list[str] | str | None = None
    tech_stack: list[str] | str | None = None
    techStack: list[str] | str | None = None
    experience: str | None = None
    about: str | None = None
    portfolio: str | None = None
    contact: str | None = None
    status: str = "open_to_join"

class PersonOut(BaseModel):
    id: str
    user_id: str
    userId: str
    name: str
    roll_no: str | None = None
    rollNo: str | None = None
    role: str
    hackathon: str
    skills: list[str] = []
    tech_stack: list[str] = []
    techStack: list[str] = []
    experience: str | None = None
    about: str | None = None
    portfolio: str | None = None
    contact: str | None = None
    status: str = "open_to_join"
    created_at: str
    createdAt: str

class JoinRequestCreate(BaseModel):
    notes: str | None = None
    role: str | None = "Team Member"
    skills: list[str] | str | None = None

class JoinRequestRespond(BaseModel):
    action: str  # 'accepted' | 'rejected'

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
    request: JoinRequestOut
    team: TeamOut

class MyTeamsOut(BaseModel):
    leading: list[TeamOut] = []
    joined: list[TeamOut] = []
    pending: list[PendingRequestWithTeamOut] = []