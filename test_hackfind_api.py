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
