import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from main import app
from database import Base, get_db
from model import Users
from security import create_access_token

# Setup isolated in-memory test database
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_environment():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    
    # Ensure test users exist in test db
    u5 = Users(user_id=5, roll_no="2023110005", email_id="user5@iiitkottayam.ac.in", name="Dharun S")
    u4 = Users(user_id=4, roll_no="2023110004", email_id="user4@iiitkottayam.ac.in", name="Rohit Verma")
    u6 = Users(user_id=6, roll_no="2023110006", email_id="user6@iiitkottayam.ac.in", name="Sneha Menon")
    db.add_all([u5, u4, u6])
    db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()

def get_auth_headers(user_id: int):
    token = create_access_token({"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}

def test_unauthorized_endpoints():
    # 18. Unauthorized requests return 401
    res = client.post("/hackfind/teams", json={"name": "Test", "hackathon": "SIH"})
    assert res.status_code == 401

    res = client.get("/hackfind/users/me/teams")
    assert res.status_code == 401

def test_create_and_list_teams():
    # 1. Create team
    headers_u5 = get_auth_headers(5)
    payload = {
        "name": "Backend Test Team",
        "hackathon": "HackOMania 2026",
        "problem_statement": "Automated campus resource allocation",
        "description": "Building full stack solution",
        "skills": ["Python", "FastAPI", "React"],
        "tech_stack": ["PostgreSQL", "Docker"],
        "max_members": 3,
        "contact": "Discord: lead#123"
    }
    res = client.post("/hackfind/teams", json=payload, headers=headers_u5)
    assert res.status_code == 200, res.text
    team_data = res.json()
    team_id = int(team_data["id"])
    assert team_data["name"] == "Backend Test Team"
    assert team_data["leaderId"] == "5"
    assert team_data["status"] == "looking_for_members"
    assert len(team_data["members"]) == 1
    assert team_data["members"][0]["role"] == "Team Lead"

    # 2. List teams
    res_list = client.get("/hackfind/teams?search=Backend")
    assert res_list.status_code == 200
    teams = res_list.json()
    assert any(t["id"] == str(team_id) for t in teams)

    # 3. Get team
    res_get = client.get(f"/hackfind/teams/{team_id}")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Backend Test Team"

def test_join_request_and_acceptance_flow():
    headers_u5 = get_auth_headers(5) # Leader
    headers_u4 = get_auth_headers(4) # Applicant 1
    headers_u6 = get_auth_headers(6) # Applicant 2

    # Create team with max_members = 2
    team_payload = {
        "name": "Small Team 2",
        "hackathon": "DevHacks",
        "max_members": 2,
        "skills": ["Go", "React"]
    }
    team_res = client.post("/hackfind/teams", json=team_payload, headers=headers_u5)
    assert team_res.status_code == 200, team_res.text
    team_id = int(team_res.json()["id"])

    # 8. User 4 requests to join
    req_payload = {
        "notes": "I would love to join Small Team 2!",
        "role": "Frontend Dev",
        "skills": ["React", "CSS"]
    }
    req_res = client.post(f"/hackfind/teams/{team_id}/requests", json=req_payload, headers=headers_u4)
    assert req_res.status_code == 200, req_res.text
    req_data = req_res.json()
    req_id = int(req_data["id"])
    assert req_data["status"] == "pending"

    # 9. Duplicate request rejection (409)
    dup_res = client.post(f"/hackfind/teams/{team_id}/requests", json=req_payload, headers=headers_u4)
    assert dup_res.status_code == 409

    # 13. Leader lists team requests
    list_reqs = client.get(f"/hackfind/teams/{team_id}/requests", headers=headers_u5)
    assert list_reqs.status_code == 200
    assert any(r["id"] == str(req_id) for r in list_reqs.json())

    # 19. Non-leader cannot view or accept requests (403)
    non_leader_reqs = client.get(f"/hackfind/teams/{team_id}/requests", headers=headers_u4)
    assert non_leader_reqs.status_code == 403

    non_leader_accept = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json={"action": "accepted"},
        headers=headers_u4
    )
    assert non_leader_accept.status_code == 403

    # 11. Leader accepts request
    accept_res = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json={"action": "accepted"},
        headers=headers_u5
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # Team is now FULL (capacity 2 / 2)
    team_full_check = client.get(f"/hackfind/teams/{team_id}")
    assert team_full_check.json()["status"] == "full"
    assert len(team_full_check.json()["members"]) == 2

    # 10. Full team rejection for applicant 3 (409)
    full_req_res = client.post(
        f"/hackfind/teams/{team_id}/requests",
        json={"notes": "Can I still join?"},
        headers=headers_u6
    )
    assert full_req_res.status_code == 409

    # 14. Leader removes member
    rem_res = client.delete(f"/hackfind/teams/{team_id}/members/4", headers=headers_u5)
    assert rem_res.status_code == 204

    # Status back to looking_for_members
    team_avail_check = client.get(f"/hackfind/teams/{team_id}")
    assert team_avail_check.json()["status"] == "looking_for_members"

    # 4. Delete team
    del_res = client.delete(f"/hackfind/teams/{team_id}", headers=headers_u5)
    assert del_res.status_code == 204

def test_candidate_profile_and_my_teams():
    headers_u4 = get_auth_headers(4)

    # 5. Create Candidate Profile
    prof_payload = {
        "role": "Mobile Developer",
        "hackathon": "SIH 2026",
        "skills": ["React Native", "TypeScript"],
        "tech_stack": ["FastAPI", "Docker"],
        "experience": "2 years",
        "about": "Building mobile apps",
        "portfolio": "github.com/rohit",
        "contact": "rohit@iiitk.ac.in",
        "status": "open_to_join"
    }
    prof_res = client.post("/hackfind/people", json=prof_payload, headers=headers_u4)
    assert prof_res.status_code == 200, prof_res.text
    prof_data = prof_res.json()
    assert prof_data["role"] == "Mobile Developer"
    assert prof_data["userId"] == "4"

    # 6. List People
    people_res = client.get("/hackfind/people?search=Mobile")
    assert people_res.status_code == 200
    assert any(p["userId"] == "4" for p in people_res.json())

    # 7. Get Person
    person_res = client.get(f"/hackfind/people/{prof_data['id']}")
    assert person_res.status_code == 200
    assert person_res.json()["role"] == "Mobile Developer"

    # 16. My Teams endpoint
    my_teams_res = client.get("/hackfind/users/me/teams", headers=headers_u4)
    assert my_teams_res.status_code == 200
    data = my_teams_res.json()
    assert "leading" in data
    assert "joined" in data
    assert "pending" in data

def test_invite_to_team_flow():
    headers_u5 = get_auth_headers(5) # Team Leader
    headers_u4 = get_auth_headers(4) # Candidate Open
    headers_u6 = get_auth_headers(6) # Candidate Occupied

    # 1. User 5 creates a team
    team_payload = {
        "name": "Super Nova Team",
        "hackathon": "SIH 2026",
        "max_members": 2,
        "skills": ["Python", "FastAPI"]
    }
    team_res = client.post("/hackfind/teams", json=team_payload, headers=headers_u5)
    assert team_res.status_code == 200
    team_id = int(team_res.json()["id"])

    # 2. User 4 creates an "open" profile
    prof_u4 = {
        "role": "Frontend Dev",
        "hackathon": "SIH 2026",
        "skills": ["React"],
        "contact": "rohit@iiitk.ac.in",
        "status": "open"
    }
    res_prof4 = client.post("/hackfind/people", json=prof_u4, headers=headers_u4)
    assert res_prof4.status_code == 200

    # 3. User 6 creates an "occupied" profile
    prof_u6 = {
        "role": "Designer",
        "hackathon": "SIH 2026",
        "skills": ["Figma"],
        "contact": "sneha@iiitk.ac.in",
        "status": "occupied"
    }
    res_prof6 = client.post("/hackfind/people", json=prof_u6, headers=headers_u6)
    assert res_prof6.status_code == 200

    # CASE A: Leader invites Open candidate (User 4) -> SUCCESS
    invite_payload = {
        "userId": 4,
        "role": "Frontend Dev",
        "notes": "Join our SIH team!"
    }
    invite_res = client.post(f"/hackfind/teams/{team_id}/invites", json=invite_payload, headers=headers_u5)
    assert invite_res.status_code == 200, invite_res.text
    invite_data = invite_res.json()
    assert invite_data["teamId"] == str(team_id)
    assert invite_data["userId"] == "4"
    assert invite_data["status"] == "pending"

    # CASE B: Leader invites Occupied candidate (User 6) -> REJECTED (400)
    occupied_invite_res = client.post(
        f"/hackfind/teams/{team_id}/invites",
        json={"userId": 6},
        headers=headers_u5
    )
    assert occupied_invite_res.status_code == 400
    assert "occupied" in occupied_invite_res.json()["detail"].lower()

    # CASE C: Non-member cannot invite to team (403)
    non_member_res = client.post(
        f"/hackfind/teams/{team_id}/invites",
        json={"userId": 4},
        headers=headers_u4
    )
    assert non_member_res.status_code == 403

    # Duplicate pending invite rejection (409)
    dup_res = client.post(
        f"/hackfind/teams/{team_id}/invites",
        json={"userId": 4},
        headers=headers_u5
    )
    assert dup_res.status_code == 409

def test_join_request_accept_with_status_payload_and_double_accept():
    headers_u5 = get_auth_headers(5)  # Team Leader (Account A)
    headers_u4 = get_auth_headers(4)  # Candidate (Account B)

    # 1. Account A creates a real HackMate team
    team_payload = {
        "name": "Alpha Builders",
        "hackathon": "HackFest 2026",
        "max_members": 3,
        "skills": ["Python", "FastAPI"]
    }
    team_res = client.post("/hackfind/teams", json=team_payload, headers=headers_u5)
    assert team_res.status_code == 200, team_res.text
    team_id = int(team_res.json()["id"])
    assert len(team_res.json()["members"]) == 1

    # 2. Account B submits a join request to Account A's team
    req_payload = {
        "role": "Backend Engineer",
        "skills": ["FastAPI", "PostgreSQL"],
        "notes": "Excited to join Alpha Builders!"
    }
    req_res = client.post(f"/hackfind/teams/{team_id}/requests", json=req_payload, headers=headers_u4)
    assert req_res.status_code == 200, req_res.text
    req_data = req_res.json()
    req_id = int(req_data["id"])
    assert req_data["userId"] == "4"
    assert req_data["teamId"] == str(team_id)
    assert req_data["status"] == "pending"

    # 3. Account A opens team requests and sees Account B's request
    reqs_res = client.get(f"/hackfind/teams/{team_id}/requests", headers=headers_u5)
    assert reqs_res.status_code == 200
    all_reqs = reqs_res.json()
    assert len(all_reqs) == 1
    assert all_reqs[0]["id"] == str(req_id)
    assert all_reqs[0]["userId"] == "4"

    # 4. Account A taps ACCEPT using payload with {"status": "accepted"} (exact frontend payload)
    accept_res = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json={"status": "accepted"},
        headers=headers_u5
    )
    assert accept_res.status_code == 200, accept_res.text
    accept_data = accept_res.json()
    assert accept_data["status"] == "accepted"
    assert accept_data["id"] == str(req_id)

    # 5. Verify Account B becomes a team member & member count increases
    team_check = client.get(f"/hackfind/teams/{team_id}")
    assert team_check.status_code == 200
    team_detail = team_check.json()
    assert len(team_detail["members"]) == 2
    member_ids = [m["id"] for m in team_detail["members"]]
    assert "4" in member_ids
    assert "5" in member_ids

    # 6. Verify request cannot be accepted twice (HTTP 400)
    double_accept_res = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json={"status": "accepted"},
        headers=headers_u5
    )
    assert double_accept_res.status_code == 400
    assert "already been accepted" in double_accept_res.json()["detail"].lower()

def test_join_request_reject_flow():
    headers_u5 = get_auth_headers(5)  # Team Leader (Account A)
    headers_u6 = get_auth_headers(6)  # Candidate (Account C)

    # 1. Create team
    team_res = client.post(
        "/hackfind/teams",
        json={"name": "Reject Test Team", "hackathon": "SIH 2026", "max_members": 4},
        headers=headers_u5
    )
    assert team_res.status_code == 200
    team_id = int(team_res.json()["id"])

    # 2. Candidate requests to join
    req_res = client.post(
        f"/hackfind/teams/{team_id}/requests",
        json={"role": "Designer", "notes": "Portfolio link in profile"},
        headers=headers_u6
    )
    assert req_res.status_code == 200
    req_id = int(req_res.json()["id"])

    # 3. Leader rejects request with {"status": "rejected"}
    reject_res = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json={"status": "rejected"},
        headers=headers_u5
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"

    # 4. Verify candidate is NOT a team member
    team_check = client.get(f"/hackfind/teams/{team_id}")
    assert len(team_check.json()["members"]) == 1
    assert team_check.json()["members"][0]["id"] == "5"

def test_end_to_end_accept_flow_with_frontend_payload():
    # Complete 12-step verification of HackMate join-request accept flow
    headers_u5 = get_auth_headers(5)  # Account A (Leader)
    headers_u4 = get_auth_headers(4)  # Account B (Candidate)

    # 1. Account A creates a real HackMate team
    team_res = client.post(
        "/hackfind/teams",
        json={
            "name": "Frontend Payload Team",
            "hackathon": "Hackathon 2026",
            "problem_statement": "Realtime Collaboration Platform",
            "description": "Building mobile and web app",
            "skills": ["React", "Python", "FastAPI"],
            "tech_stack": ["React Native", "PostgreSQL"],
            "max_members": 3,
            "contact": "leader@iiitk.ac.in"
        },
        headers=headers_u5
    )
    assert team_res.status_code == 200, f"Create team failed: {team_res.text}"
    team_data = team_res.json()
    team_id = int(team_data["id"])
    assert team_data["leaderId"] == "5"
    assert len(team_data["members"]) == 1
    assert team_data["status"] == "looking_for_members"

    # 2. Account B submits a join request to Account A's team
    join_res = client.post(
        f"/hackfind/teams/{team_id}/requests",
        json={
            "role": "Frontend Developer",
            "skills": ["React Native", "UI Design"],
            "notes": "Excited to collaborate on the mobile UI!"
        },
        headers=headers_u4
    )
    assert join_res.status_code == 200, f"Submit join request failed: {join_res.text}"
    join_data = join_res.json()
    req_id = int(join_data["id"])
    assert join_data["teamId"] == str(team_id)
    assert join_data["userId"] == "4"
    assert join_data["status"] == "pending"

    # 3. Account A opens the team details screen & lists requests
    reqs_res = client.get(f"/hackfind/teams/{team_id}/requests", headers=headers_u5)
    assert reqs_res.status_code == 200, f"List requests failed: {reqs_res.text}"
    requests_list = reqs_res.json()

    # 4. Account A sees Account B's join request
    assert len(requests_list) == 1
    found_req = requests_list[0]
    assert found_req["id"] == str(req_id)
    assert found_req["userId"] == "4"
    assert found_req["status"] == "pending"
    assert found_req["role"] == "Frontend Developer"

    # 5. Account A taps ACCEPT (exact frontend payload: action and status)
    frontend_payload = {"action": "accepted", "status": "accepted"}
    accept_res = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json=frontend_payload,
        headers=headers_u5
    )

    # 6. No "Field required" error occurs (status 200)
    assert accept_res.status_code == 200, f"Accept request failed: {accept_res.text}"
    accept_data = accept_res.json()

    # 7. The request changes to the correct accepted state
    assert accept_data["status"] == "accepted"
    assert accept_data["id"] == str(req_id)

    # 8. Account B becomes a team member & 9. Member count increases correctly
    team_after = client.get(f"/hackfind/teams/{team_id}").json()
    assert len(team_after["members"]) == 2
    member_ids = [m["id"] for m in team_after["members"]]
    assert "4" in member_ids
    assert "5" in member_ids
    assert team_after["status"] == "looking_for_members"  # 2 of 3

    # 10. The request cannot be accepted twice
    double_res = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json=frontend_payload,
        headers=headers_u5
    )
    assert double_res.status_code == 400
    assert "already been accepted" in double_res.json()["detail"].lower()

    # 11. Reject flow still works
    headers_u6 = get_auth_headers(6)
    req6_res = client.post(
        f"/hackfind/teams/{team_id}/requests",
        json={"role": "Backend Dev", "notes": "Hi"},
        headers=headers_u6
    )
    assert req6_res.status_code == 200
    req6_id = int(req6_res.json()["id"])
    reject_res = client.post(
        f"/hackfind/teams/{team_id}/requests/{req6_id}/respond",
        json={"action": "rejected", "status": "rejected"},
        headers=headers_u5
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"
    team_final = client.get(f"/hackfind/teams/{team_id}").json()
    assert len(team_final["members"]) == 2  # Member count unchanged

def test_invite_candidate_flow_and_candidate_acceptance():
    headers_u5 = get_auth_headers(5)  # Leader (Dharun S)
    headers_u4 = get_auth_headers(4)  # Candidate (Rohit Verma)

    # 1. Create team by User 5
    team_res = client.post(
        "/hackfind/teams",
        json={"name": "Code Crafters", "hackathon": "Smart India Hackathon", "max_members": 3},
        headers=headers_u5
    )
    assert team_res.status_code == 200
    team_id = int(team_res.json()["id"])

    # 2. User 4 has candidate profile
    client.post(
        "/hackfind/profiles",
        json={"role": "UI Designer", "skills": ["Figma", "React"], "contact": "rohit@iiitk.ac.in", "status": "open"},
        headers=headers_u4
    )

    # 3. User 5 invites User 4
    invite_res = client.post(
        f"/hackfind/teams/{team_id}/invites",
        json={"candidate_id": 4, "role": "Frontend Designer"},
        headers=headers_u5
    )
    assert invite_res.status_code == 200
    invite_data = invite_res.json()
    assert invite_data["type"] == "invite"
    assert invite_data["status"] == "pending"
    req_id = int(invite_data["id"])

    # 4. User 4 gets notification stating Dharun S invited them
    notif_res = client.get("/notifications", headers=headers_u4)
    assert notif_res.status_code == 200
    notifs = notif_res.json()["notifications"]
    assert len(notifs) >= 1
    assert notifs[0]["type"] == "hack_invite"
    assert "Dharun S invited you to join team 'Code Crafters'" in notifs[0]["message"]

    # 5. Leader does NOT see this as an incoming join request
    leader_reqs = client.get(f"/hackfind/teams/{team_id}/requests", headers=headers_u5).json()
    assert len(leader_reqs) == 0  # Crucial rule change: No backward requests!

    # 6. Leader can see it under invitations
    leader_invites = client.get(f"/hackfind/teams/{team_id}/invitations", headers=headers_u5).json()
    assert len(leader_invites) == 1
    assert leader_invites[0]["type"] == "invite"

    # 7. Leader cannot accept their own invite for the candidate
    leader_try_accept = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json={"action": "accepted"},
        headers=headers_u5
    )
    assert leader_try_accept.status_code == 403
    assert "Only the invited candidate" in leader_try_accept.json()["detail"]

    # 8. Candidate views team and sees invite status
    team_for_candidate = client.get(f"/hackfind/teams/{team_id}", headers=headers_u4).json()
    assert team_for_candidate["myRequestType"] == "invite"
    assert team_for_candidate["myRequestStatus"] == "pending"
    assert team_for_candidate["hasPendingRequest"] is True

    # 9. Candidate accepts invite
    candidate_accept = client.post(
        f"/hackfind/teams/{team_id}/requests/{req_id}/respond",
        json={"action": "accepted"},
        headers=headers_u4
    )
    assert candidate_accept.status_code == 200
    assert candidate_accept.json()["status"] == "accepted"

    # 10. Candidate is now a team member
    team_after = client.get(f"/hackfind/teams/{team_id}").json()
    member_ids = [m["id"] for m in team_after["members"]]
    assert "4" in member_ids
    assert len(team_after["members"]) == 2

    # 11. Leader receives notification that candidate accepted
    leader_notifs = client.get("/notifications", headers=headers_u5).json()["notifications"]
    assert len(leader_notifs) >= 1
    assert "Rohit Verma accepted your invitation" in leader_notifs[0]["message"]




