from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI,Depends, HTTPException
from model import CabQuery, CabQueryOut,CabQueryCreate, CabQueryUpdate, CabRequestOut, CabRequestUpdate, CabRequests,UserLogin
from database import get_db

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