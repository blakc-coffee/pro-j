from datetime import datetime, timedelta
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as std_requests
import re
from sqlalchemy import or_
from model import (
    CabQuery, CabQueryOut, CabQueryCreate, CabQueryUpdate,
    CabRequestOut, CabRequestUpdate, CabRequests,
    UserLogin, GoogleAuthRequest, AuthResponse, Users,
    UserPublicOut, UserContactUpdate,
    HackFindTeam, HackFindTeamMember, HackFindTeamRequest, HackFindProfile,
    TeamCreate, TeamOut, TeamMemberOut,
    PersonCreate, PersonUpdate, PersonOut,
    JoinRequestCreate, JoinRequestRespond, JoinRequestOut,
    PendingRequestWithTeamOut, MyTeamsOut,
    LostFoundItem, LostFoundMessage, ItemCreate, ItemUpdate, ItemStatusUpdate, ItemOut,
    MessageCreate, MessageOut
)
from database import get_db
from security import create_access_token, get_current_user

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cabride = [
    {"loc": "madurai", "id": 1, "date": "01/01/2001"},
    {"loc": "TVM", "id": 2, "date": "07/07/2007"},
    {"loc": "kottayam", "id": 3, "date": "02/02/2002"}
]

@app.get("/")
def root():
    return {"status": "ok", "service": "Plattayam Backend API"}

@app.post("/login", status_code=200)
def login(creds: UserLogin, db=Depends(get_db)):
    email_id = creds.email_id
    password = creds.password
    if email_id == "user@iiitkottayam.ac.in" and password == "qwert12345":
        return "Succesfull login"
    else:
        raise HTTPException(status_code=401, detail="invalid user details")

@app.post("/auth/google", response_model=AuthResponse)
def auth_google(req: GoogleAuthRequest, db=Depends(get_db)):
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not client_id:
            raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not set")
            
        idinfo = id_token.verify_oauth2_token(req.id_token, requests.Request(), client_id)
        
        if not idinfo.get('email_verified', False):
            raise HTTPException(status_code=401, detail="Email not verified by Google")
            
        google_sub = idinfo['sub']
        email = idinfo.get('email')
        name = idinfo.get('name', 'Google User')

        user = db.query(Users).filter(Users.google_sub == google_sub).first()

        if not user:
            if email:
                user = db.query(Users).filter(Users.email_id == email).first()
                if user:
                    user.google_sub = google_sub
                    db.commit()
                    db.refresh(user)

        if not user:
            if not email:
                raise HTTPException(status_code=400, detail="Google token does not contain an email")
            
            inferred_roll_no = email.split('@')[0] if email else None
            
            user = Users(
                email_id=email,
                name=name,
                google_sub=google_sub,
                roll_no=inferred_roll_no,
                gender=None,
                phone_no=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        onboarding_required = user.roll_no is None or user.gender is None or user.phone_no is None
        
        access_token = create_access_token({"sub": str(user.user_id)})
        
        return AuthResponse(
            access_token=access_token,
            user_id=user.user_id,
            roll_no=user.roll_no,
            email_id=user.email_id,
            name=user.name,
            onboarding_required=onboarding_required
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

@app.post("/auth/login", response_model=AuthResponse)
def auth_lms(creds: UserLogin, db=Depends(get_db)):
    username = creds.email_id
    password = creds.password
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
        
    origin = "https://lmsug24.iiitkottayam.ac.in"
    if username.startswith("20") and len(username) >= 4:
        year_str = username[2:4]
        if year_str.isdigit():
            origin = f"https://lmsug{year_str}.iiitkottayam.ac.in"
            
    session = std_requests.Session()
    try:
        login_url = f"{origin}/login/index.php"
        resp1 = session.get(login_url, timeout=10)
        resp1.raise_for_status()
        
        token_match = re.search(r'name="logintoken"\s+value="([^"]+)"', resp1.text)
        if not token_match:
            token_match = re.search(r'value="([^"]+)"\s+name="logintoken"', resp1.text)
            
        if not token_match:
            raise HTTPException(status_code=500, detail="Could not find logintoken")
            
        logintoken = token_match.group(1)
        
        post_data = {
            "anchor": "",
            "logintoken": logintoken,
            "username": username,
            "password": password
        }
        
        resp2 = session.post(login_url, data=post_data, timeout=10)
        resp2.raise_for_status()
        
        html2 = resp2.text
        if "loginerrormessage" in html2 or "Invalid login" in html2 or "name=\"logintoken\"" in html2:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        resp3 = session.get(f"{origin}/my/", timeout=10)
        resp3.raise_for_status()
        html3 = resp3.text
        
        name_match = re.search(r'class="usertext[^>]*>\s*([^<]+)\s*<', html3)
        name = name_match.group(1).strip() if name_match else None
        
        if not name:
             name_match = re.search(r'userpicture.*?alt="Picture of ([^"]+)"', html3)
             name = name_match.group(1).strip() if name_match else None
             
        email_match = re.search(r'mailto:([^"]+)', html3)
        email = email_match.group(1) if email_match else None
        
        user = db.query(Users).filter(Users.roll_no == username).first()
        
        if not user:
            user = Users(
                roll_no=username,
                email_id=email,
                name=name or username,
                gender=None,
                phone_no=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        onboarding_required = user.gender is None or user.phone_no is None
        
        access_token = create_access_token({"sub": str(user.user_id)})
        
        return AuthResponse(
            access_token=access_token,
            user_id=user.user_id,
            roll_no=user.roll_no,
            email_id=user.email_id,
            name=user.name,
            onboarding_required=onboarding_required
        )
        
    except std_requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"LMS connection error: {str(e)}")

# =====================================================================
# CABS API
# =====================================================================

@app.post("/cab-queries", response_model=CabQueryOut)
def add_ride(new_ride: CabQueryCreate, db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    t_date = new_ride.travel_date or new_ride.date
    if not t_date:
        raise HTTPException(status_code=422, detail="travel_date is required")
        
    d_time = new_ride.dep_time or new_ride.time
    if not d_time:
        raise HTTPException(status_code=422, detail="dep_time is required")
        
    seats = new_ride.seats_avbl if new_ride.seats_avbl is not None else new_ride.seats
    if seats is None:
        raise HTTPException(status_code=422, detail="seats_avbl is required")

    from_loc_val = (new_ride.from_loc or "").strip()
    if not from_loc_val:
        raise HTTPException(status_code=422, detail="from_loc is required")
    if len(from_loc_val) > 50:
        raise HTTPException(status_code=422, detail=f"from_loc cannot exceed 50 characters (got {len(from_loc_val)})")

    to_loc_val = (new_ride.to_loc or "").strip()
    if not to_loc_val:
        raise HTTPException(status_code=422, detail="to_loc is required")
    if len(to_loc_val) > 50:
        raise HTTPException(status_code=422, detail=f"to_loc cannot exceed 50 characters (got {len(to_loc_val)})")

    try:
        ride_row = CabQuery(
            travel_date=t_date,
            dep_time=d_time,
            from_loc=from_loc_val,
            to_loc=to_loc_val,
            seats_avbl=seats,
            user_id=current_user.user_id,
            status="open"
        )
        db.add(ride_row)
        db.commit()
        db.refresh(ride_row)
        return ride_row
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to post ride: {str(e)}")

@app.patch('/cab-queries/{cab_id}', response_model=CabQueryOut)
def update_ride(cab_id: int, updates: CabQueryUpdate, db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    query = db.query(CabQuery).filter(CabQuery.cab_id == cab_id).first()
    if query is None:
        raise HTTPException(status_code=404, detail="Ride not found")
    if query.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this ride")
    changes = updates.model_dump(exclude_unset=True)

    for key, value in changes.items():
        setattr(query, key, value)

    db.commit()
    db.refresh(query)
    return query

@app.delete("/cab-queries/{cab_id}", status_code=204)
def delete_ride(cab_id: int, db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    query = db.query(CabQuery).filter(CabQuery.cab_id == cab_id).first()
    if query is None:
        raise HTTPException(status_code=404, detail="Ride doesnt exist")
    if query.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this ride")
    try:
        db.query(CabRequests).filter(CabRequests.cab_id == cab_id).delete(synchronize_session=False)
        db.delete(query)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to cancel ride: {str(e)}")

@app.get("/cab-queries", response_model=list[CabQueryOut])
def search_location(loc: str = None, db=Depends(get_db)):
    query = db.query(CabQuery)
    if loc is not None:
        query = query.filter(or_(
            CabQuery.from_loc.ilike(f"%{loc}%"),
            CabQuery.to_loc.ilike(f"%{loc}%")
        ))
    return query.order_by(CabQuery.cab_id.desc()).all()

@app.get("/cab-queries/{cab_id}", response_model=CabQueryOut)
def search_cab(cab_id: int, db=Depends(get_db)):
    query = db.query(CabQuery).filter(CabQuery.cab_id == cab_id).first()
    if query is None:
        raise HTTPException(status_code=404, detail="Ride not found")
    return query

@app.get("/users/{user_id}", response_model=UserPublicOut)
def get_user_profile(user_id: int, db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.patch("/users/me", response_model=UserPublicOut)
def update_my_profile(
    update_data: UserContactUpdate,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    if update_data.phone_no is not None:
        current_user.phone_no = update_data.phone_no.strip() or None
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/users/me/cab-queries", response_model=list[CabQueryOut])
def me_cab_query(db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    user_id = current_user.user_id
    query = db.query(CabQuery).filter(CabQuery.user_id == user_id).order_by(CabQuery.cab_id.desc()).all()
    return query

@app.get('/users/me/cab-requests', response_model=list[CabRequestOut])
def my_requests(db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    req_user_id = current_user.user_id
    query = db.query(CabRequests).filter(CabRequests.req_user_id == req_user_id).order_by(CabRequests.req_id.desc()).all()
    return query

@app.post("/cab-queries/{cab_id}/request", response_model=CabRequestOut)
def create_request(cab_id: int, db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    req_user_id = current_user.user_id
    query = db.query(CabQuery).filter(CabQuery.cab_id == cab_id).first()
    if query is None:
        raise HTTPException(status_code=404, detail="ride does not exist")
    elif query.user_id == req_user_id:
        raise HTTPException(status_code=403, detail="Cannot request your own ride")
    else:
        query = db.query(CabRequests).filter(
            CabRequests.req_user_id == req_user_id,
            CabRequests.cab_id == cab_id
        ).first()
        if query is not None:
            raise HTTPException(status_code=409, detail="Request Already Exists")
        req_row = CabRequests(
            cab_id=cab_id,
            req_user_id=req_user_id,
            status="open",
            created_at=datetime.now()
        )

    db.add(req_row)
    db.commit()
    db.refresh(req_row)
    return req_row

@app.patch("/cab-requests/{request_id}", response_model=CabRequestOut)
def update_request(request_id: int, update: CabRequestUpdate, db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    query = db.query(CabRequests).filter(CabRequests.req_id == request_id).first()
    if query is None:
        raise HTTPException(status_code=404, detail="Request not Found")
        
    ride = db.query(CabQuery).filter(CabQuery.cab_id == query.cab_id).first()
    if ride.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only the driver can update request status")
    
    if update.status == "Accepted" and query.status != "Accepted":
        ride = db.query(CabQuery).filter(CabQuery.cab_id == query.cab_id).first()
        if ride.seats_avbl > 0:
            ride.seats_avbl -= 1
            setattr(query, "status", update.status)
        else:
            raise HTTPException(status_code=409, detail="No seats Available")
    else:
        setattr(query, "status", update.status)

    db.commit()
    db.refresh(query)
    return query

@app.delete("/cab-requests/{request_id}", status_code=204)
def delete_request(request_id: int, db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    query = db.query(CabRequests).filter(CabRequests.req_id == request_id).first()
    if query is None:
        raise HTTPException(status_code=404, detail="Request Not Found")
    if query.req_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this request")

    db.delete(query)
    db.commit()

@app.get("/cab-queries/{cab_id}/requests", response_model=list[CabRequestOut])
def view_requests(cab_id: int, db=Depends(get_db), current_user: Users = Depends(get_current_user)):
    ride = db.query(CabQuery).filter(CabQuery.cab_id == cab_id).first()
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride Not Found")
    if ride.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only the driver can view requests for this ride")
    query = db.query(CabRequests).filter(CabRequests.cab_id == cab_id).all()
    return query


# =====================================================================
# HACK FIND SERIALIZER HELPERS
# =====================================================================

def parse_list(val) -> list[str]:
    if not val:
        return []
    if isinstance(val, list):
        return [str(s).strip() for s in val if str(s).strip()]
    return [s.strip() for s in str(val).split(",") if s.strip()]

def format_list(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, list):
        items = [str(s).strip() for s in val if str(s).strip()]
        return ", ".join(items) if items else None
    s = str(val).strip()
    return s if s else None

def serialize_team(team: HackFindTeam, db) -> TeamOut:
    members = db.query(HackFindTeamMember).filter(HackFindTeamMember.team_id == team.id).all()
    member_outs = []
    for m in members:
        user = db.query(Users).filter(Users.user_id == m.user_id).first()
        name = user.name if user else f"User {m.user_id}"
        roll_no = user.roll_no if user else None
        email = user.email_id if user else None
        member_outs.append(TeamMemberOut(
            id=str(m.user_id),
            name=name,
            role=m.role or "Member",
            roll_no=roll_no,
            rollNo=roll_no,
            email=email
        ))

    leader = db.query(Users).filter(Users.user_id == team.leader_id).first()
    leader_name = leader.name if leader else f"User {team.leader_id}"

    status = "full" if len(members) >= team.max_members else "looking_for_members"
    skills_list = parse_list(team.skills)
    tech_list = parse_list(team.tech_stack)
    created_str = team.created_at.isoformat() if team.created_at else datetime.utcnow().isoformat()

    return TeamOut(
        id=str(team.id),
        name=team.name,
        hackathon=team.hackathon,
        problem_statement=team.problem_statement,
        problemStatement=team.problem_statement,
        description=team.description,
        skills=skills_list,
        tech_stack=tech_list,
        techStack=tech_list,
        max_members=team.max_members,
        maxMembers=team.max_members,
        status=status,
        leader_id=str(team.leader_id),
        leaderId=str(team.leader_id),
        leader_name=leader_name,
        leaderName=leader_name,
        contact=team.contact,
        created_at=created_str,
        createdAt=created_str,
        members=member_outs
    )

def normalize_availability_status(val: str | None) -> str:
    if not val:
        return "open"
    v = str(val).strip().lower()
    if v in ("occupied", "team_found"):
        return "occupied"
    return "open"

def serialize_person(prof: HackFindProfile, db) -> PersonOut:
    user = db.query(Users).filter(Users.user_id == prof.user_id).first()
    name = user.name if user else f"User {prof.user_id}"
    roll_no = user.roll_no if user else None
    skills_list = parse_list(prof.skills)
    tech_list = parse_list(prof.tech_stack)
    created_str = prof.created_at.isoformat() if prof.created_at else datetime.utcnow().isoformat()
    status = normalize_availability_status(prof.status)

    return PersonOut(
        id=str(prof.id),
        user_id=str(prof.user_id),
        userId=str(prof.user_id),
        name=name,
        roll_no=roll_no,
        rollNo=roll_no,
        role=prof.role,
        hackathon=prof.hackathon,
        skills=skills_list,
        tech_stack=tech_list,
        techStack=tech_list,
        experience=prof.experience,
        about=prof.about,
        portfolio=prof.portfolio,
        contact=prof.contact,
        status=status,
        created_at=created_str,
        createdAt=created_str
    )

def serialize_request(req: HackFindTeamRequest, db) -> JoinRequestOut:
    user = db.query(Users).filter(Users.user_id == req.user_id).first()
    name = user.name if user else f"User {req.user_id}"
    roll_no = user.roll_no if user else None
    skills_list = parse_list(req.skills)
    created_str = req.created_at.isoformat() if req.created_at else datetime.utcnow().isoformat()

    return JoinRequestOut(
        id=str(req.id),
        team_id=str(req.team_id),
        teamId=str(req.team_id),
        user_id=str(req.user_id),
        userId=str(req.user_id),
        name=name,
        roll_no=roll_no,
        rollNo=roll_no,
        role=req.role or "Applicant",
        skills=skills_list,
        notes=req.notes,
        status=req.status or "pending",
        created_at=created_str,
        createdAt=created_str
    )


# =====================================================================
# HACK FIND API ENDPOINTS
# =====================================================================

@app.get("/hackfind/teams", response_model=list[TeamOut])
def list_hackfind_teams(
    search: str | None = None,
    filter: str | None = None,
    db=Depends(get_db)
):
    query = db.query(HackFindTeam)
    if search and search.strip():
        q = f"%{search.strip()}%"
        query = query.filter(or_(
            HackFindTeam.name.ilike(q),
            HackFindTeam.hackathon.ilike(q),
            HackFindTeam.problem_statement.ilike(q),
            HackFindTeam.description.ilike(q),
            HackFindTeam.skills.ilike(q),
            HackFindTeam.tech_stack.ilike(q),
        ))
    teams = query.order_by(HackFindTeam.created_at.desc()).all()
    serialized = [serialize_team(t, db) for t in teams]
    if filter == "Looking for members":
        serialized = [t for t in serialized if t.status == "looking_for_members"]
    elif filter == "Full":
        serialized = [t for t in serialized if t.status == "full"]
    return serialized

@app.get("/hackfind/teams/{team_id}", response_model=TeamOut)
def get_hackfind_team(team_id: int, db=Depends(get_db)):
    team = db.query(HackFindTeam).filter(HackFindTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_team(team, db)

@app.post("/hackfind/teams", response_model=TeamOut)
def create_hackfind_team(
    payload: TeamCreate,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    name = payload.name.strip()
    hackathon = payload.hackathon.strip()
    if not name or not hackathon:
        raise HTTPException(status_code=400, detail="Team name and hackathon are required")

    problem = payload.problem_statement or payload.problemStatement or ""
    skills_val = format_list(payload.skills)
    tech_val = format_list(payload.tech_stack or payload.techStack)
    max_m = payload.max_members or payload.maxMembers or 4

    team = HackFindTeam(
        name=name,
        hackathon=hackathon,
        problem_statement=problem.strip() or None,
        description=(payload.description or "").strip() or None,
        skills=skills_val,
        tech_stack=tech_val,
        max_members=max_m,
        leader_id=current_user.user_id,
        contact=(payload.contact or "").strip() or None,
        created_at=datetime.utcnow()
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # Leader automatically added as Team Lead
    member = HackFindTeamMember(
        team_id=team.id,
        user_id=current_user.user_id,
        role="Team Lead",
        joined_at=datetime.utcnow()
    )
    db.add(member)
    db.commit()
    db.refresh(team)

    return serialize_team(team, db)

@app.delete("/hackfind/teams/{team_id}", status_code=204)
def delete_hackfind_team(
    team_id: int,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    team = db.query(HackFindTeam).filter(HackFindTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only the team leader can delete this team")

    db.delete(team)
    db.commit()

@app.get("/hackfind/people", response_model=list[PersonOut])
def list_hackfind_people(
    search: str | None = None,
    filter: str | None = None,
    db=Depends(get_db)
):
    query = db.query(HackFindProfile)
    if search and search.strip():
        q = f"%{search.strip()}%"
        query = query.join(Users, HackFindProfile.user_id == Users.user_id).filter(or_(
            Users.name.ilike(q),
            HackFindProfile.role.ilike(q),
            HackFindProfile.hackathon.ilike(q),
            HackFindProfile.about.ilike(q),
            HackFindProfile.skills.ilike(q),
            HackFindProfile.tech_stack.ilike(q),
        ))
    if filter in ("Open to Work", "Open to join", "open"):
        query = query.filter(or_(HackFindProfile.status == "open", HackFindProfile.status == "open_to_join"))
    elif filter in ("Occupied", "Team found", "occupied"):
        query = query.filter(or_(HackFindProfile.status == "occupied", HackFindProfile.status == "team_found"))

    profiles = query.order_by(HackFindProfile.created_at.desc()).all()
    return [serialize_person(p, db) for p in profiles]

@app.get("/hackfind/people/{person_id}", response_model=PersonOut)
def get_hackfind_person(person_id: int, db=Depends(get_db)):
    profile = db.query(HackFindProfile).filter(HackFindProfile.id == person_id).first()
    if not profile:
        profile = db.query(HackFindProfile).filter(HackFindProfile.user_id == person_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return serialize_person(profile, db)

@app.post("/hackfind/people", response_model=PersonOut)
def create_hackfind_profile(
    payload: PersonCreate,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # Enforce one profile per user rule on backend
    existing = db.query(HackFindProfile).filter(HackFindProfile.user_id == current_user.user_id).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="You already have a HackMate profile. Please edit your existing profile instead."
        )

    role = (payload.role or "").strip()
    if not role:
        raise HTTPException(status_code=400, detail="Primary Role is required")

    skills_val = format_list(payload.skills)
    if not skills_val:
        raise HTTPException(status_code=400, detail="Key Skills is required")

    contact = (payload.contact or "").strip()
    if not contact:
        raise HTTPException(status_code=400, detail="Contact Info is required")

    hackathon = (payload.hackathon or "").strip() or None
    tech_val = format_list(payload.tech_stack or payload.techStack)

    try:
        profile = HackFindProfile(
            user_id=current_user.user_id,
            role=role,
            hackathon=hackathon or "",
            skills=skills_val,
            tech_stack=tech_val,
            experience=(payload.experience or "").strip() or None,
            about=(payload.about or "").strip() or None,
            portfolio=(payload.portfolio or "").strip() or None,
            contact=contact,
            status=normalize_availability_status(payload.status),
            created_at=datetime.utcnow()
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return serialize_person(profile, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@app.put("/hackfind/people/{person_id}", response_model=PersonOut)
@app.put("/hackfind/people", response_model=PersonOut)
def update_hackfind_profile(
    person_id: int | None = None,
    payload: PersonUpdate = None,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if person_id is not None:
        profile = db.query(HackFindProfile).filter(HackFindProfile.id == person_id).first()
        if not profile:
            profile = db.query(HackFindProfile).filter(HackFindProfile.user_id == person_id).first()
    else:
        profile = db.query(HackFindProfile).filter(HackFindProfile.user_id == current_user.user_id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if profile.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this profile")

    changes = payload.model_dump(exclude_unset=True) if payload else {}

    if "role" in changes:
        role = (changes["role"] or "").strip()
        if not role:
            raise HTTPException(status_code=400, detail="Primary Role cannot be empty")
        profile.role = role

    if "skills" in changes:
        skills_val = format_list(changes["skills"])
        if not skills_val:
            raise HTTPException(status_code=400, detail="Key Skills cannot be empty")
        profile.skills = skills_val

    if "contact" in changes:
        contact = (changes["contact"] or "").strip()
        if not contact:
            raise HTTPException(status_code=400, detail="Contact Info cannot be empty")
        profile.contact = contact

    if "hackathon" in changes:
        profile.hackathon = (changes["hackathon"] or "").strip() or ""

    if "tech_stack" in changes or "techStack" in changes:
        profile.tech_stack = format_list(changes.get("tech_stack") or changes.get("techStack"))

    if "experience" in changes:
        profile.experience = (changes["experience"] or "").strip() or None

    if "about" in changes:
        profile.about = (changes["about"] or "").strip() or None

    if "portfolio" in changes:
        profile.portfolio = (changes["portfolio"] or "").strip() or None

    if "status" in changes and changes["status"] is not None:
        profile.status = normalize_availability_status(changes["status"])

    try:
        db.commit()
        db.refresh(profile)
        return serialize_person(profile, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.get("/hackfind/users/me/profile", response_model=PersonOut | None)
def get_my_hackfind_profile(
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    profile = db.query(HackFindProfile).filter(HackFindProfile.user_id == current_user.user_id).first()
    if not profile:
        return None
    return serialize_person(profile, db)

@app.get("/hackfind/users/me/teams", response_model=MyTeamsOut)
def get_my_hackfind_teams(
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    user_id = current_user.user_id

    leading_teams = db.query(HackFindTeam).filter(HackFindTeam.leader_id == user_id).order_by(HackFindTeam.created_at.desc()).all()
    leading_serialized = [serialize_team(t, db) for t in leading_teams]

    joined_memberships = db.query(HackFindTeamMember).filter(
        HackFindTeamMember.user_id == user_id
    ).all()
    joined_serialized = []
    for jm in joined_memberships:
        team = db.query(HackFindTeam).filter(HackFindTeam.id == jm.team_id).first()
        if team and team.leader_id != user_id:
            joined_serialized.append(serialize_team(team, db))

    my_requests = db.query(HackFindTeamRequest).filter(
        HackFindTeamRequest.user_id == user_id
    ).order_by(HackFindTeamRequest.created_at.desc()).all()

    pending_list = []
    for req in my_requests:
        team = db.query(HackFindTeam).filter(HackFindTeam.id == req.team_id).first()
        if team:
            req_out = serialize_request(req, db)
            team_out = serialize_team(team, db)
            pending_list.append(PendingRequestWithTeamOut(
                request=req_out,
                team=team_out,
                id=str(req.id),
                team_id=str(team.id),
                teamId=str(team.id),
                team_name=team.name,
                teamName=team.name,
                team_hackathon=team.hackathon,
                teamHackathon=team.hackathon,
                role=req.role or "Applicant",
                status=req.status or "pending",
                notes=req.notes,
                created_at=req_out.created_at,
                createdAt=req_out.createdAt
            ))

    return MyTeamsOut(
        leading=leading_serialized,
        joined=joined_serialized,
        pending=pending_list
    )

@app.post("/hackfind/teams/{team_id}/requests", response_model=JoinRequestOut)
def request_to_join_team(
    team_id: int,
    payload: JoinRequestCreate,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    user_id = current_user.user_id
    team = db.query(HackFindTeam).filter(HackFindTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id == user_id:
        raise HTTPException(status_code=403, detail="Cannot request to join your own team")

    # Check if already a member
    already_member = db.query(HackFindTeamMember).filter(
        HackFindTeamMember.team_id == team_id,
        HackFindTeamMember.user_id == user_id
    ).first()
    if already_member:
        raise HTTPException(status_code=409, detail="You are already a member of this team")

    # Check capacity
    member_count = db.query(HackFindTeamMember).filter(HackFindTeamMember.team_id == team_id).count()
    if member_count >= team.max_members:
        raise HTTPException(status_code=409, detail="Team is already full")

    # Check existing request
    existing_req = db.query(HackFindTeamRequest).filter(
        HackFindTeamRequest.team_id == team_id,
        HackFindTeamRequest.user_id == user_id
    ).first()
    if existing_req:
        if existing_req.status == "pending":
            raise HTTPException(status_code=409, detail="You already have a pending request for this team")
        existing_req.status = "pending"
        existing_req.notes = (payload.notes or "").strip() or None
        existing_req.skills = format_list(payload.skills)
        existing_req.role = (payload.role or "Team Member").strip()
        existing_req.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_req)
        return serialize_request(existing_req, db)

    skills_val = format_list(payload.skills)
    new_req = HackFindTeamRequest(
        team_id=team_id,
        user_id=user_id,
        role=(payload.role or "Team Member").strip(),
        skills=skills_val,
        notes=(payload.notes or "").strip() or None,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return serialize_request(new_req, db)

@app.get("/hackfind/teams/{team_id}/requests", response_model=list[JoinRequestOut])
def list_team_join_requests(
    team_id: int,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    team = db.query(HackFindTeam).filter(HackFindTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only the team leader can view join requests")

    requests = db.query(HackFindTeamRequest).filter(
        HackFindTeamRequest.team_id == team_id
    ).order_by(HackFindTeamRequest.created_at.desc()).all()

    return [serialize_request(r, db) for r in requests]

@app.post("/hackfind/teams/{team_id}/requests/{req_id}/respond", response_model=JoinRequestOut)
def respond_to_join_request(
    team_id: int,
    req_id: int,
    payload: JoinRequestRespond,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    team = db.query(HackFindTeam).filter(HackFindTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only the team leader can respond to requests")

    req = db.query(HackFindTeamRequest).filter(
        HackFindTeamRequest.id == req_id,
        HackFindTeamRequest.team_id == team_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    action = payload.action.lower()
    if action not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Action must be 'accepted' or 'rejected'")

    if action == "accepted":
        member_count = db.query(HackFindTeamMember).filter(HackFindTeamMember.team_id == team_id).count()
        if member_count >= team.max_members:
            raise HTTPException(status_code=409, detail="Team capacity is already full")

        existing_m = db.query(HackFindTeamMember).filter(
            HackFindTeamMember.team_id == team_id,
            HackFindTeamMember.user_id == req.user_id
        ).first()
        if not existing_m:
            new_m = HackFindTeamMember(
                team_id=team_id,
                user_id=req.user_id,
                role=req.role or "Member",
                joined_at=datetime.utcnow()
            )
            db.add(new_m)

    req.status = action
    db.commit()
    db.refresh(req)
    return serialize_request(req, db)

@app.delete("/hackfind/teams/{team_id}/members/{member_id}", status_code=204)
def remove_hackfind_team_member(
    team_id: int,
    member_id: int,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    team = db.query(HackFindTeam).filter(HackFindTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only the team leader can remove members")
    if member_id == team.leader_id:
        raise HTTPException(status_code=400, detail="Cannot remove the team leader from the team")

    member = db.query(HackFindTeamMember).filter(
        HackFindTeamMember.team_id == team_id,
        HackFindTeamMember.user_id == member_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in team")

    db.delete(member)
    db.commit()

@app.delete("/hackfind/teams/{team_id}/leave", status_code=204)
def leave_hackfind_team(
    team_id: int,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    team = db.query(HackFindTeam).filter(HackFindTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Team leader cannot leave the team without transferring leadership or deleting the team")

    member = db.query(HackFindTeamMember).filter(
        HackFindTeamMember.team_id == team_id,
        HackFindTeamMember.user_id == current_user.user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="You are not a member of this team")

    db.delete(member)
    db.commit()


# =====================================================================
# LOST & FOUND CONSTANTS & SERIALIZER HELPERS
# =====================================================================

VALID_LF_TYPES = {"lost", "found"}
VALID_LF_CATEGORIES = {"Electronics", "Cards & IDs", "Keys", "Clothing", "Books", "Other"}
VALID_LF_STATUSES = {"open", "claimed", "resolved"}
VALID_LF_SORTS = {"newest", "oldest"}

def serialize_lost_found_message(msg: LostFoundMessage, db) -> MessageOut:
    user = msg.user
    if not user and msg.user_id:
        user = db.query(Users).filter(Users.user_id == msg.user_id).first()
    user_name = user.name if user else f"User {msg.user_id}"
    user_roll = user.roll_no if user else None

    return MessageOut(
        id=msg.id,
        item_id=msg.item_id,
        user_id=msg.user_id,
        message=msg.message,
        created_at=msg.created_at or datetime.utcnow(),
        user_name=user_name,
        user_roll_no=user_roll
    )

def serialize_lost_found_item(item: LostFoundItem, db) -> ItemOut:
    user = item.user
    if not user and item.user_id:
        user = db.query(Users).filter(Users.user_id == item.user_id).first()
    user_name = user.name if user else f"User {item.user_id}"
    user_roll = user.roll_no if user else None

    messages_out = [serialize_lost_found_message(m, db) for m in (item.messages or [])]

    return ItemOut(
        id=item.id,
        user_id=item.user_id,
        title=item.title,
        type=item.type,
        category=item.category,
        location=item.location,
        item_date=item.item_date,
        description=item.description,
        contact_info=item.contact_info,
        image_url=item.image_url,
        status=item.status or "open",
        created_at=item.created_at or datetime.utcnow(),
        user_name=user_name,
        user_roll_no=user_roll,
        messages=messages_out
    )


# =====================================================================
# LOST & FOUND API ENDPOINTS
# =====================================================================

@app.get("/lost-found/items", response_model=list[ItemOut])
def list_lost_found_items(
    type: str | None = None,
    category: str | None = None,
    status: str | None = None,
    search: str | None = None,
    sort: str = "newest",
    db=Depends(get_db)
):
    query = db.query(LostFoundItem)

    if type and type.strip():
        query = query.filter(LostFoundItem.type == type.strip().lower())

    if category and category.strip():
        query = query.filter(LostFoundItem.category == category.strip())

    if status and status.strip():
        query = query.filter(LostFoundItem.status == status.strip().lower())

    if search and search.strip():
        q = f"%{search.strip()}%"
        query = query.filter(or_(
            LostFoundItem.title.ilike(q),
            LostFoundItem.description.ilike(q),
            LostFoundItem.location.ilike(q),
            LostFoundItem.category.ilike(q)
        ))

    # 30-day marketplace rule: items remain visible on the main feed for a maximum of 30 days
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    query = query.filter(LostFoundItem.created_at >= cutoff_date)

    sort_clean = (sort or "newest").strip().lower()
    if sort_clean not in VALID_LF_SORTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort '{sort}'. Must be one of: {', '.join(sorted(VALID_LF_SORTS))}"
        )

    if sort_clean == "oldest":
        query = query.order_by(LostFoundItem.created_at.asc())
    else:
        query = query.order_by(LostFoundItem.created_at.desc())

    items = query.all()
    return [serialize_lost_found_item(item, db) for item in items]

@app.get("/lost-found/items/{item_id}", response_model=ItemOut)
def get_lost_found_item(item_id: int, db=Depends(get_db)):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return serialize_lost_found_item(item, db)

@app.post("/lost-found/items", response_model=ItemOut)
def create_lost_found_item(
    payload: ItemCreate,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    item_type = payload.type.strip().lower()
    if item_type not in VALID_LF_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type '{payload.type}'. Must be one of: {', '.join(sorted(VALID_LF_TYPES))}"
        )

    category = payload.category.strip()
    if category not in VALID_LF_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{payload.category}'. Must be one of: {', '.join(sorted(VALID_LF_CATEGORIES))}"
        )

    location = payload.location.strip()
    if not location:
        raise HTTPException(status_code=400, detail="Location is required")

    try:
        item = LostFoundItem(
            user_id=current_user.user_id,
            title=title,
            type=item_type,
            category=category,
            location=location,
            item_date=payload.item_date,
            description=payload.description.strip() if payload.description else None,
            contact_info=payload.contact_info.strip() if payload.contact_info else None,
            image_url=payload.image_url.strip() if payload.image_url else None,
            status="open",
            created_at=datetime.utcnow()
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return serialize_lost_found_item(item, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create lost & found item: {str(e)}")

@app.patch("/lost-found/items/{item_id}", response_model=ItemOut)
def update_lost_found_item(
    item_id: int,
    updates: ItemUpdate,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")

    changes = updates.model_dump(exclude_unset=True)

    if "title" in changes:
        title = (changes["title"] or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        item.title = title

    if "type" in changes:
        item_type = (changes["type"] or "").strip().lower()
        if item_type not in VALID_LF_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid type '{changes['type']}'. Must be one of: {', '.join(sorted(VALID_LF_TYPES))}"
            )
        item.type = item_type

    if "category" in changes:
        category = (changes["category"] or "").strip()
        if category not in VALID_LF_CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category '{changes['category']}'. Must be one of: {', '.join(sorted(VALID_LF_CATEGORIES))}"
            )
        item.category = category

    if "location" in changes:
        location = (changes["location"] or "").strip()
        if not location:
            raise HTTPException(status_code=400, detail="Location cannot be empty")
        item.location = location

    if "item_date" in changes and changes["item_date"] is not None:
        item.item_date = changes["item_date"]

    if "description" in changes:
        item.description = changes["description"].strip() if changes["description"] else None

    if "contact_info" in changes:
        item.contact_info = changes["contact_info"].strip() if changes["contact_info"] else None

    if "image_url" in changes:
        item.image_url = changes["image_url"].strip() if changes["image_url"] else None

    try:
        db.commit()
        db.refresh(item)
        return serialize_lost_found_item(item, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update lost & found item: {str(e)}")

@app.patch("/lost-found/items/{item_id}/status", response_model=ItemOut)
def update_lost_found_item_status(
    item_id: int,
    payload: ItemStatusUpdate,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to change status for this listing")

    new_status = payload.status.strip().lower()
    if new_status not in VALID_LF_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Must be one of: {', '.join(sorted(VALID_LF_STATUSES))}"
        )

    item.status = new_status
    try:
        db.commit()
        db.refresh(item)
        return serialize_lost_found_item(item, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update item status: {str(e)}")

@app.delete("/lost-found/items/{item_id}", status_code=204)
def delete_lost_found_item(
    item_id: int,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")

    try:
        db.delete(item)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")

@app.get("/lost-found/users/me/items", response_model=list[ItemOut])
def get_my_lost_found_items(
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    items = db.query(LostFoundItem).filter(
        LostFoundItem.user_id == current_user.user_id
    ).order_by(LostFoundItem.created_at.desc()).all()

    return [serialize_lost_found_item(item, db) for item in items]

@app.post("/lost-found/items/{item_id}/messages", response_model=MessageOut)
def create_lost_found_message(
    item_id: int,
    payload: MessageCreate,
    db=Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    content = payload.message.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    msg = LostFoundMessage(
        item_id=item_id,
        user_id=current_user.user_id,
        message=content,
        created_at=datetime.utcnow()
    )
    try:
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return serialize_lost_found_message(msg, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create message: {str(e)}")

@app.get("/lost-found/items/{item_id}/messages", response_model=list[MessageOut])
def list_lost_found_messages(item_id: int, db=Depends(get_db)):
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    messages = db.query(LostFoundMessage).filter(
        LostFoundMessage.item_id == item_id
    ).order_by(LostFoundMessage.created_at.asc()).all()

    return [serialize_lost_found_message(msg, db) for msg in messages]