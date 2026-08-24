from datetime import datetime
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI,Depends, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests
from model import CabQuery, CabQueryOut,CabQueryCreate, CabQueryUpdate, CabRequestOut, CabRequestUpdate, CabRequests,UserLogin, GoogleAuthRequest, AuthResponse, Users
from database import get_db
from security import create_access_token
app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cabride=[
    {"loc": "madurai", "id": 1, "date" :"01/01/2001"},
    {"loc": "TVM", "id": 2, "date" :"07/07/2007"},
    {"loc": "kottayam", "id": 3, "date" :"02/02/2002"}
]

@app.post("/login",status_code=200)
def login(creds:UserLogin ,db=Depends(get_db)):
    email_id=creds.email_id
    password=creds.password
    if  email_id == "user@iiitkottayam.ac.in" and password == "qwert12345":
        return "Succesfull login"
    else :
        raise HTTPException(status_code=401,detail="invalid user details")

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

        # Future domain restriction
        RESTRICT_DOMAIN = False
        if RESTRICT_DOMAIN and email and not email.endswith('@iiitkottayam.ac.in'):
            raise HTTPException(status_code=403, detail="Email domain not allowed")

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
            
            # Extract roll_no from local part
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
            email_id=user.email_id,
            name=user.name,
            onboarding_required=onboarding_required
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail="Invalid Google token")

#create a new ride
@app.post("/cab-queries",response_model=CabQueryOut)
def add_ride(new_ride: CabQueryCreate, db=Depends(get_db)):
    ride_row = CabQuery(
        travel_date=new_ride.travel_date,
        dep_time=new_ride.dep_time,
        from_loc=new_ride.from_loc,
        to_loc=new_ride.to_loc,
        seats_avbl=new_ride.seats_avbl,
        user_id=1,
        status="open"
    )
    db.add(ride_row)
    db.commit()
    db.refresh(ride_row)
    return ride_row

#edit a ride
@app.patch('/cab-queries/{cab_id}',response_model=CabQueryOut)
def update_ride(cab_id : int,updates: CabQueryUpdate ,db=Depends(get_db)):
    query=db.query(CabQuery).filter(CabQuery.cab_id==cab_id).first()
    if query is None:
        raise HTTPException(status_code=404, detail="Ride not found")
    changes=updates.model_dump(exclude_unset=True)

    for key,value in changes.items():
        setattr(query,key,value)

    db.commit()
    db.refresh(query)
    return query


@app.delete("/cab-queries/{cab_id}",status_code=204)
def delete_ride(cab_id: int ,db=Depends(get_db)):
    query=db.query(CabQuery).filter(CabQuery.cab_id==cab_id).first()
    if query is None:
        raise HTTPException(status_code=404,detail="Ride doesnt exist")
    db.delete(query)
    db.commit()


#to search a location in the db
@app.get("/cab-queries",response_model=list[CabQueryOut])
def search_location(loc :str=None , db=Depends(get_db)):
    query=db.query(CabQuery)
    if(loc!=None):
        query=query.filter(CabQuery.from_loc.contains(loc))
    return query.all()

# to serach for a cab ride in db
@app.get("/cab-queries/{cab_id}",response_model=CabQueryOut)
def search_cab(cab_id : int,db=Depends(get_db)):
    query=db.query(CabQuery).filter(CabQuery.cab_id==cab_id).first()
    if query is None:
        raise HTTPException(status_code=404, detail="Ride not found")
    return query


@app.get("/users/me/cab-queries",response_model=list[CabQueryOut])
def me_cab_query( db=Depends(get_db)):
    user_id=1
    query=db.query(CabQuery).filter(CabQuery.user_id==user_id).all()
    return query

@app.get('/users/me/cab-requests',response_model=list[CabRequestOut])
def my_requests(db=Depends(get_db)):
    req_user_id=1
    query=db.query(CabRequests).filter(CabRequests.req_user_id==req_user_id).all()
    return query

@app.post("/cab-queries/{cab_id}/request",response_model=CabRequestOut)
def create_request(cab_id: int ,db=Depends(get_db)):
    req_user_id =1
    query=db.query(CabQuery).filter(CabQuery.cab_id==cab_id).first()
    if query is None:
        raise HTTPException(status_code=404,detail="ride does not exist")
    else:
        query=db.query(CabRequests).filter(CabRequests.req_user_id==req_user_id,
                                           CabRequests.cab_id==cab_id).first()
        if query is not None:
            raise HTTPException(status_code=409,detail="Request Already Exists")
        req_row=CabRequests(
            cab_id= cab_id,
            req_user_id=req_user_id,
            status = "open",
            created_at= datetime.now()
            )

    db.add(req_row)
    db.commit()
    db.refresh(req_row)
    return req_row

@app.patch("/cab-requests/{request_id}",response_model=CabRequestOut)
def update_request(request_id : int,update:CabRequestUpdate,db=Depends(get_db)):
    query=db.query(CabRequests).filter(CabRequests.req_id==request_id).first()
    if query is None:
        raise HTTPException(status_code=404,detail="Request not Found")
    
    if update.status== "Accepted" and query.status!= "Accepted":
        ride=db.query(CabQuery).filter(CabQuery.cab_id==query.cab_id).first()
        if ride.seats_avbl>0:
            ride.seats_avbl-=1
            setattr(query,"status",update.status)
        else:
            raise HTTPException(status_code=409,detail="No seats Available")

    else:
        setattr(query,"status",update.status)

    db.commit()
    db.refresh(query)
    return query


@app.delete("/cab-requests/{request_id}",status_code=204)
def delete_request(request_id:int,db=Depends(get_db)):
    query=db.query(CabRequests).filter(CabRequests.req_id==request_id).first()
    if query is None:
        raise HTTPException(status_code=404,detail="Request Not Found")

    db.delete(query)
    db.commit()

@app.get("/cab-queries/{cab_id}/requests",response_model=list[CabRequestOut])
def view_requests(cab_id : int,db=Depends(get_db)):
    if db.query(CabQuery).filter(CabQuery.cab_id==cab_id).first() is None :
            raise HTTPException(status_code=404,detail="Ride Not Found")
    query=db.query(CabRequests).filter(CabRequests.cab_id==cab_id).all()

    return query