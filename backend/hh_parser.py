from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import requests
import logging

app = FastAPI()
logger = logging.getLogger("uvicorn.access")

@app.get("/match-hh")
def match_hh(query: str, page: int = 0):
    url = "https://api.hh.ru/vacancies"
    params = {
        "text": query,
        "page": page,
        "per_page": 50,
        "area": 1
    }
    response = requests.get(url, params=params)
    data = response.json()
    return data.get("items", [])

