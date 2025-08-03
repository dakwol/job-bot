import os
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from routes import endpoints

app = FastAPI()
app.include_router(endpoints.router)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    import datetime
    return {"message": f"HH Matcher API {datetime.datetime.now()}"}

@app.get("/routes")
def list_routes():
    return [route.path for route in app.routes]
